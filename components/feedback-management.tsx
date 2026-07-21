"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MessageSquare,
  Star,
  Eye,
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Mail,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { fetchAllFeedback, fetchFeedbackStats } from "@/lib/feedback-api"
import type { FeedbackItem, FeedbackStats } from "@/lib/types"

interface FeedbackManagementProps {
  userType: "admin" | "superadmin" | null
}

export function FeedbackManagement({ userType }: FeedbackManagementProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<FeedbackItem[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load feedback and stats from API
  const loadFeedbackData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [feedbackResponse, statsResponse] = await Promise.all([
        fetchAllFeedback({
          rating: ratingFilter !== "all" ? parseInt(ratingFilter) : undefined,
          search: searchTerm.trim() || undefined,
          sortBy: 'timestamp',
          order: 'desc'
        }),
        fetchFeedbackStats()
      ])

      setFeedbacks(feedbackResponse)
      setFilteredFeedbacks(feedbackResponse)
      setStats(statsResponse)
    } catch (err) {
      console.error('Failed to load feedback data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load feedback data')
      toast({
        title: "Loading Failed",
        description: "Failed to load feedback data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (userType === "superadmin") {
      loadFeedbackData()
    }
  }, [userType])

  // Reload when filters change
  useEffect(() => {
    if (userType === "superadmin") {
      const timeoutId = setTimeout(() => {
        loadFeedbackData()
      }, 500) // Debounce search

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, ratingFilter])

  // Refresh data
  const refreshData = () => {
    loadFeedbackData()
  }

  // Export feedback to CSV
  const exportFeedbackToCSV = () => {
    if (feedbacks.length === 0) {
      toast({
        title: "No Data",
        description: "No feedback data to export.",
        variant: "destructive",
      })
      return
    }

    const headers = ["ID", "Customer Name", "Email", "Rating", "Feedback", "Date", "Timestamp"]
    const csvContent = [
      headers.join(","),
      ...feedbacks.map(feedback => [
        feedback.id,
        `"${feedback.customerName}"`,
        `"${feedback.email}"`,
        feedback.rating,
        `"${feedback.feedback.replace(/"/g, '""')}"`, // Escape quotes
        feedback.date,
        feedback.timestamp
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `feedback_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Customer feedback has been downloaded as CSV.",
    })
  }

  // View feedback details
  const viewFeedbackDetails = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback)
    setShowDetailModal(true)
  }

  // Get star display
  const getStarDisplay = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
      />
    ))
  }

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-100 text-green-800 border-green-200"
    if (rating >= 3) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  // Only allow Super Admin access
  if (userType !== "superadmin") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Customer Feedback is only available for Super Admin users.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading feedback data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              id="retryLoadFeedbackBtn"
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Feedback</h2>
          <p className="text-gray-600">
            {stats?.monthInfo?.month ? `Viewing data for ${stats.monthInfo.month}` : 'Manage and analyze customer feedback'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button id="refreshFeedbackBtn" onClick={refreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button id="exportFeedbackCsvBtn" onClick={exportFeedbackToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">This Month Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedback || 0}</div>
              <p className="text-xs text-gray-500">Feedback received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.averageRating || 0}</div>
                <div className="flex">
                  {getStarDisplay(Math.round(stats.averageRating || 0))}
                </div>
              </div>
              <p className="text-xs text-gray-500">Out of 5 stars</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentFeedback || 0}</div>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.trends?.currentWeek?.total || 0}
              </div>
              <p className="text-xs text-gray-500">
                Avg: {stats.trends?.currentWeek?.averageRating || "0.0"} stars
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filter by Rating</Label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback List ({feedbacks.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No feedback found matching your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {feedback.customerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {feedback.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRatingColor(feedback.rating)} border`}>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {feedback.rating}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate">{feedback.feedback}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{feedback.date}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        id={`viewFeedback-${feedback.id}-Btn`}
                        variant="outline"
                        size="sm"
                        onClick={() => viewFeedbackDetails(feedback)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Feedback Details</h3>
                <Button
                  id="closeFeedbackDetailModalBtn"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Customer Name</Label>
                  <p>{selectedFeedback.customerName}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{selectedFeedback.email}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Rating</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {getStarDisplay(selectedFeedback.rating)}
                    </div>
                    <span>({selectedFeedback.rating}/5)</span>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Feedback</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedFeedback.feedback}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Date & Time</Label>
                  <p>{new Date(selectedFeedback.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 