import { create } from 'zustand'
import type { Map as MaplibreMap } from 'maplibre-gl'
import { LayerKey } from '@/lib/layerConfig'

interface SelectedFeature {
  layerKey: LayerKey
  properties: Record<string, unknown>
  coordinates: [number, number]
}

interface MapStore {
  // Layers yang sedang aktif (visible)
  visibleLayers: Set<LayerKey>
  toggleLayer: (key: LayerKey) => void

  // Layers yang sedang loading data dari API
  loadingLayers: Set<LayerKey>
  setLoading: (key: LayerKey, loading: boolean) => void

  // Layers yang datanya sudah di-fetch dan ditambahkan ke map
  loadedLayers: Set<LayerKey>
  setLoaded: (key: LayerKey) => void

  // Feature yang dipilih (untuk popup)
  selectedFeature: SelectedFeature | null
  setSelectedFeature: (f: SelectedFeature | null) => void

  // Map ready state
  mapLoaded: boolean
  setMapLoaded: (v: boolean) => void

  // Map instance — allows external components (e.g. SearchBar) to control the camera
  mapInstance: MaplibreMap | null
  setMapInstance: (map: MaplibreMap | null) => void
  flyTo: (center: [number, number], zoom: number) => void

  // Dynamic color maps generated at runtime (layerKey -> { propertyValue -> color })
  layerColors: Record<string, Record<string, string>>
  setLayerColors: (layerKey: string, colors: Record<string, string>) => void

  // Grouping information (layerKey -> { groupName -> itemNames[] })
  layerGroups: Record<string, Record<string, string[]>>
  setLayerGroups: (layerKey: string, groups: Record<string, string[]>) => void

  // Dynamic feature count maps generated at runtime (layerKey -> { propertyValue -> count })
  layerCounts: Record<string, Record<string, number>>
  setLayerCounts: (layerKey: string, counts: Record<string, number>) => void

  // Set of disabled sub-layer filters, formatted as "layerKey:value"
  disabledSubFilters: Set<string>
  toggleSubFilter: (layerKey: string, value: string) => void
  toggleSubFiltersBulk: (layerKey: string, values: string[], enable: boolean) => void
}

export const useMapStore = create<MapStore>((set, get) => ({
  // Awalnya SEMUA layer OFF — user harus mengaktifkan manual
  visibleLayers: new Set<LayerKey>(),
  toggleLayer: (key) =>
    set((s) => {
      const nextLayers = new Set(s.visibleLayers)
      const nextSubFilters = new Set(s.disabledSubFilters)
      
      if (nextLayers.has(key)) {
        nextLayers.delete(key)
      } else {
        nextLayers.add(key)
        // Reset sub-filters for this layer when enabling it again
        const prefix = `${key}:`
        for (const filter of nextSubFilters) {
          if (filter.startsWith(prefix)) {
            nextSubFilters.delete(filter)
          }
        }
      }
      return { 
        visibleLayers: nextLayers,
        disabledSubFilters: nextSubFilters
      }
    }),

  loadingLayers: new Set<LayerKey>(),
  setLoading: (key, loading) =>
    set((s) => {
      const next = new Set(s.loadingLayers)
      loading ? next.add(key) : next.delete(key)
      return { loadingLayers: next }
    }),

  loadedLayers: new Set<LayerKey>(),
  setLoaded: (key) =>
    set((s) => {
      const next = new Set(s.loadedLayers)
      next.add(key)
      return { loadedLayers: next }
    }),

  selectedFeature: null,
  setSelectedFeature: (f) => set({ selectedFeature: f }),

  mapLoaded: false,
  setMapLoaded: (v) => set({ mapLoaded: v }),

  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),
  flyTo: (center, zoom) => {
    const map = get().mapInstance
    if (map) {
      map.flyTo({
        center,
        zoom,
        duration: 1800,
        essential: true,
      })
    }
  },

  layerColors: {},
  setLayerColors: (layerKey, colors) =>
    set((s) => ({
      layerColors: { ...s.layerColors, [layerKey]: colors },
    })),

  layerGroups: {},
  setLayerGroups: (layerKey, groups) =>
    set((s) => ({
      layerGroups: { ...s.layerGroups, [layerKey]: groups },
    })),

  layerCounts: {},
  setLayerCounts: (layerKey, counts) =>
    set((s) => ({
      layerCounts: { ...s.layerCounts, [layerKey]: counts },
    })),

  disabledSubFilters: new Set<string>(),
  toggleSubFilter: (layerKey, value) =>
    set((s) => {
      const next = new Set(s.disabledSubFilters)
      const compoundKey = `${layerKey}:${value}`
      if (next.has(compoundKey)) {
        next.delete(compoundKey)
      } else {
        next.add(compoundKey)
      }
      return { disabledSubFilters: next }
    }),

  toggleSubFiltersBulk: (layerKey, values, enable) =>
    set((s) => {
      const next = new Set(s.disabledSubFilters)
      for (const val of values) {
        const compoundKey = `${layerKey}:${val}`
        if (enable) {
          next.delete(compoundKey)
        } else {
          next.add(compoundKey)
        }
      }
      return { disabledSubFilters: next }
    }),
}))
