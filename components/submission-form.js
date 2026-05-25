'use client'

import { useState } from 'react'
import { AddressAutocomplete } from './address-autocomplete'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Loader2, Tag } from 'lucide-react'

const MARKER_COLORS = [
  { value: 'green', label: 'Green', color: '#10b981' },
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'red', label: 'Red', color: '#ef4444' },
  { value: 'yellow', label: 'Yellow', color: '#eab308' },
  { value: 'purple', label: 'Purple', color: '#a855f7' },
  { value: 'orange', label: 'Orange', color: '#f97316' },
  { value: 'pink', label: 'Pink', color: '#ec4899' },
  { value: 'gray', label: 'Gray', color: '#6b7280' },
]

export function SubmissionForm({ onSuccess, groups = [] }) {
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [addressValue, setAddressValue] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [markerColor, setMarkerColor] = useState('green')
  const [group, setGroup] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleAddressSelect = (address) => {
    setSelectedAddress(address)
    setError('')
  }

  const resetForm = () => {
    setTitle('')
    setNotes('')
    setAddressValue('')
    setSelectedAddress(null)
    setMarkerColor('green')
    setGroup('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!selectedAddress) {
      setError('Please select an address from the suggestions')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: selectedAddress.placeId,
          description: selectedAddress.description,
          formData: {
            title,
            notes,
            markerColor,
            group: group || null,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      setSuccess(true)
      resetForm()

      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Entry created successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Home, Office, Customer Site"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <AddressAutocomplete
              onAddressSelect={handleAddressSelect}
              disabled={isSubmitting}
              value={addressValue}
              onChange={setAddressValue}
            />
            {selectedAddress && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Selected: {selectedAddress.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="markerColor">Marker Color</Label>
              <Select value={markerColor} onValueChange={setMarkerColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKER_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color.color }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">
                <Tag className="h-3 w-3 inline mr-1" />
                Group (optional)
              </Label>
              <Select value={group || undefined} onValueChange={(val) => setGroup(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                  {groups.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No groups yet
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Entry'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
