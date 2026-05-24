// GeoJSON type definitions for WebGIS Kota Tegal

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: number[] | number[][] | number[][][] | number[][][][]
  }
  properties: Record<string, unknown>
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export interface PopupField {
  key: string
  label: string
}

export interface LayerConfigItem {
  label: string
  tableName: string
  type: 'fill' | 'line' | 'circle'
  color?: string
  colorByProperty?: string
  opacity?: number
  outlineColor?: string
  outlineWidth?: number
  width?: number
  radius?: number
  strokeColor?: string
  strokeWidth?: number
  defaultVisible: boolean
  popupFields: PopupField[]
}
