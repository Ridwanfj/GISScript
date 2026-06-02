'use client'

import { useMapStore } from '@/store/mapStore'
import { LAYER_CONFIG, LayerKey } from '@/lib/layerConfig'

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '-'

  // Format currency IDR untuk Jumlah Investasi
  if (key === 'Jumlah Investasi') {
    let numVal: number
    if (typeof value === 'number') {
      numVal = value
    } else {
      const cleaned = String(value || '0')
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .replace(/[^0-9.-]+/g, '')
      numVal = parseFloat(cleaned) || 0
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(numVal)
  }

  // Format angka luas
  if ((key === 'LUAS' || key === 'LUASHA') && typeof value === 'number') {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 2,
    }).format(value)
  }

  return String(value)
}

export default function FeaturePopup() {
  const { selectedFeature, setSelectedFeature } = useMapStore()

  if (!selectedFeature) return null

  if (selectedFeature.properties.isAggregate) {
    const { level, nama_wilayah, jumlah_proyek, total_investasi } = selectedFeature.properties as any
    return (
      <div className="absolute bottom-6 right-6 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white/20" />
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Ringkasan {level === 'kecamatan' ? 'Kecamatan' : 'Kelurahan'}
            </h3>
          </div>
          <button
            onClick={() => setSelectedFeature(null)}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 cursor-pointer"
            aria-label="Tutup popup"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-2.5">
          <div className="flex justify-between items-start gap-3 py-1.5 border-b border-gray-800/60">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider shrink-0 font-semibold">Nama Wilayah</span>
            <span className="text-sm text-gray-100 text-right leading-snug font-semibold">{nama_wilayah}</span>
          </div>
          <div className="flex justify-between items-start gap-3 py-1.5 border-b border-gray-800/60">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider shrink-0 font-semibold">Jumlah Proyek</span>
            <span className="text-sm text-gray-100 text-right leading-snug font-semibold">{jumlah_proyek} Proyek</span>
          </div>
          <div className="flex justify-between items-start gap-3 py-1.5 last:border-b-0">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider shrink-0 font-semibold">Total Investasi</span>
            <span className="text-sm text-gray-100 text-right leading-snug font-semibold text-green-400 font-bold">
              {formatValue('Jumlah Investasi', total_investasi)}
            </span>
          </div>
        </div>

        {/* Koordinat */}
        <div className="px-5 py-3 border-t border-gray-800/60">
          <p className="text-[10px] font-mono text-gray-500">
            {selectedFeature.coordinates[1].toFixed(6)}, {selectedFeature.coordinates[0].toFixed(6)}
          </p>
        </div>
      </div>
    )
  }

  const config = LAYER_CONFIG[selectedFeature.layerKey]

  return (
    <div className="absolute bottom-6 right-6 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-white/20"
            style={{
              backgroundColor:
                'color' in config ? config.color : '#3b82f6',
            }}
          />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            {config.label}
          </h3>
        </div>
        <button
          onClick={() => setSelectedFeature(null)}
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 cursor-pointer"
          aria-label="Tutup popup"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-2.5">
        {config.popupFields.map((field) => {
          const value = selectedFeature.properties[field.key]
          return (
            <div
              key={field.key}
              className="flex justify-between items-start gap-3 py-1.5 border-b border-gray-800/60 last:border-b-0"
            >
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider shrink-0">
                {field.label}
              </span>
              <span className="text-sm text-gray-100 text-right leading-snug">
                {formatValue(field.key, value)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Koordinat */}
      <div className="px-5 py-3 border-t border-gray-800/60">
        <p className="text-[10px] font-mono text-gray-500">
          {selectedFeature.coordinates[1].toFixed(6)}, {selectedFeature.coordinates[0].toFixed(6)}
        </p>
      </div>
    </div>
  )
}
