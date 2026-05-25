'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Trash2 } from 'lucide-react'

export function SubmissionsList({ submissions, onDelete, isAdmin }) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No entries yet. Create your first one!</p>
      </div>
    )
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return
    try {
      const res = await fetch(`/api/submissions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete()
      }
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">
                    {submission.form_data?.title || 'Untitled Entry'}
                  </h3>
                  {isAdmin && submission.user_email && (
                    <Badge variant="outline" className="text-xs">
                      {submission.user_email}
                    </Badge>
                  )}
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{submission.formatted_address}</span>
                </div>
                {submission.form_data?.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {submission.form_data.notes}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(submission.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    {submission.latitude.toFixed(6)}, {submission.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(submission.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
