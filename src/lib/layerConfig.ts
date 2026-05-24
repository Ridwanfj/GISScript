export const LAYER_CONFIG = {
  garis_kota: {
    label: 'Batas Kota Tegal',
    tableName: 'garis_kota',
    type: 'line' as const,
    color: '#f43f5e',
    width: 2.5,
    defaultVisible: true,
    popupFields: [
      { key: 'WADMKK', label: 'Kota/Kab' },
      { key: 'WADMPR', label: 'Provinsi' },
    ],
  },
  kecamatan: {
    label: 'Batas Kecamatan',
    tableName: 'kecamatan',
    type: 'fill' as const,
    colorByProperty: 'WADMKC',
    opacity: 0.25,
    outlineColor: '#1d4ed8',
    outlineWidth: 2,
    defaultVisible: true,
    popupFields: [
      { key: 'WADMKC', label: 'Kecamatan' },
      { key: 'WADMKK', label: 'Kota/Kab' },
      { key: 'WADMPR', label: 'Provinsi' },
    ],
  },
  kelurahan: {
    label: 'Batas Kelurahan',
    tableName: 'kelurahan',
    type: 'fill' as const,
    colorByProperty: 'NAMOBJ',
    opacity: 0.25,
    outlineColor: '#6d28d9',
    outlineWidth: 1,
    defaultVisible: false,
    popupFields: [
      { key: 'NAMOBJ', label: 'Nama Objek' },
      { key: 'WADMKD', label: 'Kelurahan' },
      { key: 'WADMKC', label: 'Kecamatan' },
      { key: 'WADMKK', label: 'Kota/Kab' },
      { key: 'LUAS', label: 'Luas (ha)' },
    ],
  },
  pola_rdtr: {
    label: 'Pola Ruang RDTR',
    tableName: 'pola_rdtr',
    type: 'fill' as const,
    colorByProperty: 'NAMOBJ',
    opacity: 0.5,
    outlineColor: '#374151',
    outlineWidth: 0.5,
    defaultVisible: true,
    popupFields: [
      { key: 'NAMOBJ', label: 'Nama Objek' },
      { key: 'NAMZON', label: 'Zona' },
      { key: 'KODZON', label: 'Kode Zona' },
      { key: 'NAMSZN', label: 'Sub Zona' },
      { key: 'WADMKC', label: 'Kecamatan' },
      { key: 'WADMKD', label: 'Kelurahan' },
      { key: 'LUASHA', label: 'Luas (ha)' },
    ],
  },
  koordinat_menengah_dan_besar: {
    label: 'Proyek Investasi',
    tableName: 'koordinat_menengah_dan_besar',
    type: 'circle' as const,
    color: '#f59e0b',
    radius: 7,
    strokeColor: '#ffffff',
    strokeWidth: 1.5,
    defaultVisible: true,
    popupFields: [
      { key: 'nama_proyek', label: 'Nama Proyek' },
      { key: 'Uraian_Jenis_Proyek', label: 'Jenis Proyek' },
      { key: 'Sektor', label: 'Sektor' },
      { key: 'Uraian Skala Usaha', label: 'Skala Usaha' },
      { key: 'Alamat Lengkap', label: 'Alamat' },
      { key: 'Jumlah Investasi', label: 'Nilai Investasi' },
      { key: 'TKI', label: 'Tenaga Kerja' },
    ],
  },
} as const

export type LayerKey = keyof typeof LAYER_CONFIG

// Warna zona RDTR berdasarkan NAMOBJ untuk data-driven styling dan legenda
export const RDTR_ZONE_COLORS: Record<string, { color: string; label: string }> = {
  'Badan Air':                              { color: '#97DBF2', label: 'Badan Air' },
  'Badan Jalan':                            { color: '#EB1B1B', label: 'Badan Jalan' },
  'Instalasi Pengolahan Air Limbah (IPAL)':  { color: '#FF38CD', label: 'IPAL' },
  'Cagar Budaya':                           { color: '#FFE687', label: 'Cagar Budaya' },
  'Kawasan Peruntukan Industri':             { color: '#690000', label: 'Kawasan Industri' },
  'Pariwisata':                             { color: '#FFA5FF', label: 'Pariwisata' },
  'Pemakaman':                              { color: '#5AFF00', label: 'Pemakaman' },
  'Pengelolaan Persampahan':                { color: '#D79838', label: 'Persampahan' },
  'Perdagangan dan Jasa Skala Kota':        { color: '#FF7878', label: 'Perdagangan Skala Kota' },
  'Perdagangan dan Jasa Skala SWP':         { color: '#FFA5A5', label: 'Perdagangan Skala SWP' },
  'Perikanan Tangkap':                      { color: '#82B9D2', label: 'Perikanan Tangkap' },
  'Perikanan Budi Daya':                    { color: '#649BD2', label: 'Perikanan Budi Daya' },
  'Perkantoran':                            { color: '#9B9B9B', label: 'Perkantoran' },
  'Perlindungan Setempat':                  { color: '#0BD7D7', label: 'Perlindungan Setempat' },
  'Pertahanan dan Keamanan':                { color: '#9B00FF', label: 'Pertahanan & Keamanan' },
  'Perumahan Kepadatan Rendah':             { color: '#FFFA4B', label: 'Perumahan Rendah' },
  'Perumahan Kepadatan Sedang':             { color: '#FFF00B', label: 'Perumahan Sedang' },
  'Perumahan Kepadatan Tinggi':             { color: '#FFDC00', label: 'Perumahan Tinggi' },
  'Peternakan':                             { color: '#B9EBB9', label: 'Peternakan' },
  'Rimba Kota':                             { color: '#385508', label: 'Rimba Kota' },
  'Ruang Terbuka Non Hijau':                { color: '#006969', label: 'RTNH' },
  'SPU Skala Kecamatan':                    { color: '#9B319B', label: 'SPU Kecamatan' },
  'SPU Skala Kelurahan':                    { color: '#B94BB9', label: 'SPU Kelurahan' },
  'SPU Skala Kota':                         { color: '#7D1B7D', label: 'SPU Kota' },
  'Taman Kecamatan':                        { color: '#478700', label: 'Taman Kecamatan' },
  'Taman Kota':                             { color: '#4BA500', label: 'Taman Kota' },
  'Taman Kelurahan':                        { color: '#426900', label: 'Taman Kelurahan' },
  'Taman RT':                               { color: '#55E100', label: 'Taman RT' },
  'Taman RW':                               { color: '#4FC300', label: 'Taman RW' },
  'Tanaman Pangan':                         { color: '#C8F547', label: 'Tanaman Pangan' },
  'Transportasi':                           { color: '#D73800', label: 'Transportasi' },
}

// Palet warna untuk kecamatan (4 kecamatan di Kota Tegal)
export const KECAMATAN_PALETTE = [
  '#3B82F6', // Biru
  '#10B981', // Hijau
  '#F59E0B', // Kuning/Amber
  '#EF4444', // Merah
  '#8B5CF6', // Ungu (cadangan)
  '#EC4899', // Pink (cadangan)
]

// Palet warna untuk kelurahan (27 kelurahan di Kota Tegal)
export const KELURAHAN_PALETTE = [
  '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
  '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990',
  '#dcbeff', '#9A6324', '#800000', '#aaffc3', '#808000',
  '#000075', '#e6beff', '#1abc9c', '#e74c3c', '#3498db',
  '#2ecc71', '#9b59b6', '#f39c12', '#e67e22', '#16a085',
  '#2980b9', '#8e44ad', '#d35400', '#27ae60', '#c0392b',
]
