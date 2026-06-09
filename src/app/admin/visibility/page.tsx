'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAccessToken } from '@/lib/supabaseClient'
import { LAYER_CONFIG, LayerKey } from '@/lib/layerConfig'

// Only layers that have popup fields worth configuring
const CONFIGURABLE_LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'koordinat_menengah_dan_besar', label: 'Proyek Investasi' },
  { key: 'ipro', label: 'IPRO' },
  { key: 'kecamatan', label: 'Batas Kecamatan' },
  { key: 'kelurahan', label: 'Batas Kelurahan' },
  { key: 'pola_rdtr', label: 'Pola Ruang RDTR' },
  { key: 'garis_kota', label: 'Batas Kota Tegal' },
]

interface FieldVisibilityItem {
  layer_key: string
  field_key: string
  hidden_for_public: boolean
}

export default function VisibilitySettingsPage() {
  const [settings, setSettings] = useState<FieldVisibilityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid.')
      const res = await fetch('/api/admin/field-visibility', {
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!res.ok) throw new Error('Gagal mengambil pengaturan')
      const json = await res.json()
      setSettings(json.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const isHidden = (layerKey: string, fieldKey: string): boolean => {
    const item = settings.find(
      (s) => s.layer_key === layerKey && s.field_key === fieldKey
    )
    return item?.hidden_for_public ?? false
  }

  const toggleField = async (layerKey: string, fieldKey: string) => {
    const currentlyHidden = isHidden(layerKey, fieldKey)
    const newValue = !currentlyHidden
    const compoundKey = `${layerKey}:${fieldKey}`

    setSaving(compoundKey)
    setError('')
    setSuccess('')

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sesi tidak valid.')

      const res = await fetch('/api/admin/field-visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          layer_key: layerKey,
          field_key: fieldKey,
          hidden_for_public: newValue,
        }),
      })

      if (!res.ok) throw new Error('Gagal menyimpan perubahan')

      // Update local state
      setSettings((prev) => {
        const existing = prev.findIndex(
          (s) => s.layer_key === layerKey && s.field_key === fieldKey
        )
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = { ...next[existing], hidden_for_public: newValue }
          return next
        }
        return [...prev, { layer_key: layerKey, field_key: fieldKey, hidden_for_public: newValue }]
      })

      setSuccess(`${fieldKey} ${newValue ? 'disembunyikan' : 'ditampilkan'} untuk publik`)
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Pengaturan Visibilitas
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Atur field mana yang disembunyikan dari tampilan popup peta untuk pengguna publik.
          Admin tetap melihat semua field.
        </p>
      </div>

      {/* Success */}
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Layer Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-48 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {CONFIGURABLE_LAYERS.map(({ key, label }) => {
            const config = LAYER_CONFIG[key]
            const fields = config.popupFields

            return (
              <div key={key} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                {/* Layer header */}
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{
                        backgroundColor: 'color' in config ? (config as any).color : '#6b7280',
                      }}
                    />
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {fields.length} field · {fields.filter((f) => isHidden(key, f.key)).length} disembunyikan
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fields list */}
                <div className="divide-y divide-gray-100">
                  {fields.map((field) => {
                    const hidden = isHidden(key, field.key)
                    const isSaving = saving === `${key}:${field.key}`
                    return (
                      <div
                        key={field.key}
                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${hidden ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          <div>
                            <span className="text-sm text-gray-900">{field.label}</span>
                            <span className="ml-2 text-[10px] text-gray-400 font-mono">{field.key}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-medium ${hidden ? 'text-red-600' : 'text-emerald-600'}`}>
                            {hidden ? 'Tersembunyi' : 'Tampil'}
                          </span>
                          <button
                            onClick={() => toggleField(key, field.key)}
                            disabled={isSaving}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                              !hidden ? 'bg-emerald-500' : 'bg-gray-300'
                            } ${isSaving ? 'opacity-50' : ''}`}
                            title={hidden ? 'Klik untuk tampilkan ke publik' : 'Klik untuk sembunyikan dari publik'}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                                !hidden ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-sky-100 bg-sky-50/50 px-5 py-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div className="text-sm text-sky-800">
            <p className="font-medium">Cara kerja:</p>
            <ul className="mt-1 space-y-1 text-xs text-sky-700">
              <li>• Field yang di-hide <strong>tidak akan tampil</strong> di popup peta untuk pengguna publik</li>
              <li>• Admin yang login tetap melihat <strong>semua field</strong> tanpa batasan</li>
              <li>• Perubahan langsung berlaku setelah toggle diubah</li>
              <li>• Halaman publik IPRO juga tidak menampilkan field yang disembunyikan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
