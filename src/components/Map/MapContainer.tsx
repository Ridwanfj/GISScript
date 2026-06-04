'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LAYER_CONFIG, LayerKey, RDTR_ZONE_COLORS, KECAMATAN_PALETTE, KELURAHAN_PALETTE } from '@/lib/layerConfig'
import { useMapStore } from '@/store/mapStore'

function getPolygonCentroid(coordinates: any[]): [number, number] {
  let totalLng = 0, totalLat = 0, count = 0
  const traverse = (coords: any[]) => {
    if (typeof coords[0] === 'number') {
      totalLng += coords[0]
      totalLat += coords[1]
      count++
    } else {
      coords.forEach(traverse)
    }
  }
  traverse(coordinates)
  return count > 0 ? [totalLng / count, totalLat / count] : [0, 0]
}



// Semua layer ID yang dipakai di map
function getLayerIds(key: LayerKey): string[] {
  if (key === 'koordinat_menengah_dan_besar') {
    return [
      `${key}-unclustered`,
      'koordinat-kecamatan-circles',
      'koordinat-kecamatan-labels',
      'koordinat-kelurahan-circles',
      'koordinat-kelurahan-labels'
    ]
  }
  if (LAYER_CONFIG[key].type === 'fill') {
    return [`${key}-fill`, `${key}-outline`]
  }
  return [key]
}

export default function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const originalCoordinatesRef = useRef<any>(null)
  const kecCentroidsRef = useRef<any>(null)
  const kelCentroidsRef = useRef<any>(null)
  const kelToKecRef = useRef<any>(null)
  const { setMapLoaded, setMapInstance, setSelectedFeature, visibleLayers, disabledSubFilters, selectedFeature } = useMapStore()

  const enforceLayerStacking = useCallback((map: maplibregl.Map) => {
    // Use layerOrder for deterministic stacking — last activated = topmost
    const orderedKeys = useMapStore.getState().layerOrder
    for (const key of orderedKeys) {
      const ids = getLayerIds(key)
      for (const id of ids) {
        if (map.getLayer(id)) {
          map.moveLayer(id)
        }
      }
    }
  }, [])

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

      // Use the feature's actual geometry for Point features so the ring is centered precisely
      const geom = feature.geometry as GeoJSON.Geometry
      const coords: [number, number] =
        geom.type === 'Point'
          ? [geom.coordinates[0], geom.coordinates[1]]
          : [e.lngLat.lng, e.lngLat.lat]

      setSelectedFeature({
        layerKey,
        properties: parsed,
        coordinates: coords,
      })
    },
    [setSelectedFeature]
  )

  // Fungsi untuk menambahkan layer ke map setelah data di-fetch
  const addLayerToMap = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (map: maplibregl.Map, key: LayerKey, data: any) => {
      const config = LAYER_CONFIG[key] as Record<string, unknown>

      if (key === 'koordinat_menengah_dan_besar') {
        // Store original data for dynamic sector filtering and cluster recalculation
        originalCoordinatesRef.current = data

        const features = data.features || []
        const uniqueSektors = [
          ...new Set(
            features
              .map((f: { properties?: Record<string, unknown> }) => f.properties?.['Sektor'])
              .filter(Boolean)
              .map(String)
          )
        ].sort()

        const colorMap = Object.fromEntries(
          uniqueSektors.map((v, i) => [v, KELURAHAN_PALETTE[i % KELURAHAN_PALETTE.length]])
        )
        useMapStore.getState().setLayerColors(key, colorMap)

        // Calculate and store dynamic sector counts
        const sectorCounts: Record<string, number> = {}
        for (const f of features) {
          const s = String(f.properties?.['Sektor'] || '')
          if (s) {
            sectorCounts[s] = (sectorCounts[s] || 0) + 1
          }
        }
        useMapStore.getState().setLayerCounts(key, sectorCounts)

        // Fetch administrative boundary data in the background to calculate centroids and project groupings
        const [kecRes, kelRes] = await Promise.all([
          fetch('/api/layers/kecamatan').then((r) => r.json()),
          fetch('/api/layers/kelurahan').then((r) => r.json()),
        ])

        // Calculate centroids
        const kecCentroids: Record<string, [number, number]> = {}
        for (const f of kecRes.features) {
          const name = f.properties?.WADMKC
          if (name) {
            kecCentroids[name] = getPolygonCentroid(f.geometry.coordinates)
          }
        }
        kecCentroidsRef.current = kecCentroids

        const kelCentroids: Record<string, [number, number]> = {}
        for (const f of kelRes.features) {
          const name = f.properties?.NAMOBJ
          if (name) {
            kelCentroids[name] = getPolygonCentroid(f.geometry.coordinates)
          }
        }
        kelCentroidsRef.current = kelCentroids

        // Map kelurahan to kecamatan
        const kelToKec: Record<string, string> = {}
        for (const f of kelRes.features) {
          const kel = f.properties?.NAMOBJ
          const kec = f.properties?.WADMKC
          if (kel && kec) {
            kelToKec[String(kel)] = String(kec)
          }
        }
        kelToKecRef.current = kelToKec

        // Aggregate project counts and total investments by Kecamatan and Kelurahan
        const kecAgg: Record<string, { count: number; total_investasi: number; coords: [number, number] }> = {}
        const kelAgg: Record<string, { count: number; total_investasi: number; coords: [number, number] }> = {}

        const kels = Object.keys(kelCentroids)

        for (const f of features) {
          const alamat = String(f.properties?.['Alamat Lengkap'] || '')
          const cleanedInvestasi = String(f.properties?.['Jumlah Investasi'] || '0')
            .replace(/\./g, '')
            .replace(/,/g, '.')
            .replace(/[^0-9.-]+/g, '')
          const investasi = parseFloat(cleanedInvestasi) || 0

          const kelName = kels.find((k) => alamat.toLowerCase().includes(k.toLowerCase()))
          if (kelName) {
            const kecName = kelToKec[kelName]

            if (!kelAgg[kelName]) {
              kelAgg[kelName] = { count: 0, total_investasi: 0, coords: kelCentroids[kelName] }
            }
            kelAgg[kelName].count++
            kelAgg[kelName].total_investasi += investasi

            if (kecName) {
              if (!kecAgg[kecName]) {
                kecAgg[kecName] = { count: 0, total_investasi: 0, coords: kecCentroids[kecName] }
              }
              kecAgg[kecName].count++
              kecAgg[kecName].total_investasi += investasi
            }
          }
        }

        const kecProjectCounts: Record<string, number> = {}
        for (const [name, val] of Object.entries(kecAgg)) {
          kecProjectCounts[name.toUpperCase()] = val.count
        }
        useMapStore.getState().setLayerCounts('kecamatan_projects', kecProjectCounts)

        const kelProjectCounts: Record<string, number> = {}
        for (const [name, val] of Object.entries(kelAgg)) {
          kelProjectCounts[name] = val.count
        }
        useMapStore.getState().setLayerCounts('kelurahan_projects', kelProjectCounts)

        // Build GeoJSON features for aggregates
        const kecFeatures = Object.entries(kecAgg).map(([name, val]) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: val.coords,
          },
          properties: {
            isAggregate: true,
            level: 'kecamatan',
            nama_wilayah: name,
            jumlah_proyek: val.count,
            total_investasi: val.total_investasi,
          },
        }))

        const kelFeatures = Object.entries(kelAgg).map(([name, val]) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: val.coords,
          },
          properties: {
            isAggregate: true,
            level: 'kelurahan',
            nama_wilayah: name,
            jumlah_proyek: val.count,
            total_investasi: val.total_investasi,
          },
        }))

        // Add sources for aggregate levels
        map.addSource('koordinat-kecamatan-clusters', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: kecFeatures,
          },
        })

        map.addSource('koordinat-kelurahan-clusters', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: kelFeatures,
          },
        })

        // Add Kecamatan cluster circles (maxzoom: 13)
        map.addLayer({
          id: 'koordinat-kecamatan-circles',
          type: 'circle',
          source: 'koordinat-kecamatan-clusters',
          maxzoom: 13,
          paint: {
            'circle-color': '#fbbf24',
            'circle-radius': 24,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        })

        map.addLayer({
          id: 'koordinat-kecamatan-labels',
          type: 'symbol',
          source: 'koordinat-kecamatan-clusters',
          maxzoom: 13,
          layout: {
            'text-field': '{jumlah_proyek}',
            'text-size': 13,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        // Add Kelurahan cluster circles (minzoom: 13, maxzoom: 14.5)
        map.addLayer({
          id: 'koordinat-kelurahan-circles',
          type: 'circle',
          source: 'koordinat-kelurahan-clusters',
          minzoom: 13,
          maxzoom: 14.5,
          paint: {
            'circle-color': '#f59e0b',
            'circle-radius': 20,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        })

        map.addLayer({
          id: 'koordinat-kelurahan-labels',
          type: 'symbol',
          source: 'koordinat-kelurahan-clusters',
          minzoom: 13,
          maxzoom: 14.5,
          layout: {
            'text-field': '{jumlah_proyek}',
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        // Click listeners for administrative clusters
        map.on('click', 'koordinat-kecamatan-circles', (e) => {
          if (!e.features || e.features.length === 0) return
          const feature = e.features[0]
          setSelectedFeature({
            layerKey: 'koordinat_menengah_dan_besar',
            properties: feature.properties || {},
            coordinates: [e.lngLat.lng, e.lngLat.lat],
          })
        })

        map.on('mouseenter', 'koordinat-kecamatan-circles', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'koordinat-kecamatan-circles', () => {
          map.getCanvas().style.cursor = ''
        })

        map.on('click', 'koordinat-kelurahan-circles', (e) => {
          if (!e.features || e.features.length === 0) return
          const feature = e.features[0]
          setSelectedFeature({
            layerKey: 'koordinat_menengah_dan_besar',
            properties: feature.properties || {},
            coordinates: [e.lngLat.lng, e.lngLat.lat],
          })
        })
        map.on('mouseenter', 'koordinat-kelurahan-circles', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'koordinat-kelurahan-circles', () => {
          map.getCanvas().style.cursor = ''
        })

        // Point layer (hanya muncul saat minzoom: 14.5) - Tanpa clustering agar setelah Kelurahan langsung detail proyek
        map.addSource(key, {
          type: 'geojson',
          data,
        })

        map.addLayer({
          id: `${key}-unclustered`,
          type: 'circle',
          source: key,
          minzoom: 14.5,
          paint: {
            'circle-color': [
              'match',
              ['get', 'Sektor'],
              ...Object.entries(colorMap).flatMap(([val, color]) => [val, color]),
              '#f59e0b',
            ] as any,
            'circle-radius': (config.radius as number) || 7,
            'circle-stroke-width': (config.strokeWidth as number) || 1.5,
            'circle-stroke-color': (config.strokeColor as string) || '#ffffff',
          },
        })

        map.on('click', `${key}-unclustered`, (e) => handleFeatureClick(key, e))
        map.on('mouseenter', `${key}-unclustered`, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', `${key}-unclustered`, () => {
          map.getCanvas().style.cursor = ''
        })
      } else if (config.type === 'line') {
        map.addSource(key, { type: 'geojson', data })
        map.addLayer({
          id: key,
          type: 'line',
          source: key,
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
        map.addSource(key, { type: 'geojson', data })

        // Determine fill color
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fillColor: any
        if (config.colorByProperty) {
          const prop = config.colorByProperty as string
          let colorMap: Record<string, string>
          const features = data.features || []

          // Calculate and store dynamic feature counts
          const counts: Record<string, number> = {}
          for (const f of features) {
            const val = String(f.properties?.[prop] || '')
            if (val) {
              counts[val] = (counts[val] || 0) + 1
            }
          }
          useMapStore.getState().setLayerCounts(key, counts)

          if (key === 'pola_rdtr') {
            colorMap = Object.fromEntries(
              Object.entries(RDTR_ZONE_COLORS).map(([k, v]) => [k, v.color])
            )
          } else {
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

            // Extract groupings for kelurahan by WADMKC (kecamatan)
            if (key === 'kelurahan') {
              const groups: Record<string, string[]> = {}
              for (const f of features) {
                const kelName = f.properties?.NAMOBJ
                const kecName = f.properties?.WADMKC
                if (kelName && kecName) {
                  const kelStr = String(kelName)
                  const kecStr = String(kecName)
                  if (!groups[kecStr]) {
                    groups[kecStr] = []
                  }
                  if (!groups[kecStr].includes(kelStr)) {
                    groups[kecStr].push(kelStr)
                  }
                }
              }
              // Sort item lists
              for (const kec in groups) {
                groups[kec].sort()
              }
              useMapStore.getState().setLayerGroups(key, groups)
            }
          }

          useMapStore.getState().setLayerColors(key, colorMap)

          fillColor = [
            'match',
            ['get', prop],
            ...Object.entries(colorMap).flatMap(([val, color]) => [val, color]),
            '#94a3b8',
          ]
        } else {
          fillColor = (config.color as string) || '#3b82f6'
        }

        map.addLayer({
          id: `${key}-fill`,
          type: 'fill',
          source: key,
          paint: {
            'fill-color': fillColor,
            'fill-opacity': (config.opacity as number) || 0.15,
          },
        })

        map.addLayer({
          id: `${key}-outline`,
          type: 'line',
          source: key,
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

      // Enforce correct stacking order when a layer is newly added
      enforceLayerStacking(map)
    },
    [handleFeatureClick, enforceLayerStacking]
  )

  // Fungsi untuk fetch data dan tambahkan ke map
  const fetchAndAddLayer = useCallback(
    async (map: maplibregl.Map, key: LayerKey) => {
      const store = useMapStore.getState()

      // Jangan fetch ulang jika sudah loaded
      if (store.loadedLayers.has(key)) return
      // Jangan fetch ulang jika sedang loading
      if (store.loadingLayers.has(key)) return

      store.setLoading(key, true)

      try {
        const url = `/api/layers/${LAYER_CONFIG[key].tableName}`
        console.log(`[MapContainer] Fetching layer: ${key} from ${url}`)
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status} for URL: ${url}`)
        const data = await res.json()

        await addLayerToMap(map, key, data)
        store.setLoaded(key)
      } catch (err) {
        console.error(`Failed to fetch layer ${key}:`, err)
      } finally {
        store.setLoading(key, false)
      }
    },
    [addLayerToMap]
  )

  // Init map (hanya basemap, tanpa data layer)
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

    map.on('load', () => {
      mapRef.current = map
      setMapInstance(map)
      setMapLoaded(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
      setMapInstance(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React ke perubahan visibleLayers — fetch data jika belum ada, toggle visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const allKeys = Object.keys(LAYER_CONFIG) as LayerKey[]
    for (const key of allKeys) {
      const isVisible = visibleLayers.has(key)
      const ids = getLayerIds(key)

      // Cek apakah layer sudah ada di map
      const existsOnMap = ids.some((id) => map.getLayer(id))

      if (isVisible && !existsOnMap) {
        // Layer diaktifkan tapi belum ada → fetch dan tambahkan
        fetchAndAddLayer(map, key)
      } else if (existsOnMap) {
        // Layer sudah ada → toggle visibility saja
        for (const id of ids) {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', isVisible ? 'visible' : 'none')
          }
        }
      }
    }

    // Enforce correct stacking order when visibility changes
    enforceLayerStacking(map)
  }, [visibleLayers, fetchAndAddLayer, enforceLayerStacking])

  // React ke perubahan disabledSubFilters — update filter pada layer di map
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const allKeys = Object.keys(LAYER_CONFIG) as LayerKey[]
    for (const key of allKeys) {
      if (key === 'koordinat_menengah_dan_besar') {
        const source = map.getSource(key) as maplibregl.GeoJSONSource | undefined
        const sourceKec = map.getSource('koordinat-kecamatan-clusters') as maplibregl.GeoJSONSource | undefined
        const sourceKel = map.getSource('koordinat-kelurahan-clusters') as maplibregl.GeoJSONSource | undefined

        if (source && originalCoordinatesRef.current) {
          const disabledValues = Array.from(disabledSubFilters)
            .filter((val) => val.startsWith('koordinat_menengah_dan_besar:'))
            .map((val) => val.slice('koordinat_menengah_dan_besar:'.length))

          const filteredFeatures = originalCoordinatesRef.current.features.filter(
            (f: any) => !disabledValues.includes(String(f.properties?.['Sektor'] || ''))
          )

          source.setData({
            type: 'FeatureCollection',
            features: filteredFeatures,
          })

          // Dynamically recalculate Kecamatan and Kelurahan aggregates on filter change
          if (sourceKec && sourceKel && kecCentroidsRef.current && kelCentroidsRef.current && kelToKecRef.current) {
            const kecAgg: Record<string, { count: number; total_investasi: number; coords: [number, number] }> = {}
            const kelAgg: Record<string, { count: number; total_investasi: number; coords: [number, number] }> = {}

            const kels = Object.keys(kelCentroidsRef.current)

            for (const f of filteredFeatures) {
              const alamat = String(f.properties?.['Alamat Lengkap'] || '')
              const cleanedInvestasi = String(f.properties?.['Jumlah Investasi'] || '0')
                .replace(/\./g, '')
                .replace(/,/g, '.')
                .replace(/[^0-9.-]+/g, '')
              const investasi = parseFloat(cleanedInvestasi) || 0

              const kelName = kels.find((k) => alamat.toLowerCase().includes(k.toLowerCase()))
              if (kelName) {
                const kecName = kelToKecRef.current[kelName]

                if (!kelAgg[kelName]) {
                  kelAgg[kelName] = { count: 0, total_investasi: 0, coords: kelCentroidsRef.current[kelName] }
                }
                kelAgg[kelName].count++
                kelAgg[kelName].total_investasi += investasi

                if (kecName) {
                  if (!kecAgg[kecName]) {
                    kecAgg[kecName] = { count: 0, total_investasi: 0, coords: kecCentroidsRef.current[kecName] }
                  }
                  kecAgg[kecName].count++
                  kecAgg[kecName].total_investasi += investasi
                }
              }
            }

            const kecProjectCounts: Record<string, number> = {}
            for (const [name, val] of Object.entries(kecAgg)) {
              kecProjectCounts[name.toUpperCase()] = val.count
            }
            useMapStore.getState().setLayerCounts('kecamatan_projects', kecProjectCounts)

            const kelProjectCounts: Record<string, number> = {}
            for (const [name, val] of Object.entries(kelAgg)) {
              kelProjectCounts[name] = val.count
            }
            useMapStore.getState().setLayerCounts('kelurahan_projects', kelProjectCounts)

            const kecFeatures = Object.entries(kecAgg).map(([name, val]) => ({
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: val.coords,
              },
              properties: {
                isAggregate: true,
                level: 'kecamatan',
                nama_wilayah: name,
                jumlah_proyek: val.count,
                total_investasi: val.total_investasi,
              },
            }))

            const kelFeatures = Object.entries(kelAgg).map(([name, val]) => ({
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: val.coords,
              },
              properties: {
                isAggregate: true,
                level: 'kelurahan',
                nama_wilayah: name,
                jumlah_proyek: val.count,
                total_investasi: val.total_investasi,
              },
            }))

            sourceKec.setData({
              type: 'FeatureCollection',
              features: kecFeatures,
            })

            sourceKel.setData({
              type: 'FeatureCollection',
              features: kelFeatures,
            })
          }
        }
        continue
      }

      const config = LAYER_CONFIG[key]
      if (!('colorByProperty' in config) || !config.colorByProperty) continue

      const prop = config.colorByProperty as string
      const ids = getLayerIds(key)

      const disabledValues: string[] = []
      const prefix = `${key}:`
      for (const val of disabledSubFilters) {
        if (val.startsWith(prefix)) {
          disabledValues.push(val.slice(prefix.length))
        }
      }

      let filterExpression: any = null
      if (disabledValues.length > 0) {
        filterExpression = [
          'match',
          ['get', prop],
          ...disabledValues.flatMap((val) => [val, false]),
          true,
        ]
      }

      for (const id of ids) {
        if (map.getLayer(id)) {
          map.setFilter(id, filterExpression)
        }
      }
    }
  }, [disabledSubFilters])

  // ── Pulsing neon highlight for selected feature ──
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const HIGHLIGHT_SOURCE = '__highlight_pulse_src'
    const HIGHLIGHT_OUTER = '__highlight_pulse_outer'
    const HIGHLIGHT_MIDDLE = '__highlight_pulse_middle'
    const HIGHLIGHT_INNER = '__highlight_pulse_inner'

    // Clean up existing highlight layers
    const cleanupLayers = () => {
      for (const id of [HIGHLIGHT_INNER, HIGHLIGHT_MIDDLE, HIGHLIGHT_OUTER]) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      if (map.getSource(HIGHLIGHT_SOURCE)) map.removeSource(HIGHLIGHT_SOURCE)
    }

    // Only highlight point features (proyek investasi)
    if (!selectedFeature || selectedFeature.layerKey !== 'koordinat_menengah_dan_besar' || selectedFeature.properties.isAggregate) {
      cleanupLayers()
      return
    }

    const { coordinates } = selectedFeature

    // Build GeoJSON point
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates },
          properties: {},
        },
      ],
    }

    // If source already exists, just update coordinates; otherwise create layers
    const existingSource = map.getSource(HIGHLIGHT_SOURCE) as maplibregl.GeoJSONSource | undefined
    if (existingSource) {
      existingSource.setData(geojson)
    } else {
      map.addSource(HIGHLIGHT_SOURCE, { type: 'geojson', data: geojson })

      // Outer pulsing ring (large, subtle)
      map.addLayer({
        id: HIGHLIGHT_OUTER,
        type: 'circle',
        source: HIGHLIGHT_SOURCE,
        paint: {
          'circle-radius': 28,
          'circle-color': 'transparent',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000000',
          'circle-stroke-opacity': 0.3,
        },
      })

      // Middle pulsing ring
      map.addLayer({
        id: HIGHLIGHT_MIDDLE,
        type: 'circle',
        source: HIGHLIGHT_SOURCE,
        paint: {
          'circle-radius': 20,
          'circle-color': 'transparent',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#000000',
          'circle-stroke-opacity': 0.5,
        },
      })

      // Inner glow ring (bright neon core)
      map.addLayer({
        id: HIGHLIGHT_INNER,
        type: 'circle',
        source: HIGHLIGHT_SOURCE,
        paint: {
          'circle-radius': 12,
          'circle-color': 'rgba(0, 0, 0, 0.15)',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#000000',
          'circle-stroke-opacity': 0.9,
        },
      })
    }

    // ── Animate the rings with a smooth pulse ──
    let animationId: number
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      // 1.6 second cycle
      const t = (elapsed % 1600) / 1600
      // Smooth sine wave: 0 → 1 → 0
      const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2

      // Outer ring: size 24–38, opacity 0.15–0.40
      if (map.getLayer(HIGHLIGHT_OUTER)) {
        map.setPaintProperty(HIGHLIGHT_OUTER, 'circle-radius', 24 + pulse * 14)
        map.setPaintProperty(HIGHLIGHT_OUTER, 'circle-stroke-opacity', 0.15 + pulse * 0.25)
      }

      // Middle ring: size 16–24, opacity 0.3–0.7
      if (map.getLayer(HIGHLIGHT_MIDDLE)) {
        map.setPaintProperty(HIGHLIGHT_MIDDLE, 'circle-radius', 16 + pulse * 8)
        map.setPaintProperty(HIGHLIGHT_MIDDLE, 'circle-stroke-opacity', 0.3 + pulse * 0.4)
      }

      // Inner ring: size 10–14, bright neon glow
      if (map.getLayer(HIGHLIGHT_INNER)) {
        map.setPaintProperty(HIGHLIGHT_INNER, 'circle-radius', 10 + pulse * 4)
        map.setPaintProperty(HIGHLIGHT_INNER, 'circle-stroke-opacity', 0.6 + pulse * 0.4)
        map.setPaintProperty(
          HIGHLIGHT_INNER,
          'circle-color',
          `rgba(0, 0, 0, ${0.08 + pulse * 0.18})`
        )
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [selectedFeature])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
