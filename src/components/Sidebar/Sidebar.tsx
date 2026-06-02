'use client'

import Image from 'next/image'
import LayerControl from '@/components/Map/LayerControl'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72
          bg-gray-950/95 backdrop-blur-2xl border-r border-gray-800/50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Map icon */}
              <div className="flex items-center justify-center w-10 h-10 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo Kota Tegal"
                  width={40}
                  height={40}
                  className="object-contain drop-shadow-md"
                />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">
                  WebGIS
                </h1>
                <p className="text-xs text-gray-400 font-medium">Kota Tegal</p>
              </div>
            </div>
            {/* Close button - mobile only */}
            <button
              onClick={onClose}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label="Tutup sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
          {/* Layer toggles */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1 mb-3">
              Layer Peta & Legenda
            </h2>
            <LayerControl />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-800/50">
          <p className="text-[10px] text-gray-600 text-center">
            © 2025 Pemerintah Kota Tegal
          </p>
        </div>
      </aside>
    </>
  )
}
