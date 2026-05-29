'use client'

import { useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import { LAYER_CONFIG, LayerKey, RDTR_ZONE_COLORS } from '@/lib/layerConfig'

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

// Kelompokkan zona RDTR berdasarkan kategori
const ZONE_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: 'Perumahan',
    keys: [
      'Perumahan Kepadatan Rendah',
      'Perumahan Kepadatan Sedang',
      'Perumahan Kepadatan Tinggi',
    ],
  },
  {
    title: 'Perdagangan & Jasa',
    keys: [
      'Perdagangan dan Jasa Skala Kota',
      'Perdagangan dan Jasa Skala SWP',
    ],
  },
  {
    title: 'Ruang Hijau & Taman',
    keys: [
      'Rimba Kota',
      'Taman Kota',
      'Taman Kecamatan',
      'Taman Kelurahan',
      'Taman RW',
      'Taman RT',
      'Ruang Terbuka Non Hijau',
    ],
  },
  {
    title: 'Fasilitas Umum',
    keys: [
      'SPU Skala Kota',
      'SPU Skala Kecamatan',
      'SPU Skala Kelurahan',
      'Perkantoran',
    ],
  },
  {
    title: 'Industri & Perikanan',
    keys: [
      'Kawasan Peruntukan Industri',
      'Perikanan Tangkap',
      'Perikanan Budi Daya',
      'Peternakan',
      'Tanaman Pangan',
    ],
  },
  {
    title: 'Infrastruktur & Lainnya',
    keys: [
      'Badan Jalan',
      'Transportasi',
      'Badan Air',
      'Perlindungan Setempat',
      'Pengelolaan Persampahan',
      'Instalasi Pengolahan Air Limbah (IPAL)',
      'Pemakaman',
      'Cagar Budaya',
      'Pariwisata',
      'Pertahanan dan Keamanan',
    ],
  },
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

function LegendSection({
  title,
  items,
  layerKey,
  disabledSubFilters,
  toggleSubFilter,
  defaultExpanded = false,
}: {
  title: string
  items: { name: string; color: string; label?: string; count?: number }[]
  layerKey?: string
  disabledSubFilters?: Set<string>
  toggleSubFilter?: (layerKey: string, value: string) => void
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const toggleSubFiltersBulk = useMapStore((s) => s.toggleSubFiltersBulk)

  if (items.length === 0) return null

  // Calculate bulk checked state
  const activeItems = layerKey && disabledSubFilters
    ? items.filter(item => !disabledSubFilters.has(`${layerKey}:${item.name}`))
    : []
  
  const isAllActive = activeItems.length === items.length

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 w-full hover:bg-white/5 rounded-lg px-1 transition-colors">
        {/* Bulk Toggle Checkbox */}
        {layerKey && disabledSubFilters && toggleSubFiltersBulk && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // If currently all active, disable all (enable: false)
              // If currently not all active, enable all (enable: true)
              toggleSubFiltersBulk(layerKey, items.map(i => i.name), !isAllActive)
            }}
            className="flex items-center justify-center p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title={isAllActive ? "Nonaktifkan Semua" : "Aktifkan Semua"}
          >
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200 shrink-0
              ${isAllActive 
                ? 'bg-white/10 border-white/40 text-white shadow-sm shadow-white/5' 
                : 'bg-transparent border-gray-700 text-transparent'
              }
            `}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </button>
        )}

        {/* Toggle Expand Button (chevron + title) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-1.5 py-1.5 text-left text-[11px] font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3 h-3 text-gray-500 transition-transform duration-200 shrink-0 ${
              expanded ? 'rotate-90' : ''
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">{title}</span>
          <span className="text-[9px] text-white font-semibold ml-1.5 shrink-0 bg-white/10 px-1.5 py-0.5 rounded-full select-none">
            {items.length}
          </span>
        </button>
      </div>

      {expanded && (
        <div className="ml-2 space-y-0.5 mt-0.5 border-l border-gray-800/50 pl-2">
          {items.map(({ name, color, label, count }) => {
            const isSubActive = layerKey && disabledSubFilters && toggleSubFilter
              ? !disabledSubFilters.has(`${layerKey}:${name}`)
              : true

            const itemContent = (
              <div className="flex items-start gap-2.5 w-full min-w-0 py-0.5">
                {/* Checkbox on left */}
                {layerKey && disabledSubFilters && toggleSubFilter && (
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5
                    ${isSubActive 
                      ? 'bg-white/10 border-white/40 text-white shadow-sm shadow-white/5' 
                      : 'bg-transparent border-gray-700 text-transparent'
                    }
                  `}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}

                {/* Color block */}
                <div
                  className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/10 mt-0.5"
                  style={{ backgroundColor: color }}
                />

                {/* Name */}
                <span className={`text-[11px] leading-snug flex-1 whitespace-normal break-words transition-colors duration-200 ${isSubActive ? 'text-white' : 'text-gray-500 line-through'}`}>
                  {label || name}
                </span>

                {/* Count badge on the right */}
                {count !== undefined && count > 0 && (
                  <span className={`text-[10px] font-semibold shrink-0 ml-auto mr-1 select-none transition-colors duration-200 mt-0.5 ${isSubActive ? 'text-white' : 'text-gray-600 line-through'}`}>
                    ({count})
                  </span>
                )}
              </div>
            )

            if (layerKey && disabledSubFilters && toggleSubFilter) {
              return (
                <button
                  key={name}
                  onClick={() => toggleSubFilter(layerKey, name)}
                  className="w-full flex items-center px-2 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  {itemContent}
                </button>
              )
            }

            return (
              <div
                key={name}
                className="flex items-center px-2 py-1 rounded hover:bg-white/5 transition-colors"
              >
                {itemContent}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LayerDetail({
  keyName,
  layerColors,
  layerGroups,
  layerCounts,
  disabledSubFilters,
  toggleSubFilter,
}: {
  keyName: LayerKey
  layerColors: Record<string, Record<string, string>>
  layerGroups: Record<string, Record<string, string[]>>
  layerCounts: Record<string, Record<string, number>>
  disabledSubFilters: Set<string>
  toggleSubFilter: (layerKey: string, value: string) => void
}) {
  if (keyName === 'kecamatan') {
    const colors = layerColors['kecamatan']
    if (!colors) return null
    const items = Object.entries(colors).map(([name, color]) => ({
      name,
      color,
    }))
    return (
      <div className="ml-2 mt-2 pl-2 border-l border-gray-800/50">
        <LegendSection
          title="Kecamatan"
          items={items}
          layerKey="kecamatan"
          disabledSubFilters={disabledSubFilters}
          toggleSubFilter={toggleSubFilter}
          defaultExpanded={true}
        />
      </div>
    )
  }

  if (keyName === 'kelurahan') {
    const colors = layerColors['kelurahan']
    if (!colors) return null
    const totalCount = Object.keys(colors).length
    const groups = layerGroups['kelurahan']
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [expanded, setExpanded] = useState(true)

    return (
      <div className="ml-2 mt-2 space-y-1 pl-2 border-l border-gray-800/50">
        {/* Collapsible Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-[11px] font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3 h-3 text-gray-500 transition-transform duration-200 shrink-0 ${
              expanded ? 'rotate-90' : ''
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
          <span className="uppercase tracking-wider">Kelurahan</span>
          <span className="text-[9px] text-white font-semibold ml-1.5 shrink-0 bg-white/10 px-1.5 py-0.5 rounded-full select-none">
            {totalCount}
          </span>
        </button>

        {expanded && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin mt-1">
            {groups && Object.keys(groups).length > 0 ? (
              Object.entries(groups).map(([kecName, kelList]) => {
                const items = kelList.map(kelName => ({
                  name: kelName,
                  color: colors[kelName] || '#94a3b8'
                }))
                return (
                  <LegendSection
                    key={kecName}
                    title={kecName}
                    items={items}
                    layerKey="kelurahan"
                    disabledSubFilters={disabledSubFilters}
                    toggleSubFilter={toggleSubFilter}
                  />
                )
              })
            ) : (
              <div className="pl-2 space-y-1">
                {Object.entries(colors).map(([name, color]) => {
                  const isSubActive = !disabledSubFilters.has('kelurahan:' + name)
                  return (
                    <button
                      key={name}
                      onClick={() => toggleSubFilter('kelurahan', name)}
                      className="w-full flex items-start gap-2.5 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer text-left"
                    >
                      {/* Custom Checkbox on left */}
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5
                        ${isSubActive 
                          ? 'bg-white/10 border-white/40 text-white shadow-sm shadow-white/5' 
                          : 'bg-transparent border-gray-700 text-transparent'
                        }
                      `}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>

                      {/* Color block */}
                      <div
                        className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/10 mt-0.5"
                        style={{ backgroundColor: color }}
                      />

                      {/* Name */}
                      <span className={`text-[11px] leading-snug flex-1 whitespace-normal break-words transition-colors duration-200 ${isSubActive ? 'text-white' : 'text-gray-500 line-through'}`}>
                        {name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (keyName === 'pola_rdtr') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [expanded, setExpanded] = useState(true)

    return (
      <div className="ml-2 mt-2 space-y-1 pl-2 border-l border-gray-800/50">
        {/* Collapsible Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-[11px] font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 shrink-0 ${
              expanded ? 'rotate-90' : ''
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
          <span className="uppercase tracking-wider">Zonasi RDTR</span>
          <span className="text-[9px] text-white font-semibold ml-1.5 shrink-0 bg-white/10 px-1.5 py-0.5 rounded-full select-none">
            {ZONE_GROUPS.length}
          </span>
        </button>

        {expanded && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin mt-1">
            {ZONE_GROUPS.map((group) => (
              <LegendSection
                key={group.title}
                title={group.title}
                layerKey="pola_rdtr"
                disabledSubFilters={disabledSubFilters}
                toggleSubFilter={toggleSubFilter}
                items={group.keys
                  .filter((k) => RDTR_ZONE_COLORS[k])
                  .map((k) => {
                    const count = layerCounts['pola_rdtr']?.[k] || 0
                    return {
                      name: k,
                      label: RDTR_ZONE_COLORS[k].label,
                      color: RDTR_ZONE_COLORS[k].color,
                      count: count,
                    }
                  })}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (keyName === 'koordinat_menengah_dan_besar') {
    const colors = layerColors['koordinat_menengah_dan_besar']
    if (!colors) return null
    const items = Object.entries(colors).map(([name, color]) => {
      const count = layerCounts['koordinat_menengah_dan_besar']?.[name] || 0
      return {
        name,
        label: name,
        color,
        count: count,
      }
    })
    return (
      <div className="ml-2 mt-2 pl-2 border-l border-gray-800/50">
        <LegendSection
          title="Sektor Investasi"
          items={items}
          layerKey="koordinat_menengah_dan_besar"
          disabledSubFilters={disabledSubFilters}
          toggleSubFilter={toggleSubFilter}
          defaultExpanded={true}
        />
      </div>
    )
  }

  return null
}

export default function LayerControl() {
  const { visibleLayers, toggleLayer, loadingLayers, layerColors, layerGroups, layerCounts, disabledSubFilters, toggleSubFilter } = useMapStore()

  return (
    <div className="space-y-2">
      {layerOrder.map((key) => {
        const config = LAYER_CONFIG[key]
        const isActive = visibleLayers.has(key)
        const isLoading = loadingLayers.has(key)
        const color = 'color' in config && config.color ? config.color : '#3b82f6'

        return (
          <div key={key} className="space-y-1">
            <button
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

            {/* Render layer detail right under the toggle if active and loaded */}
            {isActive && !isLoading && (
              <LayerDetail 
                keyName={key} 
                layerColors={layerColors} 
                layerGroups={layerGroups}
                layerCounts={layerCounts}
                disabledSubFilters={disabledSubFilters}
                toggleSubFilter={toggleSubFilter}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
