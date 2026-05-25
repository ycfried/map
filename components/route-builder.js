'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Navigation, ArrowUp, ArrowDown, X } from 'lucide-react'

export function RouteBuilder({ submissions, onRouteChange }) {
  const [routeOrder, setRouteOrder] = useState(submissions.map(s => s._id))

  const moveUp = (index) => {
    if (index === 0) return
    const newOrder = [...routeOrder]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setRouteOrder(newOrder)
    onRouteChange(newOrder)
  }

  const moveDown = (index) => {
    if (index === routeOrder.length - 1) return
    const newOrder = [...routeOrder]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setRouteOrder(newOrder)
    onRouteChange(newOrder)
  }

  const removeFromRoute = (submissionId) => {
    const newOrder = routeOrder.filter(id => id !== submissionId)
    setRouteOrder(newOrder)
    onRouteChange(newOrder)
  }

  const addToRoute = (submissionId) => {
    const newOrder = [...routeOrder, submissionId]
    setRouteOrder(newOrder)
    onRouteChange(newOrder)
  }

  const optimizeRoute = () => {
    // Simple optimization: sort by latitude then longitude
    const orderedSubmissions = [...submissions].sort((a, b) => {
      if (Math.abs(a.latitude - b.latitude) > 0.1) {
        return a.latitude - b.latitude
      }
      return a.longitude - b.longitude
    })
    const newOrder = orderedSubmissions.map(s => s._id)
    setRouteOrder(newOrder)
    onRouteChange(newOrder)
  }

  const getSubmission = (id) => submissions.find(s => s._id === id)

  const inRoute = (id) => routeOrder.includes(id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Route Builder</h3>
          <p className="text-sm text-muted-foreground">
            Arrange locations in order to create your route
          </p>
        </div>
        <Button
          onClick={optimizeRoute}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Navigation className="h-4 w-4" />
          Auto-Optimize
        </Button>
      </div>

      <div className="space-y-2">
        {routeOrder.map((id, index) => {
          const submission = getSubmission(id)
          if (!submission) return null

          return (
            <Card key={id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {submission.formData?.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {submission.formattedAddress}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveDown(index)}
                      disabled={index === routeOrder.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromRoute(id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {submissions.filter(s => !inRoute(s._id)).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Not in Route</h4>
          <div className="space-y-2">
            {submissions
              .filter(s => !inRoute(s._id))
              .map(submission => (
                <Card key={submission._id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {submission.formData?.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {submission.formattedAddress}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToRoute(submission._id)}
                      >
                        Add to Route
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
