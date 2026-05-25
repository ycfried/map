'use server'

import { Client } from '@googlemaps/google-maps-services-js'

const client = new Client({})

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error('GOOGLE_MAPS_API_KEY is not set in environment variables')
}

export async function autocompletePlaces(input) {
  if (!input || input.trim().length === 0) {
    return []
  }

  const response = await client.placeAutocomplete({
    params: {
      input,
      key: GOOGLE_MAPS_API_KEY,
    },
    timeout: 1500,
  })

  const predictions = response.data.predictions || []

  return predictions.map((p) => ({
    description: p.description,
    placeId: p.place_id,
  }))
}

export async function resolvePlaceToCoordinates(placeId) {
  if (!placeId) {
    throw new Error('placeId is required')
  }

  const response = await client.geocode({
    params: {
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
    },
    timeout: 1500,
  })

  const results = response.data.results
  if (!results || results.length === 0) {
    throw new Error('No geocoding results for provided placeId')
  }

  const first = results[0]
  const loc = first.geometry.location

  return {
    placeId,
    formattedAddress: first.formatted_address,
    latitude: loc.lat,
    longitude: loc.lng,
  }
}
