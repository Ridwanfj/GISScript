-- Migration: Tabel field_visibility untuk kontrol hide/show detail popup peta
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor

-- ═══════════════════════════════════════════════════════════════
-- Tabel field_visibility
-- Menyimpan konfigurasi field mana yang disembunyikan dari publik
-- di popup peta (layer investasi dan IPRO)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS field_visibility (
  id SERIAL PRIMARY KEY,
  layer_key TEXT NOT NULL,        -- e.g. 'koordinat_menengah_dan_besar', 'ipro'
  field_key TEXT NOT NULL,        -- e.g. 'Jumlah Investasi', 'KOORDINAT'
  hidden_for_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(layer_key, field_key)
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_field_visibility_layer 
  ON field_visibility (layer_key, hidden_for_public);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_field_visibility_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS field_visibility_updated_at ON field_visibility;
CREATE TRIGGER field_visibility_updated_at
  BEFORE UPDATE ON field_visibility
  FOR EACH ROW
  EXECUTE FUNCTION update_field_visibility_timestamp();

-- ═══════════════════════════════════════════════════════════════
-- Seed: default semua field visible, kecuali KOORDINAT di IPRO
-- Admin bisa mengubah via halaman /admin/visibility
-- ═══════════════════════════════════════════════════════════════

INSERT INTO field_visibility (layer_key, field_key, hidden_for_public)
VALUES
  -- IPRO fields
  ('ipro', 'NO', false),
  ('ipro', 'JENIS IPRO', false),
  ('ipro', 'ALAMAT', false),
  ('ipro', 'KOORDINAT', true),   -- Default: koordinat disembunyikan
  -- Investasi fields
  ('koordinat_menengah_dan_besar', 'nama_proyek', false),
  ('koordinat_menengah_dan_besar', 'Uraian_Jenis_Proyek', false),
  ('koordinat_menengah_dan_besar', 'Sektor', false),
  ('koordinat_menengah_dan_besar', 'Uraian Skala Usaha', false),
  ('koordinat_menengah_dan_besar', 'Alamat Lengkap', false),
  ('koordinat_menengah_dan_besar', 'Jumlah Investasi', false),
  ('koordinat_menengah_dan_besar', 'TKI', false)
ON CONFLICT (layer_key, field_key) DO NOTHING;
