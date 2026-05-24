import { create } from 'zustand'
import { LayerKey } from '@/lib/layerConfig'

interface SelectedFeature {
  layerKey: LayerKey
  properties: Record<string, unknown>
  coordinates: [number, number]
}

interface MapStore {
  visibleLayers: Set<LayerKey>
  toggleLayer: (key: LayerKey) => void
  selectedFeature: SelectedFeature | null
  setSelectedFeature: (f: SelectedFeature | null) => void
  mapLoaded: boolean
  setMapLoaded: (v: boolean) => void
  // Dynamic color maps generated at runtime (layerKey -> { propertyValue -> color })
  layerColors: Record<string, Record<string, string>>
  setLayerColors: (layerKey: string, colors: Record<string, string>) => void
}

export const useMapStore = create<MapStore>((set) => ({
  visibleLayers: new Set<LayerKey>([
    'garis_kota',
    'kecamatan',
    'pola_rdtr',
    'koordinat_menengah_dan_besar',
  ]),
  toggleLayer: (key) =>
    set((s) => {
      const next = new Set(s.visibleLayers)
      next.has(key) ? next.delete(key) : next.add(key)
      return { visibleLayers: next }
    }),
  selectedFeature: null,
  setSelectedFeature: (f) => set({ selectedFeature: f }),
  mapLoaded: false,
  setMapLoaded: (v) => set({ mapLoaded: v }),
  layerColors: {},
  setLayerColors: (layerKey, colors) =>
    set((s) => ({
      layerColors: { ...s.layerColors, [layerKey]: colors },
    })),
}))
