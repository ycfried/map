'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

export function MapComponent({ submissions }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const initMap = async () => {
      // Dynamically import Leaflet
      const L = (await import('leaflet')).default

      // Fix icon issue with webpack
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Initialize map if not already done
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([39.8283, -98.5795], 4) // Center of US

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current)
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      // Add markers for submissions
      if (submissions && submissions.length > 0) {
        const bounds = []

        submissions.forEach((submission) => {
          if (submission.latitude && submission.longitude) {
            const marker = L.marker([submission.latitude, submission.longitude])
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div class="p-2">
                  <h3 class="font-semibold">${submission.formData?.title || 'Entry'}</h3>
                  <p class="text-sm text-gray-600">${submission.formattedAddress}</p>
                  ${submission.formData?.notes ? `<p class="text-xs mt-1">${submission.formData.notes}</p>` : ''}
                  <p class="text-xs text-gray-400 mt-1">${new Date(submission.createdAt).toLocaleDateString()}</p>
                </div>
              `)

            markersRef.current.push(marker)
            bounds.push([submission.latitude, submission.longitude])
          }
        })

        // Fit map to show all markers
        if (bounds.length > 0) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [submissions])

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg border"
      style={{ minHeight: '500px' }}
    />
  )
}
