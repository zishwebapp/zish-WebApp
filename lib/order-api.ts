import type {
  ApiResponse,
  BackendOrder,
  Order,
  OrderStats,
  OrderSubmission,
  OrderStatusUpdate,
  OrderItemStatusUpdate,
  AddOrderItemPayload,
  UpdateOrderItemQuantityPayload,
  PaymentStatusUpdate,
  OrderCancellation,
  OrdersListResponse,
  RevenueStats,
  DashboardStats,
  OrdersInsights,
} from './types'

// API Configuration - Updated for Google Sheets Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Error thrown by order-editing calls. Carries the backend's `code` field so
// callers can react to specific cases (e.g. 'LAST_ITEM') instead of just
// showing a generic failure message.
export class OrderApiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'OrderApiError'
    this.code = code
  }
}

// Helper function to transform backend order to frontend format
// Updated to handle Google Sheets API response format
function transformOrder(backendOrder: BackendOrder): Order {
  return {
    id: String(backendOrder.id), // Ensure string type
    customerName: backendOrder.customer_name,
    customerPhone: backendOrder.customer_phone || '',
    customerEmail: backendOrder.customer_email || undefined,
    totalAmount: Number(backendOrder.total_amount) || 0,
    orderStatus: backendOrder.order_status,
    paymentStatus: backendOrder.payment_status,
    paymentMethod: backendOrder.payment_method || undefined,
    specialInstructions: backendOrder.special_instructions || undefined,
    deliveryAddress: backendOrder.delivery_address || undefined,
    orderDate: backendOrder.order_date || backendOrder.created_at,
    estimatedDeliveryTime: backendOrder.estimated_delivery_time || undefined,
    actualDeliveryTime: backendOrder.actual_delivery_time || undefined,
    cancelledAt: backendOrder.cancelled_at || undefined,
    cancelledReason: backendOrder.cancelled_reason || undefined,
    cancelledBy: backendOrder.cancelled_by || undefined,
    items: (backendOrder.items || []).map(item => ({
      id: item.id,
      itemName: item.itemName || item.item_name || '',
      itemPrice: Number(item.itemPrice || item.item_price || item.price) || 0,
      quantity: Number(item.quantity) || 0,
      specialInstructions: item.specialInstructions || item.special_instructions || undefined,
      subtotal: Number(item.subtotal) || 0,
      itemStatus: item.itemStatus || item.item_status || 'pending'
    })),
    createdAt: backendOrder.created_at,
    updatedAt: backendOrder.updated_at || backendOrder.created_at
  }
}

export async function checkItemsAvailability(itemIds: number[]): Promise<boolean> {
  try {
    // Try GET first
    console.log('Trying GET test...');
    const getResponse = await fetch(`${API_BASE_URL}/menu/test`, {
      method: 'GET',
    });
    console.log('GET response:', getResponse.status);
    
    // Then try POST
    console.log('Trying POST test...');
    const postResponse = await fetch(`${API_BASE_URL}/menu/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemIds }),
    });
    console.log('POST response:', postResponse.status);

    if (!postResponse.ok) {
      const errorData = await postResponse.json();
      console.error('Error response:', errorData);
      throw new Error(errorData.message || 'Failed to check item availability');
    }

    const availabilityResponse = await postResponse.json();
    console.log('Success response:', availabilityResponse);
    return true; // For testing
  } catch (error) {
    console.error('Error checking item availability:', error);
    throw error;
  }
}

export async function placeOrder(orderData: OrderSubmission): Promise<Order> {
  try {
    console.log('Placing order with data:', orderData);
    
    // Proceed with order placement
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    console.log('Order API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Order API error:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<any> = await response.json()
    console.log('Order API success response:', apiResponse);

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to place order')
    }

    // Google Sheets API returns order data in 'data' field
    // Transform it to match frontend Order structure
    const orderData_response = apiResponse.data;
    const transformedOrder: Order = {
      id: String(orderData_response.id),
      customerName: orderData_response.customerName,
      customerPhone: orderData_response.customerPhone || '',
      totalAmount: Number(orderData_response.totalAmount) || 0,
      orderStatus: orderData_response.status || 'pending',
      paymentStatus: 'unpaid',
      items: (orderData_response.items || []).map((item: any) => ({
        id: item.id,
        itemName: item.itemName || '',
        itemPrice: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        subtotal: Number(item.subtotal) || 0,
        itemStatus: item.itemStatus || 'pending'
      })),
      createdAt: orderData_response.createdAt || new Date().toISOString(),
      updatedAt: orderData_response.createdAt || new Date().toISOString()
    };
    
    console.log('Transformed order:', transformedOrder);
    
    return transformedOrder;
  } catch (error) {
    console.error('Error placing order:', error)
    throw error
  }
}

// Get all orders (admin)
export async function fetchAllOrders(params?: {
  page?: number
  limit?: number
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  phone?: string
  customerName?: string
  sortBy?: string
  order?: string
  includeCancelled?: boolean
  orderId?: string | number
  orderNumber?: string | number
  item?: string
}): Promise<{
  orders: Order[]
  totalCount: number
  totalPages: number
  currentPage: number
}> {
  try {
    // Google Sheets backend doesn't support pagination yet, 
    // so we'll fetch all and handle pagination on frontend
    const url = `${API_BASE_URL}/orders`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache', // Disable caching to always get fresh data from Google Sheets
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<BackendOrder[]> = await response.json()

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch orders')
    }

    let orders = apiResponse.data.map(transformOrder)

    // Apply client-side filtering
    if (params?.status) {
      orders = orders.filter(o => o.orderStatus === params.status)
    }
    if (params?.paymentStatus) {
      orders = orders.filter(o => o.paymentStatus === params.paymentStatus)
    }
    if (params?.phone) {
      orders = orders.filter(o => o.customerPhone?.includes(params.phone || ''))
    }
    if (params?.customerName) {
      orders = orders.filter(o => 
        o.customerName?.toLowerCase().includes(params.customerName?.toLowerCase() || '')
      )
    }

    // Surface orders with at least one undelivered item first (page 1 onward),
    // pushing fully-delivered orders to later pages. Orders with no items are
    // treated as "not delivered" since [].some(...) would otherwise be false.
    const isFullyDelivered = (o: Order) =>
      o.items.length > 0 && o.items.every(item => item.itemStatus === 'delivered')

    const byDateDesc = (a: Order, b: Order) =>
      new Date(b.orderDate ?? b.createdAt).getTime() - new Date(a.orderDate ?? a.createdAt).getTime()

    const notFullyDelivered = orders.filter(o => !isFullyDelivered(o)).sort(byDateDesc)
    const fullyDelivered = orders.filter(isFullyDelivered).sort(byDateDesc)
    const combined = [...notFullyDelivered, ...fullyDelivered]

    // Client-side pagination
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedOrders = combined.slice(start, end)

    return {
      orders: paginatedOrders,
      totalCount: combined.length,
      totalPages: Math.ceil(combined.length / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

// Get orders by phone (customer)
export async function fetchOrdersByPhone(phone: string, includeCancelled: boolean = false): Promise<Order[]> {
  try {
    const url = `${API_BASE_URL}/orders/customer/${phone}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<BackendOrder[]> = await response.json()

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch orders')
    }

    return apiResponse.data.map(transformOrder)
  } catch (error) {
    console.error('Error fetching orders by phone:', error)
    throw error
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, statusUpdate: OrderStatusUpdate): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: statusUpdate.status,
        changedBy: statusUpdate.changedBy || 'admin',
        notes: statusUpdate.notes
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<any> = await response.json()

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to update order status')
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

// Update a single item's delivery status (e.g. mark "Paneer Momo" as delivered
// while "Spicy Fries" is still pending, for kitchens that deliver items one at a time)
export async function updateOrderItemStatus(
  orderId: string,
  itemId: string,
  itemUpdate: OrderItemStatusUpdate
): Promise<{ orderStatusBumpedToReady: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemStatus: itemUpdate.itemStatus
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<any> = await response.json()

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to update item status')
    }

    return { orderStatusBumpedToReady: !!apiResponse.data?.orderStatusBumpedToReady }
  } catch (error) {
    console.error('Error updating order item status:', error)
    throw error
  }
}

// Add a new item to an existing order (e.g. customer calls back and asks for one more thing)
export async function addOrderItem(orderId: string, payload: AddOrderItemPayload): Promise<{ newTotalAmount: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const apiResponse: ApiResponse<any> = await response.json()

    if (!response.ok || !apiResponse.success) {
      throw new OrderApiError(apiResponse.message || `HTTP error! status: ${response.status}`, apiResponse.code)
    }

    return { newTotalAmount: apiResponse.data.newTotalAmount }
  } catch (error) {
    console.error('Error adding order item:', error)
    throw error
  }
}

// Change an existing order item's quantity
export async function updateOrderItemQuantity(
  orderId: string,
  itemId: string,
  payload: UpdateOrderItemQuantityPayload
): Promise<{ newTotalAmount: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/quantity`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const apiResponse: ApiResponse<any> = await response.json()

    if (!response.ok || !apiResponse.success) {
      throw new OrderApiError(apiResponse.message || `HTTP error! status: ${response.status}`, apiResponse.code)
    }

    return { newTotalAmount: apiResponse.data.newTotalAmount }
  } catch (error) {
    console.error('Error updating order item quantity:', error)
    throw error
  }
}

// Remove an item from an order. Throws an OrderApiError with code 'LAST_ITEM'
// if this is the only item left on the order — callers should catch that and
// prompt the admin to cancel the order instead.
export async function removeOrderItem(orderId: string, itemId: string): Promise<{ newTotalAmount: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const apiResponse: ApiResponse<any> = await response.json()

    if (!response.ok || !apiResponse.success) {
      throw new OrderApiError(apiResponse.message || `HTTP error! status: ${response.status}`, apiResponse.code)
    }

    return { newTotalAmount: apiResponse.data.newTotalAmount }
  } catch (error) {
    // LAST_ITEM is an expected, handled outcome (caller shows a confirm dialog),
    // not a real failure, so don't log it as an error (Next.js dev mode turns
    // any console.error into a full-screen crash overlay).
    if (!(error instanceof OrderApiError && error.code === 'LAST_ITEM')) {
      console.error('Error removing order item:', error)
    }
    throw error
  }
}

// Update payment status
export async function updatePaymentStatus(orderId: string, paymentUpdate: PaymentStatusUpdate): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentStatus: paymentUpdate.paymentStatus,
        paymentMethod: paymentUpdate.paymentMethod,
        notes: paymentUpdate.notes
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const apiResponse: ApiResponse<any> = await response.json()

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to update payment status')
    }
  } catch (error) {
    console.error('Error updating payment status:', error)
    throw error
  }
}

// Cancel order by updating status to 'cancelled'
export async function cancelOrder(orderId: string, cancellation: OrderCancellation): Promise<void> {
  try {
    await updateOrderStatus(orderId, {
      status: 'cancelled',
      changedBy: cancellation.cancelledBy || 'admin',
      notes: cancellation.reason
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}

// Delete order completely (removes from all sheets)
export async function deleteOrder(orderId: string): Promise<void> {
  try {
    console.log('Deleting order:', orderId);
    
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete order');
    }

    const apiResponse = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to delete order');
    }

    console.log('Order deleted successfully:', apiResponse.data);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// Check data integrity
export async function checkDataIntegrity(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/integrity-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to check data integrity');
    }

    return apiResponse.data;
  } catch (error) {
    console.error('Error checking data integrity:', error);
    throw error;
  }
} 

// Add this function to fetch order stats
export async function fetchOrderStats(): Promise<OrderStats> {
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // Correct path based on backend route: router.get('/stats/orders', ...)
    // and orders router mounted at /api/v1/orders
    const response = await fetch(`${API_BASE_URL}/orders/stats/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<OrderStats> = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch order statistics');
    }

    return apiResponse.data;
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    throw error;
  }
}

// Fetch paid-only revenue stats (daily and monthly)
export async function fetchRevenueStats(): Promise<RevenueStats> {
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/stats/revenue`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<RevenueStats> = await response.json();
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch revenue statistics');
    }
    return apiResponse.data;
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    throw error;
  }
}

// Fetch dashboard stats (pending, unpaid counts and amount, completed, fast-moving top 20)
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/stats/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const apiResponse: ApiResponse<DashboardStats> = await response.json();
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch dashboard statistics');
    }
    return apiResponse.data;
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    throw error;
  }
}

// Download dashboard CSV export
export async function downloadDashboardExport(): Promise<void> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/stats/dashboard/export`, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cafe-dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Fetch completed orders insights for a period (defaults to current month)
export async function fetchOrdersInsights(params?: { start?: string; end?: string }): Promise<OrdersInsights> {
  const qs = new URLSearchParams()
  if (params?.start) qs.set('start', params.start)
  if (params?.end) qs.set('end', params.end)
  const response = await fetch(`${API_BASE_URL}/stats/orders-insights${qs.toString() ? `?${qs.toString()}` : ''}`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const apiResponse: ApiResponse<OrdersInsights> = await response.json()
  if (!apiResponse.success) throw new Error(apiResponse.message || 'Failed to fetch orders insights')
  return apiResponse.data
}

// Fetch paid sales insights (paid-only, regardless of order status)
export async function fetchSalesInsights(params?: { start?: string; end?: string }): Promise<OrdersInsights> {
  const qs = new URLSearchParams()
  if (params?.start) qs.set('start', params.start)
  if (params?.end) qs.set('end', params.end)
  const response = await fetch(`${API_BASE_URL}/stats/sales${qs.toString() ? `?${qs.toString()}` : ''}`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const apiResponse: ApiResponse<OrdersInsights> = await response.json()
  if (!apiResponse.success) throw new Error(apiResponse.message || 'Failed to fetch sales insights')
  return apiResponse.data
}