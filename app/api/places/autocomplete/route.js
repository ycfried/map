import { NextResponse } from 'next/server'
import { autocompletePlaces } from '@/lib/google-places'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }

  try {
    const suggestions = await autocompletePlaces(query)
    return NextResponse.json({ suggestions }, { status: 200 })
  } catch (error) {
    console.error('Autocomplete error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch place suggestions' },
      { status: 500 }
    )
  }
}
