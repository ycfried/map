'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

export function MapComponent({ submissions, routeOrder = null, showRoute = false }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

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
        mapInstanceRef.current = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([39.8283, -98.5795], 4)

        // Use CartoDB Positron for a clean, modern look
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }).addTo(mapInstanceRef.current)

        setMapReady(true)
      }

      // Clear existing markers and routes
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
      if (routeLayerRef.current) {
        routeLayerRef.current.remove()
        routeLayerRef.current = null
      }

      // Add markers for submissions
      if (submissions && submissions.length > 0) {
        const bounds = []
        const orderedSubmissions = routeOrder && showRoute 
          ? routeOrder.map(id => submissions.find(s => s._id === id)).filter(Boolean)
          : submissions

        orderedSubmissions.forEach((submission, index) => {
          if (submission.latitude && submission.longitude) {
            // Create custom icon with number if showing route
            let icon
            if (showRoute && routeOrder) {
              const iconHtml = `
                <div style="
                  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                  width: 36px;
                  height: 36px;
                  border-radius: 50% 50% 50% 0;
                  border: 3px solid white;
                  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transform: rotate(-45deg);
                  position: relative;
                ">
                  <span style="
                    transform: rotate(45deg);
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                  ">${index + 1}</span>
                </div>
              `
              icon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
              })
            } else {
              // Modern teardrop marker
              const iconHtml = `
                <div style="
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  width: 32px;
                  height: 32px;
                  border-radius: 50% 50% 50% 0;
                  border: 3px solid white;
                  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                  transform: rotate(-45deg);
                  position: relative;
                ">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(45deg);
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                  "></div>
                </div>
              `
              icon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
              })
            }

            const marker = L.marker([submission.latitude, submission.longitude], { icon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div style="
                  padding: 12px;
                  min-width: 200px;
                  font-family: system-ui, -apple-system, sans-serif;
                ">
                  <h3 style="
                    font-weight: 600;
                    font-size: 16px;
                    margin: 0 0 8px 0;
                    color: #1f2937;
                  ">${submission.formData?.title || 'Entry'}</h3>
                  <p style="
                    font-size: 13px;
                    color: #6b7280;
                    margin: 0 0 8px 0;
                    line-height: 1.4;
                  ">${submission.formattedAddress}</p>
                  ${submission.formData?.notes ? `
                    <p style="
                      font-size: 12px;
                      color: #4b5563;
                      margin: 8px 0;
                      padding: 8px;
                      background: #f3f4f6;
                      border-radius: 4px;
                    ">${submission.formData.notes}</p>
                  ` : ''}
                  <div style="
                    font-size: 11px;
                    color: #9ca3af;
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #e5e7eb;
                  ">
                    ${new Date(submission.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                    ${showRoute && routeOrder ? `<br/>Stop #${index + 1}` : ''}
                  </div>
                </div>
              `, {
                maxWidth: 300,
                className: 'custom-popup'
              })

            markersRef.current.push(marker)
            bounds.push([submission.latitude, submission.longitude])
          }
        })

        // Draw route lines if showing route
        if (showRoute && routeOrder && orderedSubmissions.length > 1) {
          const routeCoordinates = orderedSubmissions
            .filter(s => s.latitude && s.longitude)
            .map(s => [s.latitude, s.longitude])

          routeLayerRef.current = L.polyline(routeCoordinates, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.7,
            smoothFactor: 1,
            dashArray: '10, 10',
            dashOffset: '0'
          }).addTo(mapInstanceRef.current)
        }

        // Fit map to show all markers
        if (bounds.length > 0) {
          if (bounds.length === 1) {
            mapInstanceRef.current.setView(bounds[0], 13)
          } else {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
          }
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
  }, [submissions, routeOrder, showRoute])

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg border-2 border-gray-200 shadow-lg"
        style={{ minHeight: '500px' }}
      />
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}
