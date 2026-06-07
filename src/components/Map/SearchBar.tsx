'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMapStore } from '@/store/mapStore'

interface SearchResult {
  type: 'kecamatan' | 'kelurahan' | 'proyek' | 'ipro'
  name: string
  subtitle?: string
  coordinates: [number, number]
  zoom: number
  properties?: Record<string, unknown>
}

const TYPE_META: Record<string, { icon: string; label: string; gradient: string }> = {
  kecamatan: {
    icon: '🏛️',
    label: 'Kecamatan',
    gradient: 'from-blue-500/20 to-blue-600/10',
  },
  kelurahan: {
    icon: '🏠',
    label: 'Kelurahan',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
  },
  proyek: {
    icon: '📍',
    label: 'Proyek Investasi',
    gradient: 'from-amber-500/20 to-amber-600/10',
  },
  ipro: {
    icon: '📌',
    label: 'IPRO',
    gradient: 'from-red-500/20 to-red-600/10',
  },
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const { flyTo, setSelectedFeature } = useMapStore()

  // Debounced search
  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        setIsLoading(false)
        return
      }

      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      setIsLoading(true)

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q.trim())}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error('Search failed')
        const data: SearchResult[] = await res.json()
        setResults(data)
        setIsOpen(true)
        setActiveIndex(-1)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([])
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Handle input change with debounce
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (value.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      debounceRef.current = setTimeout(() => search(value), 300)
    },
    [search]
  )

  // Select a result
  const handleSelect = useCallback(
    (result: SearchResult) => {
      flyTo(result.coordinates, result.zoom)

      // If it's a project, show the popup
      if (result.type === 'proyek' && result.properties) {
        setSelectedFeature({
          layerKey: 'koordinat_menengah_dan_besar',
          properties: result.properties,
          coordinates: result.coordinates,
        })
      }

      // If it's IPRO, show the popup
      if (result.type === 'ipro' && result.properties) {
        setSelectedFeature({
          layerKey: 'ipro',
          properties: result.properties,
          coordinates: result.coordinates,
        })
      }

      setIsOpen(false)
      setQuery(result.name)
      inputRef.current?.blur()
    },
    [flyTo, setSelectedFeature]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        if (e.key === 'Escape') {
          setIsOpen(false)
          inputRef.current?.blur()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < results.length) {
            handleSelect(results[activeIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          inputRef.current?.blur()
          break
      }
    },
    [isOpen, results, activeIndex, handleSelect]
  )

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-search-item]')
      items[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  // Group results by type
  const grouped = results.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )

  // Build flat list with headers for keyboard nav indexing
  let flatIndex = 0
  const groupOrder: ('kecamatan' | 'kelurahan' | 'proyek' | 'ipro')[] = ['kecamatan', 'kelurahan', 'proyek', 'ipro']

  return (
    <div className="absolute top-4 left-16 lg:left-4 z-30 w-[calc(100%-5rem)] sm:w-80 lg:w-96">
      {/* Search Input */}
      <div
        className={`
          relative flex items-center rounded-2xl
          bg-gray-900/90 backdrop-blur-xl border
          shadow-xl shadow-black/30
          transition-all duration-300 ease-out
          ${isFocused
            ? 'border-blue-500/60 ring-2 ring-blue-500/20 shadow-blue-900/20'
            : 'border-gray-700/50 hover:border-gray-600/50'
          }
        `}
      >
        {/* Search icon */}
        <div className="pl-4 pr-2 flex items-center justify-center text-gray-400 shrink-0">
          {isLoading ? (
            <div className="w-4.5 h-4.5 rounded-full border-2 border-gray-600 border-t-blue-400 animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4.5 h-4.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          id="map-search-input"
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            if (results.length > 0) setIsOpen(true)
          }}
          onBlur={() => setIsFocused(false)}
          placeholder="Cari kecamatan, kelurahan, proyek, IPRO..."
          className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 py-3 pr-3 outline-none"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="pr-3.5 pl-1 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            aria-label="Hapus pencarian"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="mt-2 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/50 max-h-80 overflow-y-auto scrollbar-thin animate-in"
          style={{
            animation: 'searchDropdownIn 200ms ease-out',
          }}
        >
          {results.length === 0 && !isLoading ? (
            <div className="px-5 py-6 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm text-gray-400">Tidak ada hasil</p>
              <p className="text-xs text-gray-600 mt-1">
                Coba kata kunci lain
              </p>
            </div>
          ) : (
            <div className="py-1.5">
              {groupOrder.map((type) => {
                const items = grouped[type]
                if (!items || items.length === 0) return null
                const meta = TYPE_META[type]

                return (
                  <div key={type}>
                    {/* Group header */}
                    <div className={`px-4 py-2 bg-gradient-to-r ${meta.gradient} border-b border-gray-800/40`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {meta.icon} {meta.label}
                      </span>
                      <span className="ml-2 text-[10px] text-gray-600">
                        {items.length} hasil
                      </span>
                    </div>

                    {/* Items */}
                    {items.map((result) => {
                      const idx = flatIndex++
                      return (
                        <button
                          key={`${result.type}-${result.name}-${idx}`}
                          data-search-item
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`
                            w-full text-left px-4 py-2.5 flex items-start gap-3
                            transition-all duration-150 cursor-pointer
                            ${activeIndex === idx
                              ? 'bg-blue-600/15 border-l-2 border-blue-500'
                              : 'border-l-2 border-transparent hover:bg-gray-800/50'
                            }
                          `}
                        >
                          <span className="text-base mt-0.5 shrink-0">
                            {meta.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium truncate ${
                                activeIndex === idx
                                  ? 'text-blue-300'
                                  : 'text-gray-200'
                              }`}
                            >
                              {result.name}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-3.5 h-3.5 mt-1 shrink-0 transition-opacity ${
                              activeIndex === idx
                                ? 'text-blue-400 opacity-100'
                                : 'text-gray-600 opacity-0'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {/* Keyboard hint */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-800/40 flex items-center gap-3">
              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-500 text-[9px] font-mono">↑↓</kbd>
                navigasi
              </span>
              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-500 text-[9px] font-mono">↵</kbd>
                pilih
              </span>
              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 text-[9px] font-mono">esc</kbd>
                tutup
              </span>
            </div>
          )}
        </div>
      )}

      {/* Inline animation keyframes */}
      <style jsx>{`
        @keyframes searchDropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
