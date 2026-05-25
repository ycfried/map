'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GripVertical, Navigation, ArrowUp, ArrowDown, X, Shuffle, SortAsc, MapPinned, Tag } from 'lucide-react'
import { Label } from '@/components/ui/label'

const OPTIMIZATION_METHODS = [
  { value: 'geographic', label: 'Geographic (Nearest Neighbor)', icon: MapPinned },
  { value: 'alphabetical', label: 'Alphabetical by Title', icon: SortAsc },
  { value: 'date', label: 'By Date Added', icon: SortAsc },
  { value: 'group', label: 'By Group', icon: Tag },
  { value: 'reverse', label: 'Reverse Current Order', icon: Shuffle },
]

export function RouteBuilder({ submissions, onRouteChange }) {
  const [routeOrder, setRouteOrder] = useState(submissions.map(s => s._id))
  const [optimizationMethod, setOptimizationMethod] = useState('geographic')

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
    let orderedSubmissions = [...submissions]

    switch (optimizationMethod) {
      case 'geographic':
        // Nearest neighbor algorithm
        if (orderedSubmissions.length === 0) return
        
        const optimized = [orderedSubmissions[0]]
        const remaining = orderedSubmissions.slice(1)
        
        while (remaining.length > 0) {
          const current = optimized[optimized.length - 1]
          let nearestIndex = 0
          let minDistance = Infinity
          
          remaining.forEach((sub, idx) => {
            const distance = Math.sqrt(
              Math.pow(sub.latitude - current.latitude, 2) +
              Math.pow(sub.longitude - current.longitude, 2)
            )
            if (distance < minDistance) {
              minDistance = distance
              nearestIndex = idx
            }
          })
          
          optimized.push(remaining[nearestIndex])
          remaining.splice(nearestIndex, 1)
        }
        
        orderedSubmissions = optimized
        break

      case 'alphabetical':
        orderedSubmissions.sort((a, b) => {
          const titleA = (a.formData?.title || '').toLowerCase()
          const titleB = (b.formData?.title || '').toLowerCase()
          return titleA.localeCompare(titleB)
        })
        break

      case 'date':
        orderedSubmissions.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        )
        break

      case 'group':
        orderedSubmissions.sort((a, b) => {
          const groupA = a.formData?.group || ''
          const groupB = b.formData?.group || ''
          if (groupA === groupB) {
            return (a.formData?.title || '').localeCompare(b.formData?.title || '')
          }
          return groupA.localeCompare(groupB)
        })
        break

      case 'reverse':
        const current = routeOrder.map(id => submissions.find(s => s._id === id)).filter(Boolean)
        orderedSubmissions = current.reverse()
        break

      default:
        break
    }

    const newOrder = orderedSubmissions.map(s => s._id)
    setRouteOrder(newOrder)
    onRouteChange(newOrder)
  }

  const getSubmission = (id) => submissions.find(s => s._id === id)
  const inRoute = (id) => routeOrder.includes(id)

  // Get unique groups
  const groups = [...new Set(submissions.map(s => s.formData?.group).filter(Boolean))]

  // Calculate total distance (approximate)
  const calculateDistance = () => {
    if (routeOrder.length < 2) return 0
    let totalDistance = 0
    for (let i = 0; i < routeOrder.length - 1; i++) {
      const current = getSubmission(routeOrder[i])
      const next = getSubmission(routeOrder[i + 1])
      if (current && next) {
        // Haversine formula for approximate distance in km
        const R = 6371
        const dLat = (next.latitude - current.latitude) * Math.PI / 180
        const dLon = (next.longitude - current.longitude) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(current.latitude * Math.PI / 180) * Math.cos(next.latitude * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        totalDistance += R * c
      }
    }
    return totalDistance
  }

  const distance = calculateDistance()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Route Builder</h3>
            <p className="text-sm text-muted-foreground">
              {routeOrder.length} stops • {distance > 0 ? `~${distance.toFixed(1)} km` : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs mb-1 block">Optimization Method</Label>
            <Select value={optimizationMethod} onValueChange={setOptimizationMethod}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPTIMIZATION_METHODS.map((method) => {
                  const Icon = method.icon
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3" />
                        {method.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={optimizeRoute}
              size="sm"
              className="gap-2 h-9"
            >
              <Navigation className="h-4 w-4" />
              Optimize
            </Button>
          </div>
        </div>
      </div>

      {groups.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Groups:</span>
              {groups.map(group => (
                <Badge key={group} variant="outline" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {group}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {routeOrder.map((id, index) => {
          const submission = getSubmission(id)
          if (!submission) return null

          const markerColor = submission.formData?.markerColor || 'green'
          const colorMap = {
            green: 'bg-green-500',
            blue: 'bg-blue-500',
            red: 'bg-red-500',
            yellow: 'bg-yellow-500',
            purple: 'bg-purple-500',
            orange: 'bg-orange-500',
            pink: 'bg-pink-500',
            gray: 'bg-gray-500',
          }

          return (
            <Card key={id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`h-7 w-7 rounded-full p-0 flex items-center justify-center ${colorMap[markerColor]}`}>
                      {index + 1}
                    </Badge>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {submission.formData?.title || 'Untitled'}
                      </p>
                      {submission.formData?.group && (
                        <Badge variant="secondary" className="text-xs">
                          {submission.formData.group}
                        </Badge>
                      )}
                    </div>
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
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Not in Route</h4>
          <div className="space-y-2">
            {submissions
              .filter(s => !inRoute(s._id))
              .map(submission => {
                const markerColor = submission.formData?.markerColor || 'green'
                const colorMap = {
                  green: 'bg-green-500',
                  blue: 'bg-blue-500',
                  red: 'bg-red-500',
                  yellow: 'bg-yellow-500',
                  purple: 'bg-purple-500',
                  orange: 'bg-orange-500',
                  pink: 'bg-pink-500',
                  gray: 'bg-gray-500',
                }

                return (
                  <Card key={submission._id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${colorMap[markerColor]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {submission.formData?.title || 'Untitled'}
                            </p>
                            {submission.formData?.group && (
                              <Badge variant="secondary" className="text-xs">
                                {submission.formData.group}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {submission.formattedAddress}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToRoute(submission._id)}
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
