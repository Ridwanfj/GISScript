'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { getAccessToken } from '@/lib/supabaseClient'

interface Stats {
  garis_kota: number
  kecamatan: number
  kelurahan: number
  pola_rdtr: number
  koordinat_menengah_dan_besar: number
}

const statCards: Array<{
  key: keyof Stats
  label: string
  description: string
  link?: string
  icon: ReactNode
}> = [
    {
      key: 'garis_kota',
      label: 'Batas Kota',
      description: 'Data garis batas Kota Tegal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      key: 'kecamatan',
      label: 'Kecamatan',
      description: 'Data batas kecamatan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      key: 'kelurahan',
      label: 'Kelurahan',
      description: 'Data batas kelurahan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      key: 'pola_rdtr',
      label: 'Pola Ruang RDTR',
      description: 'Data pola ruang RDTR',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 12h16M12 4v16" />
        </svg>
      ),
    },
    {
      key: 'koordinat_menengah_dan_besar',
      label: 'Proyek Investasi',
      description: 'Data proyek investasi',
      link: '/admin/investasi',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
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
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch stats')
      }
      setStats(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat statistik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Ringkasan data WebGIS Kota Tegal</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0l-7.07 12a2 2 0 001.74 3z" />
          </svg>
          <div className="flex-1">{error}</div>
          <button onClick={fetchStats} className="font-medium underline hover:text-red-800">
            Coba lagi
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="group relative rounded-lg border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 text-gray-700 mb-4">
              {card.icon}
            </div>
            <div className="text-2xl font-semibold text-gray-900 tabular-nums">
              {loading ? (
                <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
              ) : (
                stats?.[card.key]?.toLocaleString('id-ID') ?? '—'
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">{card.label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{card.description}</p>
            {card.link && (
              <Link
                href={card.link}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-900 hover:underline"
              >
                Kelola Data
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: '/admin/investasi/form',
              title: 'Tambah Proyek Investasi',
              desc: 'Buat data proyek investasi baru',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              ),
            },
            {
              href: '/admin/investasi',
              title: 'Daftar Proyek Investasi',
              desc: 'Lihat dan kelola semua proyek',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              ),
            },
            {
              href: '/',
              title: 'Buka Peta WebGIS',
              desc: 'Lihat peta interaktif',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              ),
            },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-900 text-white flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {a.icon}
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
