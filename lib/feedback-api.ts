import type { 
  ApiResponse, 
  BackendFeedbackItem, 
  FeedbackItem, 
  FeedbackSubmission, 
  FeedbackStats
} from './types'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Helper function to transform backend feedback to frontend format
function transformFeedbackItem(backendItem: BackendFeedbackItem): FeedbackItem {
  return {
    id: backendItem.id.toString(),
    customerName: backendItem.customer_name,
    email: backendItem.email || 'Not provided',
    rating: backendItem.rating,
    feedback: backendItem.feedback || 'No additional feedback provided',
    timestamp: backendItem.timestamp,
    date: backendItem.date
  }
}

// Submit feedback
export async function submitFeedback(feedbackData: FeedbackSubmission): Promise<FeedbackItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<BackendFeedbackItem> = await response.json()
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to submit feedback')
    }

    return transformFeedbackItem(apiResponse.data)
  } catch (error) {
    console.error('Error submitting feedback:', error)
    throw error
  }
}

// Get all feedback (admin) - UPDATED: No pagination
export async function fetchAllFeedback(params?: {
  rating?: number
  search?: string
  sortBy?: string
  order?: string
}): Promise<FeedbackItem[]> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.rating) queryParams.append('rating', params.rating.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.order) queryParams.append('order', params.order)

    const url = `${API_BASE_URL}/feedback${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<BackendFeedbackItem[]> = await response.json()
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch feedback')
    }

    return apiResponse.data.map(transformFeedbackItem)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    throw error
  }
}

// Get feedback statistics - UPDATED: Current month only
export async function fetchFeedbackStats(): Promise<FeedbackStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<FeedbackStats> = await response.json()
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch feedback statistics')
    }

    return apiResponse.data
  } catch (error) {
    console.error('Error fetching feedback statistics:', error)
    throw error
  }
} 