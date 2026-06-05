'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAccessToken } from '@/lib/supabaseClient'

interface InvestasiFormProps {
  id?: string
}

const inputClass =
  'w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40'

const labelClass =
  'block text-xs font-semibold text-gray-400 uppercase tracking-wider'

export default function InvestasiForm({ id }: InvestasiFormProps) {
  const router = useRouter()
  const isEdit = !!id

  const [formData, setFormData] = useState<Record<string, any>>({
    nama_proyek: '',
    'No.': '',
    'Id Proyek': '',
    Nib: '',
    Sektor: '',
    Uraian_Jenis_Proyek: '',
    'Uraian Skala Usaha': '',
    'Uraian Status Penanaman Modal': '',
    'Uraian Risiko Proyek': '',
    Kbli: '',
    'Judul Kbli': '',
    'Zona Peruntukkan': '',
    'Alamat Lengkap': '',
    Latitude: '',
    Longitude: '',
    'Jumlah Investasi': '',
    TKI: '',
    luas_tanah: '',
    satuan_tanah: '',
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
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()

      // Map fetched data to form state, handling nulls appropriately
      const defaults = {
        nama_proyek: '',
        'No.': '',
        'Id Proyek': '',
        Nib: '',
        Sektor: '',
        Uraian_Jenis_Proyek: '',
        'Uraian Skala Usaha': '',
        'Uraian Status Penanaman Modal': '',
        'Uraian Risiko Proyek': '',
        Kbli: '',
        'Judul Kbli': '',
        'Zona Peruntukkan': '',
        'Alamat Lengkap': '',
        Latitude: '',
        Longitude: '',
        'Jumlah Investasi': 0,
        TKI: 0,
        luas_tanah: '',
        satuan_tanah: '',
      }

      const cleaned: Record<string, any> = {}
      for (const key of Object.keys(defaults)) {
        if (key === 'Latitude' || key === 'Longitude' || key === 'luas_tanah' || key === 'Jumlah Investasi' || key === 'TKI') {
          // Keep as string for numeric fields
          cleaned[key] = data[key] != null ? String(data[key]) : ''
        } else {
          cleaned[key] = data[key] ?? ''
        }
      }
      cleaned.id = data.id
      setFormData(cleaned)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    // Store all values as raw strings — convert to numbers only on submit
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.')

      // Prepare submission data
      const submitData: Record<string, any> = { ...formData }

      // Remove fields that shouldn't be sent
      delete submitData.geom
      delete submitData.id

      // Convert optional numeric fields: Latitude, Longitude, luas_tanah
      const latStr = String(submitData.Latitude ?? '').trim()
      const lngStr = String(submitData.Longitude ?? '').trim()
      const latVal = latStr !== '' ? parseFloat(latStr) : null
      const lngVal = lngStr !== '' ? parseFloat(lngStr) : null

      // Validate lat/long
      if (latVal !== null && (isNaN(latVal) || latVal < -90 || latVal > 90)) {
        setError('Latitude harus berupa angka antara -90 dan 90')
        setSaving(false)
        return
      }
      if (lngVal !== null && (isNaN(lngVal) || lngVal < -180 || lngVal > 180)) {
        setError('Longitude harus berupa angka antara -180 dan 180')
        setSaving(false)
        return
      }
      if ((latVal === null) !== (lngVal === null)) {
        setError('Latitude dan Longitude harus diisi keduanya atau dikosongkan keduanya')
        setSaving(false)
        return
      }

      submitData.Latitude = latVal
      submitData.Longitude = lngVal

      // Convert luas_tanah
      const luasStr = String(submitData.luas_tanah ?? '').trim()
      submitData.luas_tanah = luasStr !== '' ? parseFloat(luasStr) : null

      // Convert required numeric fields
      submitData['Jumlah Investasi'] = Number(submitData['Jumlah Investasi']) || 0
      submitData.TKI = Number(submitData.TKI) || 0

      // Clean up empty optional string fields → null
      const optionalTextFields = [
        'No.', 'Id Proyek', 'Nib',
        'Uraian Status Penanaman Modal', 'Uraian Risiko Proyek',
        'Kbli', 'Judul Kbli', 'Zona Peruntukkan', 'satuan_tanah',
      ]
      for (const key of optionalTextFields) {
        if (submitData[key] === '') submitData[key] = null
      }

      const res = await fetch(
        isEdit ? `/api/admin/investasi/${id}` : '/api/admin/investasi',
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
        <form onSubmit={handleSubmit} className="divide-y divide-gray-800/50">

          {/* ─── Section: Informasi Proyek ─── */}
          <div className="p-6 md:p-8 space-y-5">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Informasi Proyek
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nama Proyek */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="nama_proyek" className={labelClass}>
                  Nama Proyek <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="nama_proyek"
                  name="nama_proyek"
                  required
                  value={formData.nama_proyek}
                  onChange={handleChange}
                  placeholder="Contoh: Pembangunan Pabrik XYZ"
                  className={inputClass}
                />
              </div>

              {/* No. */}
              <div className="space-y-2">
                <label htmlFor="no" className={labelClass}>No.</label>
                <input
                  type="text"
                  id="no"
                  name="No."
                  value={formData['No.']}
                  onChange={handleChange}
                  placeholder="Nomor urut"
                  className={inputClass}
                />
              </div>

              {/* Id Proyek */}
              <div className="space-y-2">
                <label htmlFor="id_proyek" className={labelClass}>Id Proyek</label>
                <input
                  type="text"
                  id="id_proyek"
                  name="Id Proyek"
                  value={formData['Id Proyek']}
                  onChange={handleChange}
                  placeholder="ID Proyek"
                  className={inputClass}
                />
              </div>

              {/* Nib */}
              <div className="space-y-2">
                <label htmlFor="nib" className={labelClass}>NIB</label>
                <input
                  type="text"
                  id="nib"
                  name="Nib"
                  value={formData.Nib}
                  onChange={handleChange}
                  placeholder="Nomor Induk Berusaha"
                  className={inputClass}
                />
              </div>

              {/* Sektor */}
              <div className="space-y-2">
                <label htmlFor="sektor" className={labelClass}>
                  Sektor <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="sektor"
                  name="Sektor"
                  required
                  value={formData.Sektor}
                  onChange={handleChange}
                  placeholder="Contoh: Industri Pengolahan"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ─── Section: Detail Proyek ─── */}
          <div className="p-6 md:p-8 space-y-5">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              Detail Proyek
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Jenis Proyek */}
              <div className="space-y-2">
                <label htmlFor="jenis_proyek" className={labelClass}>
                  Jenis Proyek <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="jenis_proyek"
                  name="Uraian_Jenis_Proyek"
                  required
                  value={formData.Uraian_Jenis_Proyek}
                  onChange={handleChange}
                  placeholder="Contoh: PMDN / PMA"
                  className={inputClass}
                />
              </div>

              {/* Skala Usaha */}
              <div className="space-y-2">
                <label htmlFor="skala_usaha" className={labelClass}>
                  Skala Usaha <span className="text-red-400">*</span>
                </label>
                <select
                  id="skala_usaha"
                  name="Uraian Skala Usaha"
                  required
                  value={formData['Uraian Skala Usaha']}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="" disabled>Pilih Skala Usaha</option>
                  <option value="Mikro">Mikro</option>
                  <option value="Kecil">Kecil</option>
                  <option value="Menengah">Menengah</option>
                  <option value="Besar">Besar</option>
                </select>
              </div>

              {/* Status Penanaman Modal */}
              <div className="space-y-2">
                <label htmlFor="status_modal" className={labelClass}>Status Penanaman Modal</label>
                <input
                  type="text"
                  id="status_modal"
                  name="Uraian Status Penanaman Modal"
                  value={formData['Uraian Status Penanaman Modal']}
                  onChange={handleChange}
                  placeholder="Status penanaman modal"
                  className={inputClass}
                />
              </div>

              {/* Risiko Proyek */}
              <div className="space-y-2">
                <label htmlFor="risiko" className={labelClass}>Risiko Proyek</label>
                <input
                  type="text"
                  id="risiko"
                  name="Uraian Risiko Proyek"
                  value={formData['Uraian Risiko Proyek']}
                  onChange={handleChange}
                  placeholder="Risiko proyek"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ─── Section: Klasifikasi Usaha ─── */}
          <div className="p-6 md:p-8 space-y-5">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              Klasifikasi Usaha
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* KBLI */}
              <div className="space-y-2">
                <label htmlFor="kbli" className={labelClass}>KBLI</label>
                <input
                  type="text"
                  id="kbli"
                  name="Kbli"
                  value={formData.Kbli}
                  onChange={handleChange}
                  placeholder="Kode KBLI"
                  className={inputClass}
                />
              </div>

              {/* Judul KBLI */}
              <div className="space-y-2">
                <label htmlFor="judul_kbli" className={labelClass}>Judul KBLI</label>
                <input
                  type="text"
                  id="judul_kbli"
                  name="Judul Kbli"
                  value={formData['Judul Kbli']}
                  onChange={handleChange}
                  placeholder="Judul KBLI"
                  className={inputClass}
                />
              </div>

              {/* Zona Peruntukkan */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="zona" className={labelClass}>Zona Peruntukkan</label>
                <input
                  type="text"
                  id="zona"
                  name="Zona Peruntukkan"
                  value={formData['Zona Peruntukkan']}
                  onChange={handleChange}
                  placeholder="Zona peruntukkan lahan"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ─── Section: Lokasi & Koordinat ─── */}
          <div className="p-6 md:p-8 space-y-5">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Lokasi &amp; Koordinat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Alamat Lengkap */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="alamat" className={labelClass}>
                  Alamat Lengkap <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="alamat"
                  name="Alamat Lengkap"
                  required
                  rows={3}
                  value={formData['Alamat Lengkap']}
                  onChange={handleChange}
                  placeholder="Detail alamat proyek..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Latitude */}
              <div className="space-y-2">
                <label htmlFor="latitude" className={labelClass}>
                  Latitude
                  <span className="text-gray-500 font-normal normal-case ml-1">(opsional)</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="latitude"
                  name="Latitude"
                  value={formData.Latitude}
                  onChange={handleChange}
                  placeholder="Contoh: -6.879704"
                  className={`${inputClass} font-mono`}
                />
                <p className="text-xs text-gray-500">Range: -90 s/d 90</p>
              </div>

              {/* Longitude */}
              <div className="space-y-2">
                <label htmlFor="longitude" className={labelClass}>
                  Longitude
                  <span className="text-gray-500 font-normal normal-case ml-1">(opsional)</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="longitude"
                  name="Longitude"
                  value={formData.Longitude}
                  onChange={handleChange}
                  placeholder="Contoh: 109.143593"
                  className={`${inputClass} font-mono`}
                />
                <p className="text-xs text-gray-500">Range: -180 s/d 180</p>
              </div>

              {/* Helper info */}
              <div className="md:col-span-2">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <p className="text-xs text-blue-300/80">
                    Jika Latitude dan Longitude diisi, titik akan otomatis muncul di peta.
                    Koordinat bisa dicari di Google Maps — klik kanan lokasi, lalu salin koordinat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Section: Investasi & Lahan ─── */}
          <div className="p-6 md:p-8 space-y-5">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              Investasi &amp; Lahan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Jumlah Investasi */}
              <div className="space-y-2">
                <label htmlFor="investasi" className={labelClass}>
                  Jumlah Investasi (Rp) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="investasi"
                  name="Jumlah Investasi"
                  required
                  min="0"
                  value={formData['Jumlah Investasi']}
                  onChange={handleChange}
                  placeholder="0"
                  className={`${inputClass} font-mono`}
                />
              </div>

              {/* TKI */}
              <div className="space-y-2">
                <label htmlFor="tki" className={labelClass}>
                  Tenaga Kerja (TKI) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="tki"
                  name="TKI"
                  required
                  min="0"
                  value={formData.TKI}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              {/* Luas Tanah */}
              <div className="space-y-2">
                <label htmlFor="luas_tanah" className={labelClass}>Luas Tanah</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="luas_tanah"
                  name="luas_tanah"
                  value={formData.luas_tanah}
                  onChange={handleChange}
                  placeholder="Contoh: 5000"
                  className={`${inputClass} font-mono`}
                />
              </div>

              {/* Satuan Tanah */}
              <div className="space-y-2">
                <label htmlFor="satuan_tanah" className={labelClass}>Satuan Tanah</label>
                <input
                  type="text"
                  id="satuan_tanah"
                  name="satuan_tanah"
                  value={formData.satuan_tanah}
                  onChange={handleChange}
                  placeholder="Contoh: m²"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ─── Submit ─── */}
          <div className="p-6 md:p-8 flex items-center justify-end gap-3">
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
