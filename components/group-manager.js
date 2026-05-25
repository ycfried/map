'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Tag } from 'lucide-react'
import { Label } from '@/components/ui/label'

export function GroupManager({ groups, onAddGroup }) {
  const [newGroup, setNewGroup] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddGroup = () => {
    if (!newGroup.trim()) return
    if (groups.includes(newGroup.trim())) {
      alert('This group already exists')
      return
    }
    onAddGroup(newGroup.trim())
    setNewGroup('')
    setIsAdding(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Manage Groups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {groups.map(group => (
              <Badge key={group} variant="secondary">
                {group}
              </Badge>
            ))}
          </div>
        )}

        {!isAdding ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-2" />
            Add New Group
          </Button>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="newGroup" className="text-xs">New Group Name</Label>
            <div className="flex gap-2">
              <Input
                id="newGroup"
                placeholder="e.g., Customers, Offices"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddGroup()
                  if (e.key === 'Escape') {
                    setIsAdding(false)
                    setNewGroup('')
                  }
                }}
                autoFocus
                className="h-8"
              />
              <Button size="sm" onClick={handleAddGroup} className="h-8">
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewGroup('')
                }}
                className="h-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
