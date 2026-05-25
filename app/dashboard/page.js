'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { SubmissionForm } from '@/components/submission-form'
import { MapComponent } from '@/components/map-component'
import { SubmissionsList } from '@/components/submissions-list'
import { RouteBuilder } from '@/components/route-builder'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogOut, Map, List, Navigation } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('form')
  const [routeOrder, setRouteOrder] = useState([])
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Get profile to check role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Load submissions
      await loadSubmissions()
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions')
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions)
      }
    } catch (err) {
      console.error('Error loading submissions:', err)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  const handleSubmissionSuccess = () => {
    loadSubmissions()
    setActiveTab('list')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Location Data Manager</h1>
            <p className="text-sm text-muted-foreground">
              {user?.email}
              {isAdmin && (
                <Badge className="ml-2" variant="secondary">
                  Admin
                </Badge>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                  <CardDescription>
                    {isAdmin ? 'All entries in system' : 'Your entries'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{submissions.length}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total {submissions.length === 1 ? 'entry' : 'entries'}
                  </p>
                </CardContent>
              </Card>

              {/* Form */}
              <SubmissionForm onSuccess={handleSubmissionSuccess} />
            </div>
          </div>

          {/* Right Column - Map & List */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map">
                  <Map className="h-4 w-4 mr-2" />
                  Map View
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="route">
                  <Navigation className="h-4 w-4 mr-2" />
                  Route Planner
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <MapComponent 
                      submissions={submissions}
                      routeOrder={null}
                      showRoute={false}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list" className="mt-4">
                <SubmissionsList
                  submissions={submissions}
                  onDelete={loadSubmissions}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="route" className="mt-4">
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <RouteBuilder
                        submissions={submissions}
                        onRouteChange={setRouteOrder}
                      />
                    </CardContent>
                  </Card>
                  
                  {routeOrder.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Route Preview</CardTitle>
                        <CardDescription>
                          {routeOrder.length} stops in this route
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <MapComponent 
                          submissions={submissions}
                          routeOrder={routeOrder}
                          showRoute={true}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
