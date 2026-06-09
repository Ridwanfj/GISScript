'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAccessToken } from '@/lib/supabaseClient'

interface IproFormProps {
  id?: string
}

const inputClass =
  'w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

const labelClass =
  'block text-xs font-semibold text-gray-600 uppercase tracking-wider'

export default function IproForm({ id }: IproFormProps) {
  const router = useRouter()
  const isEdit = !!id

  const [formData, setFormData] = useState<Record<string, any>>({
    'NO': '',
    'JENIS IPRO': '',
    'ALAMAT': '',
    'KOORDINAT': '',
    'Latitude': '',
    'Longitude': '',
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

      const res = await fetch(`/api/admin/ipro/${id}`, {
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()

      setFormData({
        'NO': data['NO'] ?? '',
        'JENIS IPRO': data['JENIS IPRO'] ?? '',
        'ALAMAT': data['ALAMAT'] ?? '',
        'KOORDINAT': data['KOORDINAT'] ?? '',
        'Latitude': data['Latitude'] != null ? String(data['Latitude']) : '',
        'Longitude': data['Longitude'] != null ? String(data['Longitude']) : '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')

      const submitData: Record<string, any> = { ...formData }

      // Convert Latitude/Longitude to numbers or null
      const latStr = String(submitData['Latitude'] ?? '').trim()
      const lngStr = String(submitData['Longitude'] ?? '').trim()
      submitData['Latitude'] = latStr !== '' ? parseFloat(latStr) : null
      submitData['Longitude'] = lngStr !== '' ? parseFloat(lngStr) : null

      // Clean empty optional fields → null
      if (submitData['NO'] === '') submitData['NO'] = null
      if (submitData['KOORDINAT'] === '') submitData['KOORDINAT'] = null

      const res = await fetch(
        isEdit ? `/api/admin/ipro/${id}` : '/api/admin/ipro',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify(submitData),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan data')
      }

      router.push('/admin/ipro')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/ipro"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {isEdit ? 'Edit Data IPRO' : 'Tambah Data IPRO'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lengkapi form di bawah untuk menyimpan data IPRO.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">

          {/* Informasi Dasar */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Informasi Dasar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="no" className={labelClass}>No.</label>
                <input
                  type="text"
                  id="no"
                  name="NO"
                  value={formData['NO']}
                  onChange={handleChange}
                  placeholder="Nomor urut"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="jenis_ipro" className={labelClass}>
                  Jenis IPRO <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="jenis_ipro"
                  name="JENIS IPRO"
                  required
                  value={formData['JENIS IPRO']}
                  onChange={handleChange}
                  placeholder="Contoh: IMB, SLF, dll"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Lokasi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="alamat" className={labelClass}>
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="alamat"
                  name="ALAMAT"
                  required
                  rows={3}
                  value={formData['ALAMAT']}
                  onChange={handleChange}
                  placeholder="Detail alamat..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label htmlFor="koordinat" className={labelClass}>
                  Koordinat (teks)
                </label>
                <input
                  type="text"
                  id="koordinat"
                  name="KOORDINAT"
                  value={formData['KOORDINAT']}
                  onChange={handleChange}
                  placeholder="Contoh: -6.879704, 109.143593"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="latitude" className={labelClass}>Latitude</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="latitude"
                  name="Latitude"
                  value={formData['Latitude']}
                  onChange={handleChange}
                  placeholder="Contoh: -6.879704"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="longitude" className={labelClass}>Longitude</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="longitude"
                  name="Longitude"
                  value={formData['Longitude']}
                  onChange={handleChange}
                  placeholder="Contoh: 109.143593"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sky-50 border border-sky-100">
                  <svg className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <p className="text-xs text-sky-700">
                    Jika Latitude dan Longitude diisi, titik akan otomatis muncul di peta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="p-6 flex items-center justify-end gap-3">
            <Link
              href="/admin/ipro"
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
