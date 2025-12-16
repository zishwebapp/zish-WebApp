// API Response Types
export interface ApiResponse<T> {
  success: boolean
  count?: number
  message?: string
  data: T
  error?: string
}

// Backend Menu Item (from API)
export interface BackendMenuItem {
  id: number
  name: string
  price: number
  category_id: number
  description: string
  image_url: string
  is_available: boolean
  preparation_time_minutes: number
  created_at: string
  updated_at: string
}

// Frontend Menu Item (for UI)
export interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  description: string
  image: string
  isAvailable?: boolean
  preparationTime?: number
}

// Backend Feedback Item (from API)
export interface BackendFeedbackItem {
  id: number
  customer_name: string
  email: string | null
  rating: number
  feedback: string | null
  timestamp: string
  date: string
  created_at: string
  updated_at: string
}

// Frontend Feedback Item (for UI)
export interface FeedbackItem {
  id: string
  customerName: string
  email: string
  rating: number
  feedback: string
  timestamp: string
  date: string
}

// Feedback submission data
export interface FeedbackSubmission {
  customerName?: string
  email?: string
  rating: number
  feedback?: string
}

// Feedback stats from API - UPDATED for current month
export interface FeedbackStats {
  totalFeedback: number
  averageRating: number
  ratingDistribution: Record<string, number>
  recentFeedback: number
  trends: {
    currentWeek: {
      total: number
      averageRating: string
    }
    previousWeek: {
      total: number
      averageRating: string
    }
  }
  monthInfo: {
    month: string
    startDate: string
    endDate: string
  }
}

// ORDER TYPES - NEW
// Backend Order Item (from API) - Updated for Google Sheets Backend
export interface BackendOrderItem {
  id?: string // Optional for Google Sheets
  itemName?: string // Alternative field name
  item_name?: string // Support both naming conventions
  itemPrice?: number // Alternative field name
  item_price?: number // Support both naming conventions
  quantity: number
  price?: number // Alternative field name
  specialInstructions?: string // Alternative field name
  special_instructions?: string | null // Support both naming conventions
  subtotal: number
}

// Backend Order (from API) - Updated for Google Sheets Backend
export interface BackendOrder {
  id: string // Changed to string for Google Sheets order IDs (ORD-xxxxx)
  customer_name: string
  customer_phone: string
  customer_email: string | null
  total_amount: number
  order_status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' // Updated statuses
  payment_status: 'unpaid' | 'paid' // Simplified payment statuses
  payment_method: 'cash' | 'card' | 'upi' | 'online' | null
  special_instructions: string | null
  delivery_address: string | null
  order_date?: string
  estimated_delivery_time: string | null
  actual_delivery_time: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  cancelled_by: string | null
  items: BackendOrderItem[]
  created_at: string
  updated_at?: string
  itemCount?: number // Optional field from API
}

// Frontend Order (for UI) - Updated for Google Sheets Backend
export interface Order {
  id: string // Changed to string for Google Sheets order IDs
  customerName: string
  customerPhone: string
  customerEmail?: string
  totalAmount: number
  orderStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' // Updated statuses
  paymentStatus: 'unpaid' | 'paid' // Simplified payment statuses
  paymentMethod?: 'cash' | 'card' | 'upi' | 'online'
  specialInstructions?: string
  deliveryAddress?: string
  orderDate?: string
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  cancelledAt?: string
  cancelledReason?: string
  cancelledBy?: string
  items: OrderItem[]
  createdAt: string
  updatedAt?: string
}

// Frontend Order Item - Updated for Google Sheets Backend
export interface OrderItem {
  id?: string // Optional for Google Sheets
  itemName: string
  itemPrice: number
  quantity: number
  specialInstructions?: string
  subtotal: number
}

// Order submission data
export interface OrderSubmission {
  customerName: string
  customerPhone: string
  customerEmail?: string
  items: {
    menuItemId: number
    quantity: number
    specialInstructions?: string
  }[]
  paymentMethod?: 'cash' | 'card' | 'upi' | 'online'
  specialInstructions?: string
  deliveryAddress?: string
}

// Order status update - Updated for Google Sheets Backend
export interface OrderStatusUpdate {
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' // Updated statuses
  changedBy?: string
  notes?: string
}

// Payment status update - Updated for Google Sheets Backend
export interface PaymentStatusUpdate {
  paymentStatus: 'unpaid' | 'paid' // Simplified payment statuses
  paymentMethod?: 'cash' | 'card' | 'upi' | 'online'
  notes?: string
}

// Order cancellation
export interface OrderCancellation {
  reason: string
  cancelledBy?: string
}

// Orders list response
export interface OrdersListResponse extends ApiResponse<BackendOrder[]> {
  totalCount: number
  totalPages: number
  currentPage: number
}

// Order statistics from API
export interface OrderStats {
  orders_today: number;
  daily_revenue: number;
  monthly_revenue: number;
  pending_orders: number;
  unpaid_orders: number;
  unpaid_amount: number;
  fast_moving_items: number;
  completed_orders: number;
}

// Revenue-only stats (for /stats/revenue)
export interface RevenueStats {
  daily_revenue: number;
  monthly_revenue: number;
}

// Dashboard stats (for /stats/dashboard)
export interface DashboardStats {
  pending_orders: number;
  unpaid_orders: number;
  unpaid_amount: number;
  completed_orders: number;
  fast_moving_items: { item_name: string; total_quantity: number }[];
}

// Orders insights (completed orders, totals, and top items)
export interface OrdersTopItem {
  item_name: string;
  total_quantity: number;
}

export interface OrdersInsights {
  start: string;
  end: string;
  completed_orders_count: number;
  completed_orders_amount: number;
  total_items_sold: number;
  top_items: OrdersTopItem[];
}

// Category mapping
export const CATEGORY_MAP: Record<number, string> = {
  1: "Bewerages",
  2: "Quick Bites", 
  3: "Ice Cream & Scoops",
  4: "Fresh Juice",
  5: "Moctails",
  6: "Milk Shakes",
  7: "Milk Shake With Ice Creams"
}

// Order status display mapping - Updated for Google Sheets Backend
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled"
}

// Payment status display mapping - Updated for Google Sheets Backend
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid"
} 