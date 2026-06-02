'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getAccessToken } from '@/lib/supabaseClient'

interface ProyekInvestasi {
  id: number
  nama_proyek: string
  Uraian_Jenis_Proyek: string
  Sektor: string
  'Uraian Skala Usaha': string
  'Alamat Lengkap': string
  'Jumlah Investasi': number
  TKI: number
  [key: string]: any
}

export default function InvestasiPage() {
  const [data, setData] = useState<ProyekInvestasi[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Pagination & Search
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const limit = 10

  // Delete modal state
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ProyekInvestasi | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')

      const res = await fetch(
        `/api/admin/investasi?page=${page}&limit=${limit}&search=${encodeURIComponent(
          debouncedSearch
        )}`,
        {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        }
      )
      if (!res.ok) throw new Error('Gagal mengambil data')
      const json = await res.json()
      setData(json.data)
      setTotal(json.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteClick = (item: ProyekInvestasi) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(itemToDelete.id)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')

      const res = await fetch(`/api/admin/investasi/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
      if (!res.ok) throw new Error('Gagal menghapus data')
      
      // Refresh data
      fetchData()
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally {
      setIsDeleting(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Proyek Investasi
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Kelola data koordinat menengah dan besar
          </p>
        </div>
        <Link
          href="/admin/investasi/form"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Data
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-900/80 border border-gray-800/50 p-4 rounded-2xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama proyek, sektor, jenis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-gray-900/80 border border-gray-800/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-gray-800/50 text-gray-400 border-b border-gray-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Proyek</th>
                <th className="px-6 py-4 font-semibold">Jenis / Sektor</th>
                <th className="px-6 py-4 font-semibold">Skala Usaha</th>
                <th className="px-6 py-4 font-semibold">Nilai Investasi</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                // Loading Skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-1/2"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-1/2"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-2/3"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-1/3 ml-auto"></div></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                // Data Rows
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      {item.nama_proyek}
                      <div className="text-xs text-gray-500 font-normal mt-1 truncate max-w-[200px]">
                        {item['Alamat Lengkap']}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.Uraian_Jenis_Proyek}
                      <div className="text-xs text-blue-400 mt-1">
                        {item.Sektor}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-xs">
                        {item['Uraian Skala Usaha']}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400">
                      {(() => {
                        const val = item['Jumlah Investasi']
                        if (val === null || val === undefined || val === '') return '-'
                        
                        // Parse safely, stripping non-digits if it's a string
                        const num = typeof val === 'number' 
                          ? val 
                          : Number(String(val).replace(/[^\d]/g, ''))
                          
                        if (isNaN(num) || String(val).replace(/[^\d]/g, '') === '') return '-'
                        
                        return new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0
                        }).format(num)
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/investasi/form/${item.id}`}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Hapus"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/50 bg-gray-900/50">
            <p className="text-sm text-gray-400">
              Menampilkan <span className="font-medium text-white">{(page - 1) * limit + 1}</span> hingga{' '}
              <span className="font-medium text-white">{Math.min(page * limit, total)}</span> dari{' '}
              <span className="font-medium text-white">{total}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm font-medium text-white">
                {page} / {totalPages || 1}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hapus Proyek?</h3>
                <p className="text-sm text-gray-400">
                  Data <span className="font-semibold text-gray-300">{itemToDelete?.nama_proyek}</span> akan dihapus permanen.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting === itemToDelete?.id}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting === itemToDelete?.id}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-600/20"
              >
                {isDeleting === itemToDelete?.id ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
