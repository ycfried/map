'use server'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error('GOOGLE_MAPS_API_KEY is not set in environment variables')
}

export async function autocompletePlaces(input) {
  if (!input || input.trim().length === 0) {
    return []
  }

  try {
    // Use Places API (New) Autocomplete endpoint
    const url = `https://places.googleapis.com/v1/places:autocomplete`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({
        input: input,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Places API error:', response.status, errorText)
      throw new Error(`Places API error: ${response.status}`)
    }

    const data = await response.json()
    const suggestions = data.suggestions || []

    return suggestions.map((s) => ({
      description: s.placePrediction?.text?.text || s.placePrediction?.structuredFormat?.mainText?.text || 'Unknown',
      placeId: s.placePrediction?.placeId || '',
    })).filter(s => s.placeId)
  } catch (error) {
    console.error('Autocomplete error:', error)
    throw error
  }
}

export async function resolvePlaceToCoordinates(placeId) {
  if (!placeId) {
    throw new Error('placeId is required')
  }

  try {
    // Use Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(placeId)}&key=${GOOGLE_MAPS_API_KEY}`
    
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Geocoding API error:', response.status, errorText)
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding failed: ${data.status}`)
    }

    const first = data.results[0]
    const loc = first.geometry.location

    return {
      placeId,
      formattedAddress: first.formatted_address,
      latitude: loc.lat,
      longitude: loc.lng,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    throw error
  }
}
