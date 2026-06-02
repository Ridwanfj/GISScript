'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAccessToken } from '@/lib/supabaseClient'

interface ProyekInvestasi {
  id?: number
  nama_proyek: string
  Uraian_Jenis_Proyek: string
  Sektor: string
  'Uraian Skala Usaha': string
  'Alamat Lengkap': string
  'Jumlah Investasi': number
  TKI: number
  [key: string]: any
}

interface InvestasiFormProps {
  id?: string
}

export default function InvestasiForm({ id }: InvestasiFormProps) {
  const router = useRouter()
  const isEdit = !!id

  const [formData, setFormData] = useState<ProyekInvestasi>({
    nama_proyek: '',
    Uraian_Jenis_Proyek: '',
    Sektor: '',
    'Uraian Skala Usaha': '',
    'Alamat Lengkap': '',
    'Jumlah Investasi': 0,
    TKI: 0,
  })

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchData = async () => {
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')

      const res = await fetch(`/api/admin/investasi/${id}`, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()
      setFormData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')

      const res = await fetch(isEdit ? `/api/admin/investasi/${id}` : '/api/admin/investasi', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan data')
      }

      router.push('/admin/investasi')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-10 h-10 rounded-full border-4 border-gray-800 border-t-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/investasi"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          {isEdit ? 'Edit Proyek Investasi' : 'Tambah Proyek Baru'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Lengkapi form di bawah untuk menyimpan data proyek.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-gray-900/80 border border-gray-800/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nama Proyek */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="nama_proyek" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Nama Proyek
              </label>
              <input
                type="text"
                id="nama_proyek"
                name="nama_proyek"
                required
                value={formData.nama_proyek}
                onChange={handleChange}
                placeholder="Contoh: Pembangunan Pabrik XYZ"
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Sektor */}
            <div className="space-y-2">
              <label htmlFor="Sektor" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Sektor
              </label>
              <input
                type="text"
                id="Sektor"
                name="Sektor"
                required
                value={formData.Sektor}
                onChange={handleChange}
                placeholder="Contoh: Industri Pengolahan"
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Uraian Jenis Proyek */}
            <div className="space-y-2">
              <label htmlFor="Uraian_Jenis_Proyek" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Jenis Proyek
              </label>
              <input
                type="text"
                id="Uraian_Jenis_Proyek"
                name="Uraian_Jenis_Proyek"
                required
                value={formData.Uraian_Jenis_Proyek}
                onChange={handleChange}
                placeholder="Contoh: PMDN / PMA"
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Skala Usaha */}
            <div className="space-y-2">
              <label htmlFor="uraian_skala_usaha" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Skala Usaha
              </label>
              <select
                id="uraian_skala_usaha"
                name="Uraian Skala Usaha"
                required
                value={formData['Uraian Skala Usaha']}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="" disabled>Pilih Skala Usaha</option>
                <option value="Mikro">Mikro</option>
                <option value="Kecil">Kecil</option>
                <option value="Menengah">Menengah</option>
                <option value="Besar">Besar</option>
              </select>
            </div>

            {/* TKI */}
            <div className="space-y-2">
              <label htmlFor="TKI" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tenaga Kerja (TKI)
              </label>
              <input
                type="number"
                id="TKI"
                name="TKI"
                required
                min="0"
                value={formData.TKI}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Jumlah Investasi */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="jumlah_investasi" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Jumlah Investasi (Rp)
              </label>
              <input
                type="number"
                id="jumlah_investasi"
                name="Jumlah Investasi"
                required
                min="0"
                value={formData['Jumlah Investasi']}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
              />
            </div>

            {/* Alamat Lengkap */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="alamat_lengkap" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Alamat Lengkap
              </label>
              <textarea
                id="alamat_lengkap"
                name="Alamat Lengkap"
                required
                rows={3}
                value={formData['Alamat Lengkap']}
                onChange={handleChange}
                placeholder="Detail alamat proyek..."
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>

          </div>

          <div className="pt-6 mt-6 border-t border-gray-800/50 flex items-center justify-end gap-3">
            <Link
              href="/admin/investasi"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
