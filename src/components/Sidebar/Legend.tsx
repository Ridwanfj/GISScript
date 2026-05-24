'use client'

import { RDTR_ZONE_COLORS } from '@/lib/layerConfig'
import { useMapStore } from '@/store/mapStore'
import { useState } from 'react'

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

// Komponen untuk satu section legenda
function LegendSection({
  title,
  items,
  defaultExpanded = false,
}: {
  title: string
  items: { name: string; color: string }[]
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (items.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
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
        {title}
        <span className="text-[10px] text-gray-500 font-normal ml-auto">
          {items.length}
        </span>
      </button>
      {expanded && (
        <div className="ml-2 space-y-0.5">
          {items.map(({ name, color }) => (
            <div
              key={name}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
              <div
                className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/10"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-gray-400 truncate">
                {name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Legend() {
  const { visibleLayers, layerColors } = useMapStore()

  const showKecamatan = visibleLayers.has('kecamatan') && layerColors['kecamatan']
  const showKelurahan = visibleLayers.has('kelurahan') && layerColors['kelurahan']
  const showRdtr = visibleLayers.has('pola_rdtr')

  if (!showKecamatan && !showKelurahan && !showRdtr) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
        Legenda
      </h3>

      {/* Legenda Kecamatan */}
      {showKecamatan && (
        <LegendSection
          title="Kecamatan"
          defaultExpanded={true}
          items={Object.entries(layerColors['kecamatan']).map(([name, color]) => ({
            name,
            color,
          }))}
        />
      )}

      {/* Legenda Kelurahan */}
      {showKelurahan && (
        <LegendSection
          title="Kelurahan"
          defaultExpanded={true}
          items={Object.entries(layerColors['kelurahan']).map(([name, color]) => ({
            name,
            color,
          }))}
        />
      )}

      {/* Legenda Pola Ruang RDTR */}
      {showRdtr && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-300 px-2">
            Pola Ruang RDTR
          </p>
          {ZONE_GROUPS.map((group) => (
            <LegendSection
              key={group.title}
              title={group.title}
              items={group.keys
                .filter((k) => RDTR_ZONE_COLORS[k])
                .map((k) => ({
                  name: RDTR_ZONE_COLORS[k].label,
                  color: RDTR_ZONE_COLORS[k].color,
                }))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
