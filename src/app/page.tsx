'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import heroIllustration from '@/assets/tegal-illustration.jpg'
import {
  Map as MapIcon,
  Layers,
  Search,
  Filter,
  MousePointerClick,
  Building2,
  TreePine,
  ArrowRight,
  ChevronDown,
  MapPin,
  TrendingUp,
} from 'lucide-react'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
interface StatsData {
  kecamatan: number
  kelurahan: number
  zona_rdtr: number
  proyek_investasi: number
  total_investasi: number
  total_tki: number
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────
const MAP_APP_URL = '/map'

// ────────────────────────────────────────────
// Custom Hooks (module-level, bukan di dalam komponen)
// ────────────────────────────────────────────
function useCountUp(target: number, start: boolean, duration = 1400) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, start, duration])
  return val
}

function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current || inView) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true)
      },
      { threshold },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [inView, threshold])
  return { ref, inView }
}

// ────────────────────────────────────────────
// Utility Components (module-level)
// ────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function StatNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4)
  const n = useCountUp(value, inView)
  return (
    <div ref={ref} className="tabular-nums">
      {n.toLocaleString('id-ID')}
      {suffix}
    </div>
  )
}

function Dot() {
  return <span className="text-gray-300">•</span>
}

function LogoMark() {
  return (
    <div className="relative w-10 h-10 shrink-0">
      <Image
        src="/logo.svg"
        alt="Logo Kota Tegal"
        width={40}
        height={40}
        className="object-contain"
      />
    </div>
  )
}

function GridBackdrop() {
  return (
    <>
      {/* subtle blueprint grid */}
      <div
        className="absolute inset-0 z-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(186 230 253) 1px, transparent 1px), linear-gradient(to bottom, rgb(186 230 253) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 85%)',
        }}
      />
      {/* soft blue + cyan glow effects */}
      <div className="absolute z-0 -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky-300/40 blur-3xl" />
      <div className="absolute z-0 top-1/4 -right-24 w-[30rem] h-[30rem] rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="absolute z-0 -bottom-24 left-1/4 w-[26rem] h-[26rem] rounded-full bg-blue-200/40 blur-3xl" />
    </>
  )
}

// ────────────────────────────────────────────
// Section Components
// ────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled
          ? 'bg-white/85 backdrop-blur border-b border-gray-200'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Forum Investasi Tegal (FIT)</div>
            <div className="text-[12px] text-gray-800 -mt-0.5">Zone</div>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#tentang" className="hover:text-sky-600 transition-colors">
            Tentang
          </a>
          <a href="#fitur" className="hover:text-sky-600 transition-colors">
            Fitur
          </a>
          <a href="#data" className="hover:text-sky-600 transition-colors">
            Data
          </a>
          <a href="#zona" className="hover:text-sky-600 transition-colors">
            Tata Ruang
          </a>
        </nav>
        <a
          href={MAP_APP_URL}
          className="inline-flex items-center gap-1.5 bg-sky-600 text-white text-sm px-4 py-2 rounded-md hover:bg-sky-700 transition-colors shadow-sm"
        >
          Buka Peta
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="relative isolate pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Transparent illustration background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroIllustration}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
        {/* soft wash so text stays readable over the photo */}
        <div className="absolute inset-0 bg-white/45" />
      </div>
      <GridBackdrop />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-sky-800 border border-sky-200 bg-sky-50/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Platform Geospasial Pemerintah Kota Tegal
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-gray-900">
            FIT Zone{' '}
            <span className="relative inline-block text-sky-700">
              Kota Tegal
              <span className="absolute -bottom-1 left-0 right-0 h-[8px] bg-amber-300/70 -z-10 rounded-sm" />
            </span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Sistem Informasi Geografis Kota Tegal — peta interaktif batas wilayah,
            pola ruang RDTR, dan sebaran proyek investasi dalam satu platform.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href={MAP_APP_URL}
              className="group inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm"
            >
              Buka Peta Interaktif
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#tentang"
              className="inline-flex items-center gap-2 border border-sky-200 bg-white/80 backdrop-blur text-sky-700 px-6 py-3 rounded-md text-sm font-medium hover:bg-sky-50 transition-colors"
            >
              Pelajari Lebih Lanjut
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </Reveal>
        <HeroBadges />
      </div>
    </section>
  )
}

function About() {
  const items = [
    {
      icon: MapIcon,
      title: 'Peta Interaktif',
      desc: 'Eksplorasi batas wilayah dari skala kota hingga kelurahan dengan navigasi yang mulus.',
      color: 'bg-sky-600',
      ring: 'hover:border-sky-400',
    },
    {
      icon: Layers,
      title: 'Tata Ruang RDTR',
      desc: 'Visualisasi lebih dari 30 zona pemanfaatan ruang sesuai regulasi terbaru.',
      color: 'bg-emerald-600',
      ring: 'hover:border-emerald-400',
    },
    {
      icon: Building2,
      title: 'Data Investasi',
      desc: 'Pantau sebaran proyek investasi menengah & besar di seluruh wilayah Kota Tegal.',
      color: 'bg-amber-500',
      ring: 'hover:border-amber-400',
    },
  ]
  return (
    <section id="tentang" className="py-24 sm:py-32 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <span className="text-xs font-medium text-sky-600 uppercase tracking-widest">
              Tentang
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Tentang FIT Zone
            </h2>
            <p className="mt-5 text-gray-600 leading-relaxed">
              Platform ini dibangun untuk memudahkan akses informasi geospasial
              Kota Tegal — dirancang untuk masyarakat, investor, akademisi, dan
              pemerintah dalam satu antarmuka yang sederhana namun kaya data.
            </p>
          </Reveal>
        </div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 100}>
              <div className={`group h-full p-6 rounded-xl border border-gray-200 bg-white ${it.ring} hover:shadow-md transition-all`}>
                <div className={`w-10 h-10 rounded-md ${it.color} text-white flex items-center justify-center`}>
                  <it.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{it.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: Layers,
      title: 'Layer Peta Multi-Lapis',
      desc: 'Toggle batas kota, kecamatan, kelurahan, pola ruang, dan investasi sesuai kebutuhan analisis.',
      color: 'text-sky-600 bg-sky-50 border-sky-200',
    },
    {
      icon: MapPin,
      title: 'Clustering Investasi Cerdas',
      desc: 'Zoom otomatis dari kecamatan ke kelurahan hingga detail proyek individu.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      icon: Filter,
      title: 'Legenda & Filter Dinamis',
      desc: 'Filter berdasarkan zona RDTR atau sektor investasi secara real-time.',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      icon: Search,
      title: 'Pencarian Lokasi',
      desc: 'Cari alamat, nama wilayah, atau titik kepentingan dengan cepat dan akurat.',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      icon: MousePointerClick,
      title: 'Popup Informasi Detail',
      desc: 'Klik fitur peta untuk melihat atribut lengkap, foto, dan metadata sumber.',
      color: 'text-violet-600 bg-violet-50 border-violet-200',
    },
    {
      icon: TrendingUp,
      title: 'Statistik & Insight',
      desc: 'Ringkasan data investasi, jumlah proyek, dan tenaga kerja dalam visualisasi ringkas.',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
  ]
  return (
    <section id="fitur" className="py-24 sm:py-32 bg-sky-50/60 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <Reveal>
            <div className="max-w-2xl">
              <span className="text-xs font-medium text-sky-600 uppercase tracking-widest">
                Kemampuan
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
                Fitur Unggulan
              </h2>
              <p className="mt-4 text-gray-600">
                Dibangun di atas MapLibre GL, Supabase, dan Next.js untuk pengalaman
                peta yang ringan, cepat, dan dapat diandalkan.
              </p>
            </div>
          </Reveal>
        </div>
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
              <div className="group bg-white p-7 h-full transition-colors hover:bg-sky-50/50">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-md border flex items-center justify-center ${f.color}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-gray-300 tabular-nums font-semibold">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function MapPreview() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-medium text-sky-600 uppercase tracking-widest">
              Pratinjau
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Jelajahi Peta Kota Tegal
            </h2>
            <p className="mt-4 text-gray-600">
              Antarmuka peta yang responsif dengan kontrol layer, legenda, dan
              pencarian terintegrasi.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-12 relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-md ring-1 ring-sky-100">
            <div className="relative aspect-[16/9] bg-sky-950">
              {/* abstract map grid */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 800 450"
                preserveAspectRatio="none"
              >
                <path
                  d="M120,120 L300,90 L460,140 L620,110 L700,200 L660,320 L500,360 L320,340 L180,300 L100,220 Z"
                  fill="#0c4a6e"
                  stroke="rgba(125,211,252,0.45)"
                  strokeWidth="1.5"
                />
                <path
                  d="M300,90 L320,340 M460,140 L500,360 M180,300 L460,140"
                  stroke="rgba(125,211,252,0.25)"
                  strokeWidth="1"
                  fill="none"
                />
                {(
                  [
                    [250, 180],
                    [400, 220],
                    [520, 200],
                    [380, 290],
                    [200, 240],
                    [560, 280],
                  ] as [number, number][]
                ).map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="14" fill="rgba(16,185,129,0.2)" />
                    <circle cx={x} cy={y} r="6" fill="#10b981" />
                  </g>
                ))}
              </svg>
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-sky-950/80" />
              {/* fake search control */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 flex items-center gap-2 shadow-sm">
                <Search className="w-3.5 h-3.5 text-sky-500" />
                Cari kelurahan atau alamat…
              </div>
              {/* fake layer control */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-md border border-gray-200 p-2 shadow-sm">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-1 pb-1">
                  Layer
                </div>
                {[
                  { l: 'Batas Kota', c: 'bg-sky-600' },
                  { l: 'Kecamatan', c: 'bg-emerald-600' },
                  { l: 'Pola Ruang', c: 'bg-amber-500' },
                  { l: 'Investasi', c: 'bg-rose-500' },
                ].map(({ l, c }) => (
                  <div key={l} className="flex items-center gap-2 px-1 py-0.5 text-xs text-gray-700">
                    <span className={`w-3 h-3 rounded-sm ${c}`} />
                    {l}
                  </div>
                ))}
              </div>
              {/* bottom info */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 flex-wrap">
                <div className="text-white">
                  <div className="text-xs uppercase tracking-widest text-sky-300/80">
                    Peta Interaktif
                  </div>
                  <div className="text-2xl font-semibold mt-1">Kota Tegal · Jawa Tengah</div>
                </div>
                <a
                  href={MAP_APP_URL}
                  className="inline-flex items-center gap-2 bg-white text-sky-700 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-sky-50 transition-colors"
                >
                  Buka Peta Sekarang
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function formatInvestasi(value: number): { display: number; suffix: string } {
  if (value >= 1_000_000_000_000) {
    return { display: Math.round(value / 1_000_000_000_000), suffix: 'T+' }
  }
  if (value >= 1_000_000_000) {
    return { display: Math.round(value / 1_000_000_000), suffix: 'M+' }
  }
  if (value >= 1_000_000) {
    return { display: Math.round(value / 1_000_000), suffix: 'Jt+' }
  }
  return { display: Math.round(value), suffix: '' }
}

function Stats({ stats }: { stats: StatsData | null }) {
  const inv = stats ? formatInvestasi(stats.total_investasi) : { display: 500, suffix: 'M+' }
  const items = [
    { value: stats?.kecamatan ?? 4, suffix: '', label: 'Kecamatan', color: 'text-sky-400' },
    { value: stats?.kelurahan ?? 27, suffix: '', label: 'Kelurahan', color: 'text-emerald-400' },
    { value: stats?.zona_rdtr ?? 30, suffix: stats ? '' : '+', label: 'Zona Tata Ruang', color: 'text-amber-400' },
    { value: stats?.proyek_investasi ?? 100, suffix: stats ? '' : '+', label: 'Proyek Investasi', color: 'text-rose-400' },
    { value: inv.display, suffix: inv.suffix, label: 'Total Nilai (Rp)', color: 'text-violet-400' },
    { value: stats?.total_tki ?? 5000, suffix: stats ? '' : '+', label: 'Tenaga Kerja', color: 'text-cyan-400' },
  ]
  return (
    <section id="data" className="py-24 sm:py-32 bg-sky-950 text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-medium text-sky-300 uppercase tracking-widest">
              Statistik
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Data dalam Angka
            </h2>
            <p className="mt-4 text-sky-100/70">
              Ringkasan cakupan data spasial dan investasi yang tersedia pada platform.
            </p>
          </div>
        </Reveal>
        <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-white/10 rounded-xl overflow-hidden">
          {items.map((s, i) => (
            <Reveal key={s.label} delay={i * 60}>
              <div className="bg-sky-950 p-6 h-full">
                <div className={`text-3xl sm:text-4xl font-semibold tracking-tight ${s.color}`}>
                  <StatNumber value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-xs text-sky-100/60 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// All 31 RDTR zones with their actual colors from layerConfig
const RDTR_ZONES: { name: string; color: string; label: string }[] = [
  { name: 'Badan Air', color: '#97DBF2', label: 'Badan Air' },
  { name: 'Badan Jalan', color: '#EB1B1B', label: 'Badan Jalan' },
  { name: 'Cagar Budaya', color: '#FFE687', label: 'Cagar Budaya' },
  { name: 'Instalasi Pengolahan Air Limbah (IPAL)', color: '#FF38CD', label: 'IPAL' },
  { name: 'Kawasan Peruntukan Industri', color: '#690000', label: 'Kawasan Industri' },
  { name: 'Pariwisata', color: '#FFA5FF', label: 'Pariwisata' },
  { name: 'Pemakaman', color: '#5AFF00', label: 'Pemakaman' },
  { name: 'Pengelolaan Persampahan', color: '#D79838', label: 'Persampahan' },
  { name: 'Perdagangan dan Jasa Skala Kota', color: '#FF7878', label: 'Perdagangan Skala Kota' },
  { name: 'Perdagangan dan Jasa Skala SWP', color: '#FFA5A5', label: 'Perdagangan Skala SWP' },
  { name: 'Perikanan Budi Daya', color: '#649BD2', label: 'Perikanan Budi Daya' },
  { name: 'Perikanan Tangkap', color: '#82B9D2', label: 'Perikanan Tangkap' },
  { name: 'Perkantoran', color: '#9B9B9B', label: 'Perkantoran' },
  { name: 'Perlindungan Setempat', color: '#0BD7D7', label: 'Perlindungan Setempat' },
  { name: 'Pertahanan dan Keamanan', color: '#9B00FF', label: 'Pertahanan & Keamanan' },
  { name: 'Perumahan Kepadatan Rendah', color: '#FFFA4B', label: 'Perumahan Rendah' },
  { name: 'Perumahan Kepadatan Sedang', color: '#FFF00B', label: 'Perumahan Sedang' },
  { name: 'Perumahan Kepadatan Tinggi', color: '#FFDC00', label: 'Perumahan Tinggi' },
  { name: 'Peternakan', color: '#B9EBB9', label: 'Peternakan' },
  { name: 'Rimba Kota', color: '#385508', label: 'Rimba Kota' },
  { name: 'Ruang Terbuka Non Hijau', color: '#006969', label: 'RTNH' },
  { name: 'SPU Skala Kecamatan', color: '#9B319B', label: 'SPU Kecamatan' },
  { name: 'SPU Skala Kelurahan', color: '#B94BB9', label: 'SPU Kelurahan' },
  { name: 'SPU Skala Kota', color: '#7D1B7D', label: 'SPU Kota' },
  { name: 'Taman Kecamatan', color: '#478700', label: 'Taman Kecamatan' },
  { name: 'Taman Kelurahan', color: '#426900', label: 'Taman Kelurahan' },
  { name: 'Taman Kota', color: '#4BA500', label: 'Taman Kota' },
  { name: 'Taman RT', color: '#55E100', label: 'Taman RT' },
  { name: 'Taman RW', color: '#4FC300', label: 'Taman RW' },
  { name: 'Tanaman Pangan', color: '#C8F547', label: 'Tanaman Pangan' },
  { name: 'Transportasi', color: '#D73800', label: 'Transportasi' },
]

/** Compute a light tinted background + readable text from any hex color */
function zoneBadgeStyle(hex: string) {
  // Parse hex → RGB
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Relative luminance (approximate)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
    color: lum > 0.55 ? '#374151' : hex,
    dotColor: hex,
  }
}

function Zones({ stats }: { stats: StatsData | null }) {
  const zoneCount = stats?.zona_rdtr ?? RDTR_ZONES.length
  return (
    <section id="zona" className="py-24 sm:py-32 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-widest">
                RDTR
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
                Pola Ruang Kota Tegal
              </h2>
              <p className="mt-5 text-gray-600 leading-relaxed">
                Klasifikasi zona pemanfaatan ruang yang divisualisasikan pada peta
                mengikuti Rencana Detail Tata Ruang (RDTR) Kota Tegal terbaru.
                Setiap zona memiliki warna khas dan atribut regulasi yang dapat
                ditelusuri.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
                <TreePine className="w-4 h-4" />
                {zoneCount} kategori zona terdokumentasi
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={120}>
              <div className="flex flex-wrap gap-2">
                {RDTR_ZONES.map((z) => {
                  const s = zoneBadgeStyle(z.color)
                  return (
                    <span
                      key={z.name}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm border"
                      style={{
                        backgroundColor: s.backgroundColor,
                        borderColor: s.borderColor,
                        color: s.color,
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.dotColor }}
                      />
                      {z.label}
                    </span>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">FIT Zone</div>
                <div className="text-xs text-gray-500">Sistem Informasi Geografis</div>
              </div>
            </div>
            <p className="mt-5 text-sm text-gray-600 max-w-sm leading-relaxed">
              Platform geospasial Pemerintah Kota Tegal untuk akses
              informasi batas wilayah, tata ruang, dan investasi.
            </p>
          </div>
          <div className="md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Navigasi
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>
                <a href="#top" className="hover:text-gray-900">Beranda</a>
              </li>
              <li>
                <a href={MAP_APP_URL} className="hover:text-gray-900">Peta</a>
              </li>
              <li>
                <a href="/admin" className="hover:text-gray-900">Admin</a>
              </li>
              <li>
                <a href="#tentang" className="hover:text-gray-900">Tentang</a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Alamat
            </div>
            <address className="mt-4 not-italic text-sm text-gray-700 leading-relaxed">
              Pemerintah Kota Tegal<br />
              Kota Tegal, Jawa Tengah<br />
              Indonesia
            </address>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>© 2025 Pemerintah Kota Tegal. Seluruh hak dilindungi.</div>
          <div>Dibangun dengan Next.js · MapLibre GL · Supabase</div>
        </div>
      </div>
    </footer>
  )
}

// ────────────────────────────────────────────
// Hero stat badges — uses live stats if available
// ────────────────────────────────────────────
function HeroBadges() {
  const [stats, setStats] = useState<StatsData | null>(null)
  useEffect(() => {
    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setStats(d) })
      .catch(() => {})
  }, [])
  return (
    <Reveal delay={320}>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500">
        <span className="font-medium text-gray-700">{stats?.kecamatan ?? 4} Kecamatan</span>
        <Dot />
        <span className="font-medium text-gray-700">{stats?.kelurahan ?? 27} Kelurahan</span>
        <Dot />
        <span className="font-medium text-gray-700">{stats?.zona_rdtr ?? '30+'} Zona RDTR</span>
        <Dot />
        <span className="font-medium text-gray-700">{stats?.proyek_investasi ?? '100+'} Proyek Investasi</span>
      </div>
    </Reveal>
  )
}

// ────────────────────────────────────────────
// Main Page Component (default export untuk Next.js)
// ────────────────────────────────────────────
export default function Landing() {
  const [stats, setStats] = useState<StatsData | null>(null)

  const fetchStats = useCallback(() => {
    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setStats(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <Nav />
      <Hero />
      <About />
      <Features />
      <MapPreview />
      <Stats stats={stats} />
      <Zones stats={stats} />
      <Footer />
    </div>
  )
}
