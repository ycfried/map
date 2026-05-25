'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

export function AddressAutocomplete({ onAddressSelect, disabled, value, onChange }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [justSelected, setJustSelected] = useState(false)
  const debounceTimeoutRef = useRef(null)
  const wrapperRef = useRef(null)

  // Update query when external value changes
  useEffect(() => {
    if (value !== undefined && !justSelected) {
      setQuery(value)
    }
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch autocomplete suggestions
  useEffect(() => {
    // Don't fetch if we just selected an address
    if (justSelected) {
      return
    }

    if (!query || query.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error('Failed to fetch suggestions')
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(data.suggestions && data.suggestions.length > 0)
      } catch (e) {
        console.error(e)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, justSelected])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    setJustSelected(false) // Reset flag when user types
    if (onChange) {
      onChange(newValue)
    }
  }

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.description)
    setSuggestions([])
    setShowSuggestions(false)
    setJustSelected(true) // Set flag to prevent immediate re-fetch
    
    if (onChange) {
      onChange(suggestion.description)
    }
    onAddressSelect(suggestion)
    
    // Reset flag after a delay
    setTimeout(() => {
      setJustSelected(false)
    }, 1000)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Start typing an address..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => !justSelected && suggestions.length > 0 && setShowSuggestions(true)}
          disabled={disabled}
          className="pl-10"
          autoComplete="off"
        />
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground mt-1">Loading suggestions...</p>
      )}

      {showSuggestions && suggestions.length > 0 && !justSelected && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelectSuggestion(s)
              }}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span>{s.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
