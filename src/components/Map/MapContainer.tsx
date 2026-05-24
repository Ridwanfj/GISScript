'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LAYER_CONFIG, LayerKey, RDTR_ZONE_COLORS, KECAMATAN_PALETTE, KELURAHAN_PALETTE } from '@/lib/layerConfig'
import { useMapStore } from '@/store/mapStore'

// Semua layer ID yang dipakai di map
function getLayerIds(key: LayerKey): string[] {
  if (key === 'koordinat_menengah_dan_besar') {
    return [`${key}-clusters`, `${key}-cluster-count`, `${key}-unclustered`]
  }
  if (LAYER_CONFIG[key].type === 'fill') {
    return [`${key}-fill`, `${key}-outline`]
  }
  return [key]
}

export default function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const { setMapLoaded, setSelectedFeature, visibleLayers } = useMapStore()

  const handleFeatureClick = useCallback(
    (layerKey: LayerKey, e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return
      const feature = e.features[0]
      const props = feature.properties || {}

      // Parse stringified JSON properties
      const parsed: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) {
        try {
          parsed[k] = typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))
            ? JSON.parse(v)
            : v
        } catch {
          parsed[k] = v
        }
      }

      setSelectedFeature({
        layerKey,
        properties: parsed,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
      })
    },
    [setSelectedFeature]
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [109.1256, -6.8797],
      zoom: 12,
      maxZoom: 18,
      minZoom: 10,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }),
      'bottom-left'
    )

    map.on('load', async () => {
      mapRef.current = map
      setMapLoaded(true)

      // Fetch semua layer secara paralel
      const layerKeys = Object.keys(LAYER_CONFIG) as LayerKey[]
      const results = await Promise.all(
        layerKeys.map(async (key) => {
          try {
            const res = await fetch(`/api/layers/${LAYER_CONFIG[key].tableName}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            return { key, data }
          } catch (err) {
            console.error(`Failed to fetch layer ${key}:`, err)
            return { key, data: null }
          }
        })
      )

      // Tambahkan setiap layer ke map
      for (const { key, data } of results) {
        if (!data) continue
        // Use a looser type to allow safe property access across the union
        const config = LAYER_CONFIG[key] as Record<string, unknown>
        const isVisible = useMapStore.getState().visibleLayers.has(key)
        const visibility = isVisible ? 'visible' : 'none'

        if (key === 'koordinat_menengah_dan_besar') {
          // Point layer dengan clustering
          map.addSource(key, {
            type: 'geojson',
            data,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          })

          // Cluster circles
          map.addLayer({
            id: `${key}-clusters`,
            type: 'circle',
            source: key,
            filter: ['has', 'point_count'],
            layout: { visibility },
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#fbbf24',
                10,
                '#f97316',
                30,
                '#ef4444',
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                18,
                10,
                24,
                30,
                32,
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            },
          })

          // Cluster count label
          map.addLayer({
            id: `${key}-cluster-count`,
            type: 'symbol',
            source: key,
            filter: ['has', 'point_count'],
            layout: {
              visibility,
              'text-field': '{point_count_abbreviated}',
              'text-size': 13,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            },
            paint: {
              'text-color': '#ffffff',
            },
          })

          // Unclustered points
          map.addLayer({
            id: `${key}-unclustered`,
            type: 'circle',
            source: key,
            filter: ['!', ['has', 'point_count']],
            layout: { visibility },
            paint: {
              'circle-color': (config.color as string) || '#f59e0b',
              'circle-radius': (config.radius as number) || 7,
              'circle-stroke-width': (config.strokeWidth as number) || 1.5,
              'circle-stroke-color': (config.strokeColor as string) || '#ffffff',
            },
          })

          // Click event on unclustered points
          map.on('click', `${key}-unclustered`, (e) => handleFeatureClick(key, e))
          map.on('mouseenter', `${key}-unclustered`, () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', `${key}-unclustered`, () => {
            map.getCanvas().style.cursor = ''
          })

          // Click on cluster -> zoom in
          map.on('click', `${key}-clusters`, async (e) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: [`${key}-clusters`],
            })
            if (!features.length) return
            const clusterId = features[0].properties?.cluster_id
            const source = map.getSource(key) as maplibregl.GeoJSONSource
            try {
              const zoom = await source.getClusterExpansionZoom(clusterId)
              const geometry = features[0].geometry
              if (geometry.type === 'Point') {
                map.easeTo({
                  center: geometry.coordinates as [number, number],
                  zoom,
                })
              }
            } catch {
              // ignore cluster zoom errors
            }
          })
        } else if (config.type === 'line') {
          // Line layer
          map.addSource(key, { type: 'geojson', data })
          map.addLayer({
            id: key,
            type: 'line',
            source: key,
            layout: { visibility },
            paint: {
              'line-color': (config.color as string) || '#f43f5e',
              'line-width': (config.width as number) || 2,
              'line-opacity': 0.9,
            },
          })

          map.on('click', key, (e) => handleFeatureClick(key, e))
          map.on('mouseenter', key, () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', key, () => {
            map.getCanvas().style.cursor = ''
          })
        } else if (config.type === 'fill') {
          // Fill layer (polygon)
          map.addSource(key, { type: 'geojson', data })

          // Determine fill color
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let fillColor: any
          if (config.colorByProperty) {
            const prop = config.colorByProperty as string
            let colorMap: Record<string, string>

            if (key === 'pola_rdtr') {
              // Predefined colors for RDTR zones
              colorMap = Object.fromEntries(
                Object.entries(RDTR_ZONE_COLORS).map(([k, v]) => [k, v.color])
              )
            } else {
              // Dynamically extract unique values and assign colors
              const features = data.features || []
              const uniqueValues = [
                ...new Set(
                  features
                    .map((f: { properties?: Record<string, unknown> }) => f.properties?.[prop])
                    .filter(Boolean)
                    .map(String)
                ),
              ].sort()
              const palette = key === 'kecamatan' ? KECAMATAN_PALETTE : KELURAHAN_PALETTE
              colorMap = Object.fromEntries(
                uniqueValues.map((v, i) => [v, palette[i % palette.length]])
              )
            }

            // Store color map for legend
            useMapStore.getState().setLayerColors(key, colorMap)

            // Build match expression
            fillColor = [
              'match',
              ['get', prop],
              ...Object.entries(colorMap).flatMap(([val, color]) => [val, color]),
              '#94a3b8', // default
            ]
          } else {
            fillColor = (config.color as string) || '#3b82f6'
          }

          map.addLayer({
            id: `${key}-fill`,
            type: 'fill',
            source: key,
            layout: { visibility },
            paint: {
              'fill-color': fillColor,
              'fill-opacity': (config.opacity as number) || 0.15,
            },
          })

          // Outline
          map.addLayer({
            id: `${key}-outline`,
            type: 'line',
            source: key,
            layout: { visibility },
            paint: {
              'line-color': (config.outlineColor as string) || '#1d4ed8',
              'line-width': (config.outlineWidth as number) || 1,
            },
          })

          map.on('click', `${key}-fill`, (e) => handleFeatureClick(key, e))
          map.on('mouseenter', `${key}-fill`, () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', `${key}-fill`, () => {
            map.getCanvas().style.cursor = ''
          })
        }
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reactively toggle layer visibility when visibleLayers changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const allKeys = Object.keys(LAYER_CONFIG) as LayerKey[]
    for (const key of allKeys) {
      const ids = getLayerIds(key)
      const isVisible = visibleLayers.has(key)
      for (const id of ids) {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', isVisible ? 'visible' : 'none')
        }
      }
    }
  }, [visibleLayers])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
