'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

const MARKER_COLORS = {
  green: { primary: '#10b981', secondary: '#059669' },
  blue: { primary: '#3b82f6', secondary: '#1d4ed8' },
  red: { primary: '#ef4444', secondary: '#dc2626' },
  yellow: { primary: '#eab308', secondary: '#ca8a04' },
  purple: { primary: '#a855f7', secondary: '#7e22ce' },
  orange: { primary: '#f97316', secondary: '#ea580c' },
  pink: { primary: '#ec4899', secondary: '#db2777' },
  gray: { primary: '#6b7280', secondary: '#4b5563' },
}

export function MapComponent({ submissions, routeOrder = null, showRoute = false, filterGroup = null, mapStyle = 'light' }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)
  const tileLayerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  // Map tile providers
  const tileProviders = {
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
    },
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([39.8283, -98.5795], 4)

        const provider = tileProviders[mapStyle] || tileProviders.light
        tileLayerRef.current = L.tileLayer(provider.url, {
          attribution: provider.attribution,
          subdomains: 'abcd',
          maxZoom: 20,
        }).addTo(mapInstanceRef.current)

        setMapReady(true)
      } else if (tileLayerRef.current && mapInstanceRef.current) {
        // Update tile layer if map style changed
        tileLayerRef.current.remove()
        const provider = tileProviders[mapStyle] || tileProviders.light
        tileLayerRef.current = L.tileLayer(provider.url, {
          attribution: provider.attribution,
          subdomains: 'abcd',
          maxZoom: 20,
        }).addTo(mapInstanceRef.current)
      }

      // Clear existing markers and routes
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
      if (routeLayerRef.current) {
        routeLayerRef.current.remove()
        routeLayerRef.current = null
      }

      // Filter submissions by group if needed
      let filteredSubmissions = submissions
      if (filterGroup) {
        filteredSubmissions = submissions.filter(s => s.formData?.group === filterGroup)
      }

      if (filteredSubmissions && filteredSubmissions.length > 0) {
        const bounds = []
        const orderedSubmissions = routeOrder && showRoute 
          ? routeOrder.map(id => filteredSubmissions.find(s => s._id === id)).filter(Boolean)
          : filteredSubmissions

        orderedSubmissions.forEach((submission, index) => {
          if (submission.latitude && submission.longitude) {
            const markerColorName = submission.formData?.markerColor || 'green'
            const colors = MARKER_COLORS[markerColorName] || MARKER_COLORS.green

            let icon
            if (showRoute && routeOrder) {
              // Route marker with number
              const iconHtml = `
                <div style="
                  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
                  width: 40px;
                  height: 40px;
                  border-radius: 50% 50% 50% 0;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
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
                    font-size: 16px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                  ">${index + 1}</span>
                </div>
              `
              icon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40],
              })
            } else {
              // Regular marker
              const iconHtml = `
                <div style="
                  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
                  width: 36px;
                  height: 36px;
                  border-radius: 50% 50% 50% 0;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                  transform: rotate(-45deg);
                  position: relative;
                ">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(45deg);
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                  "></div>
                </div>
              `
              icon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
              })
            }

            const marker = L.marker([submission.latitude, submission.longitude], { icon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div style="
                  padding: 14px;
                  min-width: 220px;
                  font-family: system-ui, -apple-system, sans-serif;
                ">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <div style="
                      width: 12px;
                      height: 12px;
                      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
                      border-radius: 50%;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    "></div>
                    <h3 style="
                      font-weight: 600;
                      font-size: 17px;
                      margin: 0;
                      color: #1f2937;
                    ">${submission.formData?.title || 'Entry'}</h3>
                  </div>
                  ${submission.formData?.group ? `
                    <div style="
                      display: inline-block;
                      padding: 2px 8px;
                      background: #f3f4f6;
                      border-radius: 12px;
                      font-size: 11px;
                      color: #6b7280;
                      margin-bottom: 8px;
                      font-weight: 500;
                    ">
                      🏷️ ${submission.formData.group}
                    </div>
                  ` : ''}
                  <p style="
                    font-size: 13px;
                    color: #6b7280;
                    margin: 0 0 10px 0;
                    line-height: 1.5;
                  ">${submission.formattedAddress}</p>
                  ${submission.formData?.notes ? `
                    <p style="
                      font-size: 12px;
                      color: #4b5563;
                      margin: 10px 0;
                      padding: 10px;
                      background: #f9fafb;
                      border-left: 3px solid ${colors.primary};
                      border-radius: 4px;
                      line-height: 1.5;
                    ">${submission.formData.notes}</p>
                  ` : ''}
                  <div style="
                    font-size: 11px;
                    color: #9ca3af;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <span>
                      ${new Date(submission.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    ${showRoute && routeOrder ? `<span style="
                      background: ${colors.primary};
                      color: white;
                      padding: 2px 6px;
                      border-radius: 10px;
                      font-weight: 600;
                    ">Stop #${index + 1}</span>` : ''}
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

        // Draw route lines
        if (showRoute && routeOrder && orderedSubmissions.length > 1) {
          const routeCoordinates = orderedSubmissions
            .filter(s => s.latitude && s.longitude)
            .map(s => [s.latitude, s.longitude])

          // Get color from first submission or use blue
          const firstColor = orderedSubmissions[0]?.formData?.markerColor || 'blue'
          const routeColors = MARKER_COLORS[firstColor] || MARKER_COLORS.blue

          routeLayerRef.current = L.polyline(routeCoordinates, {
            color: routeColors.primary,
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1,
            dashArray: '12, 8',
            dashOffset: '0',
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(mapInstanceRef.current)
        }

        // Fit bounds
        if (bounds.length > 0) {
          if (bounds.length === 1) {
            mapInstanceRef.current.setView(bounds[0], 13)
          } else {
            mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] })
          }
        }
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [submissions, routeOrder, showRoute, filterGroup, mapStyle])

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden"
        style={{ minHeight: '500px' }}
      />
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
      `}</style>
    </div>
  )
}
