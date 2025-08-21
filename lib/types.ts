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
// Backend Order Item (from API)
export interface BackendOrderItem {
  id: number
  item_name: string
  item_price: number
  quantity: number
  special_instructions: string | null
  subtotal: number
}

// Backend Order (from API)
export interface BackendOrder {
  id: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
  total_amount: number
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method: 'cash' | 'card' | 'upi' | 'online' | null
  special_instructions: string | null
  delivery_address: string | null
  order_date: string
  estimated_delivery_time: string | null
  actual_delivery_time: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  cancelled_by: string | null
  items: BackendOrderItem[]
  created_at: string
  updated_at: string
}

// Frontend Order (for UI)
export interface Order {
  id: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  totalAmount: number
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: 'cash' | 'card' | 'upi' | 'online'
  specialInstructions?: string
  deliveryAddress?: string
  orderDate: string
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  cancelledAt?: string
  cancelledReason?: string
  cancelledBy?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

// Frontend Order Item
export interface OrderItem {
  id: number
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

// Order status update
export interface OrderStatusUpdate {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  changedBy?: string
  notes?: string
}

// Payment status update
export interface PaymentStatusUpdate {
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
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

// Order status display mapping
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  delivered: "Delivered",
  cancelled: "Cancelled"
}

// Payment status display mapping
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Payment Pending",
  paid: "Paid",
  failed: "Payment Failed",
  refunded: "Refunded"
} 