import { NextResponse } from 'next/server'
import { resolvePlaceToCoordinates } from '@/lib/google-places'
import clientPromise from '@/lib/mongodb'
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

  const client = await clientPromise
  const db = client.db(process.env.DB_NAME || 'location_data_app')
  const submissions = db.collection('submissions')

  const filter = role === 'admin' ? {} : { userId: user.id }

  const docs = await submissions.find(filter).sort({ createdAt: -1 }).toArray()

  return NextResponse.json({ submissions: docs })
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

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'location_data_app')
    const submissions = db.collection('submissions')

    const now = new Date()

    const result = await submissions.insertOne({
      userId: user.id,
      userEmail: user.email,
      description,
      formattedAddress: resolved.formattedAddress,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      location: {
        type: 'Point',
        coordinates: [resolved.longitude, resolved.latitude],
      },
      placeId: resolved.placeId,
      formData: formData || {},
      createdAt: now,
    })

    const insertedDoc = await submissions.findOne({ _id: result.insertedId })

    return NextResponse.json(
      { submission: insertedDoc, message: 'Submission created' },
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

  const client = await clientPromise
  const db = client.db(process.env.DB_NAME || 'location_data_app')
  const submissions = db.collection('submissions')

  // Find the submission first
  const submission = await submissions.findOne({ _id: submissionId })

  if (!submission) {
    return NextResponse.json(
      { error: 'Submission not found' },
      { status: 404 }
    )
  }

  // Check if user owns the submission or is admin
  if (submission.userId !== user.id && role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  await submissions.deleteOne({ _id: submissionId })

  return NextResponse.json({ message: 'Submission deleted' })
}
