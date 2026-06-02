'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAccessToken } from '@/lib/supabaseClient'

interface Stats {
  garis_kota: number
  kecamatan: number
  kelurahan: number
  pola_rdtr: number
  koordinat_menengah_dan_besar: number
}

const statCards = [
  {
    key: 'garis_kota',
    label: 'Batas Kota',
    description: 'Data garis batas Kota Tegal',
    gradient: 'from-rose-500 to-pink-600',
    bgGlow: 'bg-rose-500/10',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    key: 'kecamatan',
    label: 'Kecamatan',
    description: 'Data batas kecamatan',
    gradient: 'from-blue-500 to-cyan-600',
    bgGlow: 'bg-blue-500/10',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    key: 'kelurahan',
    label: 'Kelurahan',
    description: 'Data batas kelurahan',
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/10',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
      </svg>
    ),
  },
  {
    key: 'pola_rdtr',
    label: 'Pola Ruang RDTR',
    description: 'Data pola ruang RDTR',
    gradient: 'from-emerald-500 to-teal-600',
    bgGlow: 'bg-emerald-500/10',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  {
    key: 'koordinat_menengah_dan_besar',
    label: 'Proyek Investasi',
    description: 'Data proyek investasi',
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/10',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    link: '/admin/investasi',
  },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')

      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch {
      setError('Gagal memuat statistik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Ringkasan data WebGIS Kota Tegal
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
          <button onClick={fetchStats} className="ml-auto text-red-400 hover:text-red-300 underline text-xs cursor-pointer">
            Coba lagi
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="relative group rounded-2xl bg-gray-900/80 border border-gray-800/50 p-5 hover:border-gray-700/60 transition-all duration-300 overflow-hidden"
          >
            {/* Background glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${card.bgGlow} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative">
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} bg-opacity-20 mb-4`}>
                <span className="text-white/90">{card.icon}</span>
              </div>

              {/* Value */}
              <div className="mb-1">
                {loading ? (
                  <div className="h-9 w-20 rounded-lg bg-gray-800 animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {stats?.[card.key as keyof Stats]?.toLocaleString('id-ID') ?? '—'}
                  </p>
                )}
              </div>

              {/* Label */}
              <p className="text-sm font-semibold text-gray-300">{card.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>

              {/* Link if available */}
              {card.link && (
                <Link
                  href={card.link}
                  className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Kelola Data
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Add investment */}
          <Link
            href="/admin/investasi/form"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-gray-900/80 border border-gray-800/50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                Tambah Proyek Investasi
              </p>
              <p className="text-xs text-gray-500">Buat data proyek investasi baru</p>
            </div>
          </Link>

          {/* View investment list */}
          <Link
            href="/admin/investasi"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-gray-900/80 border border-gray-800/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                Daftar Proyek Investasi
              </p>
              <p className="text-xs text-gray-500">Lihat dan kelola semua proyek</p>
            </div>
          </Link>

          {/* View map */}
          <Link
            href="/"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-gray-900/80 border border-gray-800/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Buka Peta WebGIS
              </p>
              <p className="text-xs text-gray-500">Lihat peta interaktif</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
