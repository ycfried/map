import { NextResponse } from 'next/server'
import { resolvePlaceToCoordinates } from '@/lib/google-places'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'user'

  // Build query based on role
  let query = supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  // If not admin, filter by user_id
  if (role !== 'admin') {
    query = query.eq('user_id', user.id)
  }

  const { data: submissions, error } = await query

  if (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }

  return NextResponse.json({ submissions })
}

export async function POST(req) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { placeId, description, formData } = body

    if (!placeId || !description) {
      return NextResponse.json(
        { error: 'placeId and description are required' },
        { status: 400 }
      )
    }

    const resolved = await resolvePlaceToCoordinates(placeId)

    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        user_email: user.email,
        description,
        formatted_address: resolved.formattedAddress,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        place_id: resolved.placeId,
        form_data: formData || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { submission, message: 'Submission created' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Submission error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const submissionId = searchParams.get('id')

  if (!submissionId) {
    return NextResponse.json(
      { error: 'Submission ID required' },
      { status: 400 }
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'user'

  // Check if submission exists and get ownership info
  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json(
      { error: 'Submission not found' },
      { status: 404 }
    )
  }

  // Check if user owns the submission or is admin
  if (submission.user_id !== user.id && role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  const { error: deleteError } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)

  if (deleteError) {
    console.error('Error deleting submission:', deleteError)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: 'Submission deleted' })
}
