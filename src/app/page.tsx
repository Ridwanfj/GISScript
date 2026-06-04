'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar/Sidebar'
import FeaturePopup from '@/components/Map/FeaturePopup'
import SearchBar from '@/components/Map/SearchBar'

const MapContainer = dynamic(() => import('@/components/Map/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-800 border-t-blue-500 animate-spin" />
        </div>
        <p className="text-sm text-gray-400 font-medium animate-pulse">
          Memuat peta...
        </p>
      </div>
    </div>
  ),
})

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <main className="relative flex-1 h-full">
        {/* Hamburger menu button - mobile */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-30 lg:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-gray-900/90 backdrop-blur-lg border border-gray-700/50 text-white shadow-xl hover:bg-gray-800 transition-all duration-200 cursor-pointer"
          aria-label="Buka menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Search bar */}
        <SearchBar />

        {/* Map */}
        <MapContainer />

        {/* Feature popup */}
        <FeaturePopup />
      </main>
    </div>
  )
}
