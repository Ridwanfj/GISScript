'use client'

import { useMapStore } from '@/store/mapStore'
import { LAYER_CONFIG, LayerKey } from '@/lib/layerConfig'

const layerIcons: Record<string, string> = {
  line: '━',
  fill: '◆',
  circle: '●',
}

const layerOrder: LayerKey[] = [
  'garis_kota',
  'kecamatan',
  'kelurahan',
  'pola_rdtr',
  'koordinat_menengah_dan_besar',
]

export default function LayerControl() {
  const { visibleLayers, toggleLayer } = useMapStore()

  return (
    <div className="space-y-1">
      {layerOrder.map((key) => {
        const config = LAYER_CONFIG[key]
        const isActive = visibleLayers.has(key)
        const color = 'color' in config && config.color ? config.color : '#3b82f6'

        return (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            className={`
              w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer
              ${isActive
                ? 'bg-white/10 text-white shadow-lg shadow-black/10'
                : 'bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
              }
            `}
          >
            {/* Toggle switch */}
            <div
              className={`
                relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0
                ${isActive ? 'bg-blue-500' : 'bg-gray-700'}
              `}
            >
              <div
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200
                  ${isActive ? 'translate-x-4' : 'translate-x-0.5'}
                `}
              />
            </div>

            {/* Icon + Label */}
            <span
              className="text-base leading-none shrink-0"
              style={{ color: isActive ? color : undefined }}
            >
              {layerIcons[config.type] || '◆'}
            </span>
            <span className="text-sm font-medium truncate">{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}
