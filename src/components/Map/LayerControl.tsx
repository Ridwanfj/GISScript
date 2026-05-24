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

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4 text-blue-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export default function LayerControl() {
  const { visibleLayers, toggleLayer, loadingLayers } = useMapStore()

  return (
    <div className="space-y-1">
      {layerOrder.map((key) => {
        const config = LAYER_CONFIG[key]
        const isActive = visibleLayers.has(key)
        const isLoading = loadingLayers.has(key)
        const color = 'color' in config && config.color ? config.color : '#3b82f6'

        return (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            disabled={isLoading}
            className={`
              w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200
              ${isLoading
                ? 'bg-blue-500/10 text-blue-300 cursor-wait'
                : isActive
                  ? 'bg-white/10 text-white shadow-lg shadow-black/10 cursor-pointer'
                  : 'bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300 cursor-pointer'
              }
            `}
          >
            {/* Toggle switch */}
            <div
              className={`
                relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0
                ${isLoading ? 'bg-blue-500/50' : isActive ? 'bg-blue-500' : 'bg-gray-700'}
              `}
            >
              <div
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200
                  ${isActive || isLoading ? 'translate-x-4' : 'translate-x-0.5'}
                `}
              />
            </div>

            {/* Icon + Label */}
            {isLoading ? (
              <Spinner />
            ) : (
              <span
                className="text-base leading-none shrink-0"
                style={{ color: isActive ? color : undefined }}
              >
                {layerIcons[config.type] || '◆'}
              </span>
            )}
            <span className="text-sm font-medium truncate">
              {config.label}
              {isLoading && (
                <span className="text-[10px] text-blue-400/70 ml-1.5 font-normal">
                  Memuat...
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
