"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Phone,
  User,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  CreditCard,
  ShoppingBag,
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  ChevronsUpDown,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import {
  fetchAllOrders,
  placeOrder,
  updateOrderStatus,
  updateOrderItemStatus,
  addOrderItem,
  updateOrderItemQuantity,
  removeOrderItem,
  OrderApiError,
  updatePaymentStatus,
  cancelOrder,
  deleteOrder,
  checkDataIntegrity,
} from "@/lib/order-api"
import { fetchAvailableMenuItems } from "@/lib/api"
import type { Order, OrderStatusUpdate, PaymentStatusUpdate, OrderCancellation, MenuItem } from "@/lib/types"
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/types"
import { OrderPDFService } from '@/lib/pdf-service'

interface OrderManagementProps {
  userType: "admin" | "superadmin" | null
}

export function OrderManagement({ userType }: OrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchOrderId, setSearchOrderId] = useState("")
  const [searchCustomerName, setSearchCustomerName] = useState("")
  const [searchItemName, setSearchItemName] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [updatingOrders, setUpdatingOrders] = useState<Set<number>>(new Set())
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [addItemOrderId, setAddItemOrderId] = useState<string | null>(null)
  const [addItemMenuId, setAddItemMenuId] = useState<string>("")
  const [addItemQuantity, setAddItemQuantity] = useState<number>(1)
  const [addingItem, setAddingItem] = useState(false)
  const [addItemPickerOpen, setAddItemPickerOpen] = useState<string | null>(null)
  const [lastItemDialogOrderId, setLastItemDialogOrderId] = useState<string | null>(null)
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false)
  const [newOrderCustomerName, setNewOrderCustomerName] = useState("")
  const [newOrderCustomerPhone, setNewOrderCustomerPhone] = useState("")
  const [newOrderInstructions, setNewOrderInstructions] = useState("")
  const [newOrderItems, setNewOrderItems] = useState<{ menuItemId: number; name: string; price: number; quantity: number }[]>([])
  const [newOrderPickerOpen, setNewOrderPickerOpen] = useState(false)
  const [newOrderSelectedMenuId, setNewOrderSelectedMenuId] = useState("")
  const [newOrderSelectedQty, setNewOrderSelectedQty] = useState(1)
  const [placingNewOrder, setPlacingNewOrder] = useState(false)
  const { toast } = useToast()

  // No longer needed - Google Sheets backend uses 'completed' status directly

  // Guard concurrent requests to avoid 429s
  let loadingInFlight = false

  // Load orders from API
  const loadOrders = async (page = 1) => {
    try {
      if (loadingInFlight) return
      loadingInFlight = true
      setLoading(true)
      setError(null)

      const response = await fetchAllOrders({
        page,
        limit: 10,
        status: statusFilter !== "all" ? statusFilter : undefined,
        paymentStatus: paymentFilter !== "all" ? paymentFilter : undefined,
        phone: searchTerm.trim() || undefined,
        orderId: searchOrderId.trim() || undefined,
        customerName: searchCustomerName.trim() || undefined,
        item: searchItemName.trim() || undefined,
        sortBy: 'order_date',
        order: 'desc',
        includeCancelled: true
      })

      if (response.orders.length === 0 && page > 1) {
        // If no orders on current page, go back to page 1
        setCurrentPage(1)
        loadOrders(1)
        return
      }

      setOrders(response.orders)
      setTotalCount(response.totalCount)
      setTotalPages(response.totalPages)
      setCurrentPage(response.currentPage)
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to load orders')
      toast({
        title: "Loading Failed",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      loadingInFlight = false
    }
  }

  // Initial load
  useEffect(() => {
    if (userType === "admin" || userType === "superadmin") {
      loadOrders()
      fetchAvailableMenuItems()
        .then(setMenuItems)
        .catch(err => console.error('Failed to load menu items for order editing:', err))
    }
  }, [userType])

  // Reload when filters change (debounced)
  useEffect(() => {
    if (userType === "admin" || userType === "superadmin") {
      const timeoutId = setTimeout(() => {
        loadOrders(1)
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, searchOrderId, searchCustomerName, searchItemName, statusFilter, paymentFilter, userType])

  // First, add useEffect to load orders when page changes
  useEffect(() => {
    if (userType === "admin" || userType === "superadmin") {
      loadOrders(currentPage)
    }
  }, [currentPage]) // Add currentPage to dependency array

  // Helper functions for status updates
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId))
      
      // Update local state immediately for better UX
      setOrders(prevOrders => prevOrders.map(order => order.id === String(orderId) ? { ...order, orderStatus: newStatus as Order['orderStatus'] } : order))

      // Update order status on backend
      await updateOrderStatus(String(orderId), { 
        status: newStatus as Order['orderStatus'],
        changedBy: 'admin'
      })
      
      // Refresh from server to ensure consistency
      await loadOrders(currentPage)
      
      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      })
    } catch (err) {
      console.error('Failed to update order status:', err)
      // Revert local change on error
      await loadOrders(currentPage)
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const handleItemStatusUpdate = async (
    orderId: string,
    itemId: string,
    newStatus: 'pending' | 'delivered'
  ) => {
    try {
      setUpdatingItems(prev => new Set(prev).add(itemId))

      // Update local state immediately for better UX. Note: position within
      // the list isn't re-sorted until the next reload (page/filter change),
      // even though this may change which delivery-status group the order
      // belongs to.
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === orderId
          ? { ...order, items: order.items.map(item => item.id === itemId ? { ...item, itemStatus: newStatus } : item) }
          : order
      ))
      setSelectedOrder(prev =>
        prev && prev.id === orderId
          ? { ...prev, items: prev.items.map(item => item.id === itemId ? { ...item, itemStatus: newStatus } : item) }
          : prev
      )

      const result = await updateOrderItemStatus(orderId, itemId, { itemStatus: newStatus })

      // Backend auto-bumps order status to "ready" once every item is
      // delivered; mirror that locally instead of refetching the whole list.
      if (result.orderStatusBumpedToReady) {
        setOrders(prevOrders => prevOrders.map(order =>
          order.id === orderId ? { ...order, orderStatus: 'ready' } : order
        ))
        setSelectedOrder(prev =>
          prev && prev.id === orderId ? { ...prev, orderStatus: 'ready' } : prev
        )
      }

      toast({
        title: "Item Updated",
        description: newStatus === 'delivered' ? "Item marked as delivered" : "Item marked as pending",
      })
    } catch (err) {
      console.error('Failed to update item status:', err)
      // Revert local change on error
      await loadOrders(currentPage)
      toast({
        title: "Update Failed",
        description: "Failed to update item status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleAddItem = async (orderId: string) => {
    if (!addItemMenuId) return
    const menuItem = menuItems.find(m => String(m.id) === addItemMenuId)
    if (!menuItem) return

    try {
      setAddingItem(true)
      await addOrderItem(orderId, {
        menuItemId: menuItem.id,
        quantity: addItemQuantity,
      })

      await loadOrders(currentPage)

      setAddItemOrderId(null)
      setAddItemMenuId("")
      setAddItemQuantity(1)
      setAddItemPickerOpen(null)

      toast({
        title: "Item Added",
        description: `${menuItem.name} x${addItemQuantity} added to the order`,
      })
    } catch (err) {
      console.error('Failed to add item:', err)
      toast({
        title: "Add Failed",
        description: err instanceof Error ? err.message : "Failed to add item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingItem(false)
    }
  }

  const handleQuantityChange = async (orderId: string, itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta
    if (newQuantity < 1) return // use the remove button to go below 1

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId))

      // Optimistic update
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map(item =>
                item.id === itemId
                  ? { ...item, quantity: newQuantity, subtotal: item.itemPrice * newQuantity }
                  : item
              ),
            }
          : order
      ))

      await updateOrderItemQuantity(orderId, itemId, { quantity: newQuantity })
      await loadOrders(currentPage)
    } catch (err) {
      console.error('Failed to update item quantity:', err)
      await loadOrders(currentPage)
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Failed to update quantity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (orderId: string, itemId: string) => {
    try {
      setUpdatingItems(prev => new Set(prev).add(itemId))

      await removeOrderItem(orderId, itemId)
      await loadOrders(currentPage)

      toast({
        title: "Item Removed",
        description: "Item removed from the order",
      })
    } catch (err) {
      if (err instanceof OrderApiError && err.code === 'LAST_ITEM') {
        setLastItemDialogOrderId(orderId)
      } else {
        console.error('Failed to remove item:', err)
        toast({
          title: "Remove Failed",
          description: err instanceof Error ? err.message : "Failed to remove item. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const resetNewOrderForm = () => {
    setNewOrderCustomerName("")
    setNewOrderCustomerPhone("")
    setNewOrderInstructions("")
    setNewOrderItems([])
    setNewOrderSelectedMenuId("")
    setNewOrderSelectedQty(1)
  }

  const handleAddNewOrderItem = () => {
    if (!newOrderSelectedMenuId) return
    const menuItem = menuItems.find(m => String(m.id) === newOrderSelectedMenuId)
    if (!menuItem) return

    setNewOrderItems(prev => {
      const existing = prev.find(i => i.menuItemId === menuItem.id)
      if (existing) {
        return prev.map(i => i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + newOrderSelectedQty } : i)
      }
      return [...prev, { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: newOrderSelectedQty }]
    })
    setNewOrderSelectedMenuId("")
    setNewOrderSelectedQty(1)
  }

  const handleRemoveNewOrderItem = (menuItemId: number) => {
    setNewOrderItems(prev => prev.filter(i => i.menuItemId !== menuItemId))
  }

  const handleNewOrderItemQtyChange = (menuItemId: number, delta: number) => {
    setNewOrderItems(prev =>
      prev.map(i => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + delta } : i)).filter(i => i.quantity >= 1)
    )
  }

  const newOrderTotal = newOrderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handlePlaceNewOrder = async () => {
    if (!newOrderCustomerName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a customer name.",
        variant: "destructive",
      })
      return
    }
    if (newOrderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Add at least one item to place the order.",
        variant: "destructive",
      })
      return
    }

    try {
      setPlacingNewOrder(true)
      await placeOrder({
        customerName: newOrderCustomerName.trim(),
        customerPhone: newOrderCustomerPhone.trim(),
        items: newOrderItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        specialInstructions: newOrderInstructions.trim() || undefined,
      })

      setShowNewOrderDialog(false)
      resetNewOrderForm()
      setCurrentPage(1)
      await loadOrders(1)

      toast({
        title: "Order Placed",
        description: `Order created for ${newOrderCustomerName.trim()}`,
      })
    } catch (err) {
      console.error('Failed to place order:', err)
      toast({
        title: "Failed to Place Order",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setPlacingNewOrder(false)
    }
  }

  const handlePaymentUpdate = async (
    orderId: number,
    newStatus: 'unpaid' | 'paid_cash' | 'paid_upi'
  ) => {
    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId))

      // Map UI statuses to backend shape
      const backendStatus: 'unpaid' | 'paid' = 
        newStatus === 'paid_cash' || newStatus === 'paid_upi' ? 'paid' : 'unpaid'
      const backendMethod: 'cash' | 'upi' | undefined =
        newStatus === 'paid_cash' ? 'cash' : newStatus === 'paid_upi' ? 'upi' : undefined

      // Optimistic update (use backend shape so selection sticks on reload)
      setOrders(prev => prev.map(o => o.id === String(orderId) ? { ...o, paymentStatus: backendStatus, paymentMethod: backendMethod } : o))

      await updatePaymentStatus(String(orderId), {
        paymentStatus: backendStatus,
        paymentMethod: backendMethod
      })

      await loadOrders(currentPage)

      const label =
        backendStatus === 'paid'
          ? `Paid ${backendMethod ? `(${backendMethod.toUpperCase()})` : ''}`
          : 'Payment Pending'

      toast({ title: 'Payment Updated', description: label })
    } catch (err) {
      console.error('Failed to update payment status:', err)
      await loadOrders(currentPage)
      toast({
        title: 'Update Failed',
        description: 'Failed to update payment status. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingOrders(prev => {
        const s = new Set(prev)
        s.delete(orderId)
        return s
      })
    }
  }

  const handleCancelOrder = async (orderId: number, reason: string) => {
    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId))
      
      await cancelOrder(String(orderId), { 
        reason,
        cancelledBy: 'admin'
      })
      await loadOrders(currentPage)
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled successfully.",
      })
    } catch (err) {
      console.error('Failed to cancel order:', err)
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    // Confirm deletion
    if (!confirm(`⚠️ PERMANENT DELETION\n\nAre you sure you want to permanently delete order ${orderId}?\n\nThis will remove:\n• The order\n• All order items\n• All status history\n\n❌ This action CANNOT be undone.`)) {
      return;
    }

    try {
      setUpdatingOrders(prev => new Set(prev).add(Number(orderId)))
      
      await deleteOrder(orderId)
      
      toast({
        title: "Order Deleted",
        description: "Order and all related records have been permanently deleted.",
      })
      
      // Reload orders to reflect deletion
      await loadOrders(currentPage)
      
    } catch (err) {
      console.error('Failed to delete order:', err)
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Failed to delete order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrders(prev => {
        const s = new Set(prev)
        s.delete(Number(orderId))
        return s
      })
    }
  }

  // Helper functions for styling
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'preparing':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      case 'ready':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getPaymentBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'refunded':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  // Only allow Admin access
  if (userType !== "admin" && userType !== "superadmin") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Order Management is only available for Admin users.</p>
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
            <p className="text-gray-600">Loading orders...</p>
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
              id="retryLoadOrdersBtn"
              variant="outline"
              size="sm"
              onClick={() => loadOrders(currentPage)}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
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
          <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search by Phone</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Enter customer phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Search by Order Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Enter order number..."
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Search by Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Enter customer name..."
                  value={searchCustomerName}
                  onChange={(e) => setSearchCustomerName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter by Payment</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Item Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search items in orders..."
                  value={searchItemName}
                  onChange={(e) => setSearchItemName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              id="clearFiltersBtn"
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSearchOrderId("")
                setSearchCustomerName("")
                setSearchItemName("")
                setStatusFilter("all")
                setPaymentFilter("all")
                setCurrentPage(1)
                loadOrders(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Management */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <CardTitle>Orders Management</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button id="openNewOrderDialogBtn" onClick={() => setShowNewOrderDialog(true)} size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
            <Button id="refreshOrdersBtn" onClick={() => loadOrders(currentPage)} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <>
              {/* Orders list */}
              {orders.map((order) => {
                const displayStatus = order.orderStatus
                const isUpdating = updatingOrders.has(Number(order.id))
                
                return (
                  <Card key={order.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-4">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div>
                            <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span>{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{order.customerPhone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(order.orderDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {order.orderStatus === 'cancelled' ? (
                              <Badge variant="destructive">Cancelled</Badge>
                            ) : (
                              <Badge className="text-lg font-semibold">₹{order.totalAmount}</Badge>
                            )}
                          </div>
                        </div>

                        {/* Items */}
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">
                            Items:
                            {order.items.length > 0 && (
                              <span className="ml-2 font-normal text-gray-500">
                                ({order.items.filter(i => i.itemStatus === 'delivered').length}/{order.items.length} delivered)
                              </span>
                            )}
                          </h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => {
                              const isDelivered = item.itemStatus === 'delivered'
                              const isItemUpdating = !!item.id && updatingItems.has(item.id)
                              const canToggleItem = !!item.id && order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed'
                              return (
                                <div key={item.id || index} className={`p-3 rounded-md ${isDelivered ? 'bg-green-50' : 'bg-gray-50'}`}>
                                  <div className="flex justify-between items-center text-sm gap-2 flex-wrap">
                                    <span className="font-medium">{item.itemName}</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {item.id && (
                                        <div className="flex items-center border rounded-md">
                                          <button
                                            id={`decreaseItemQty-${item.id}-Btn`}
                                            type="button"
                                            className="p-1 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent"
                                            disabled={isItemUpdating}
                                            onClick={() => handleQuantityChange(order.id, item.id as string, item.quantity, -1)}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </button>
                                          <span className="px-2 text-xs w-6 text-center">{item.quantity}</span>
                                          <button
                                            id={`increaseItemQty-${item.id}-Btn`}
                                            type="button"
                                            className="p-1 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent"
                                            disabled={isItemUpdating}
                                            onClick={() => handleQuantityChange(order.id, item.id as string, item.quantity, 1)}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
                                      <span className="font-medium">₹{item.subtotal}</span>
                                      {canToggleItem ? (
                                        <Button
                                          id={`toggleItemDelivered-${item.id}-Btn`}
                                          variant={isDelivered ? "default" : "outline"}
                                          size="sm"
                                          className={isDelivered ? "bg-green-600 hover:bg-green-700 h-7 px-2 text-xs" : "h-7 px-2 text-xs"}
                                          disabled={isItemUpdating}
                                          onClick={() => handleItemStatusUpdate(order.id, item.id as string, isDelivered ? 'pending' : 'delivered')}
                                        >
                                          {isItemUpdating ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : isDelivered ? (
                                            <>
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Delivered
                                            </>
                                          ) : (
                                            "Mark Delivered"
                                          )}
                                        </Button>
                                      ) : (
                                        isDelivered && (
                                          <Badge className="bg-green-600 hover:bg-green-600">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Delivered
                                          </Badge>
                                        )
                                      )}
                                      {item.id && (
                                        <Button
                                          id={`removeOrderItem-${item.id}-Btn`}
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          disabled={isItemUpdating}
                                          onClick={() => handleRemoveItem(order.id, item.id as string)}
                                        >
                                          {isItemUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {item.specialInstructions && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                      <span className="text-blue-800 font-medium">Item Note: </span>
                                      <span className="text-blue-700">{item.specialInstructions}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Add Item */}
                          <div className="mt-2">
                            {addItemOrderId === order.id ? (
                              <div className="border rounded-md p-3 bg-gray-50 space-y-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Popover
                                    open={addItemPickerOpen === order.id}
                                    onOpenChange={(open) => setAddItemPickerOpen(open ? order.id : null)}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        id={`selectMenuItemToAdd-${order.id}-Btn`}
                                        variant="outline"
                                        role="combobox"
                                        className="flex-1 justify-between font-normal"
                                      >
                                        {addItemMenuId
                                          ? (() => {
                                              const m = menuItems.find(m => String(m.id) === addItemMenuId)
                                              return m ? `${m.name} - ₹${m.price}` : "Select an item to add"
                                            })()
                                          : "Select an item to add"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-[300px]" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search menu items..." />
                                        <CommandList>
                                          <CommandEmpty>No item found.</CommandEmpty>
                                          <CommandGroup>
                                            {menuItems.map(m => (
                                              <CommandItem
                                                key={m.id}
                                                value={m.name}
                                                onSelect={() => {
                                                  setAddItemMenuId(String(m.id))
                                                  setAddItemPickerOpen(null)
                                                }}
                                              >
                                                {m.name} - ₹{m.price}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <div className="flex items-center border rounded-md self-start">
                                    <button
                                      id={`decreaseAddItemQty-${order.id}-Btn`}
                                      type="button"
                                      className="p-2 hover:bg-gray-200"
                                      onClick={() => setAddItemQuantity(q => Math.max(1, q - 1))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="px-3 text-sm w-8 text-center">{addItemQuantity}</span>
                                    <button
                                      id={`increaseAddItemQty-${order.id}-Btn`}
                                      type="button"
                                      className="p-2 hover:bg-gray-200"
                                      onClick={() => setAddItemQuantity(q => q + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    id={`confirmAddItem-${order.id}-Btn`}
                                    size="sm"
                                    disabled={!addItemMenuId || addingItem}
                                    onClick={() => handleAddItem(order.id)}
                                  >
                                    {addingItem ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                                    Add
                                  </Button>
                                  <Button
                                    id={`cancelAddItem-${order.id}-Btn`}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setAddItemOrderId(null)
                                      setAddItemMenuId("")
                                      setAddItemQuantity(1)
                                      setAddItemPickerOpen(null)
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button id={`showAddItem-${order.id}-Btn`} variant="outline" size="sm" onClick={() => setAddItemOrderId(order.id)}>
                                <Plus className="h-3 w-3 mr-1" />
                                Add Item
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Special Instructions */}
                        {order.specialInstructions && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="font-medium text-sm text-blue-800 mb-2 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Special Instructions:
                            </h4>
                            <p className="text-sm text-blue-700 leading-relaxed">
                              {order.specialInstructions}
                            </p>
                          </div>
                        )}

                        {/* Status Controls */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Order Status:</h4>
                            <div className="flex flex-wrap gap-2">
                              {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => {
                                const isSelected = displayStatus === status
                                return (
                                  <Button
                                    key={status}
                                    id={`orderStatus-${order.id}-${status}-Btn`}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleStatusUpdate(order.id, status)}
                                    disabled={isUpdating || order.orderStatus === 'cancelled' || order.orderStatus === 'completed'}
                                    className={`relative ${
                                      isSelected 
                                        ? status === 'cancelled'
                                          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                                          : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                                        : status === 'cancelled'
                                        ? 'text-red-600 border-red-600 hover:bg-red-50'
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    {isUpdating && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                    {!isUpdating && status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                    {!isUpdating && status === 'preparing' && <Package className="h-3 w-3 mr-1" />}
                                    {!isUpdating && status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {!isUpdating && status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {!isUpdating && status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Payment Status:</h4>
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                const isPaid = order.paymentStatus === 'paid'
                                const isCash = order.paymentMethod === 'cash'
                                const isUpi = order.paymentMethod === 'upi'

                                return (
                                  <>
                                    {/* Unpaid */}
                                    <Button
                                      id={`paymentUnpaid-${order.id}-Btn`}
                                      variant={order.paymentStatus === 'unpaid' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => handlePaymentUpdate(order.id, 'unpaid')}
                                      disabled={isUpdating || isPaid}
                                      className={`relative ${
                                        order.paymentStatus === 'unpaid'
                                          ? 'bg-orange-500 text-white border-orange-500 disabled:opacity-100'
                                          : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      {isUpdating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />}
                                      Unpaid
                                    </Button>

                                    {/* Paid Cash */}
                                    <Button
                                      id={`paymentPaidCash-${order.id}-Btn`}
                                      variant={isPaid && isCash ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => handlePaymentUpdate(order.id, 'paid_cash')}
                                      disabled={isUpdating || isPaid}
                                      className={`relative ${
                                        isPaid && isCash
                                          ? 'bg-green-500 text-white border-green-500 disabled:opacity-100'
                                          : isPaid
                                          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                          : 'border-green-600 text-green-700 hover:bg-green-50'
                                      }`}
                                    >
                                      {isUpdating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                      Paid Cash
                                    </Button>

                                    {/* Paid UPI */}
                                    <Button
                                      id={`paymentPaidUpi-${order.id}-Btn`}
                                      variant={isPaid && isUpi ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => handlePaymentUpdate(order.id, 'paid_upi')}
                                      disabled={isUpdating || isPaid}
                                      className={`relative ${
                                        isPaid && isUpi
                                          ? 'bg-green-500 text-white border-green-500 disabled:opacity-100'
                                          : isPaid
                                          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                          : 'border-green-600 text-green-700 hover:bg-green-50'
                                      }`}
                                    >
                                      {isUpdating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CreditCard className="h-3 w-3 mr-1" />}
                                      Paid UPI
                                    </Button>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex justify-between items-center">
                          {/* Warning for orphaned orders */}
                          {(order as any).isOrphaned && (
                            <div className="flex items-center gap-2 text-yellow-600 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>No items found for this order</span>
                            </div>
                          )}
                          
                          <div className={`flex gap-2 ${(order as any).isOrphaned ? 'ml-auto' : 'ml-auto'}`}>
                            <Button
                              id={`downloadOrderPdf-${order.id}-Btn`}
                              onClick={() => OrderPDFService.download(order)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                            >
                              <Download className="h-4 w-4" />
                              Download PDF
                            </Button>

                            {/* Delete Button - Superadmin Only */}
                            {userType === "superadmin" && (
                              <Button
                                id={`deleteOrder-${order.id}-Btn`}
                                onClick={() => handleDeleteOrder(String(order.id))}
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Improved Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pb-4">
                  <Button
                    id="prevPageBtn"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-600">Page</span>
                    <span className="font-medium">{currentPage}</span>
                    <span className="text-gray-600">of</span>
                    <span className="font-medium">{totalPages}</span>
                  </div>

                  <Button
                    id="nextPageBtn"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders Found</h3>
              <p className="text-gray-500 mb-4">
                {loading 
                  ? "Loading orders..."
                  : searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                    ? "No orders match your filters. Try adjusting your search criteria."
                    : "There are no orders to display."
                }
              </p>
              {(searchTerm || statusFilter !== "all" || paymentFilter !== "all") && (
                <Button
                  id="clearFiltersEmptyStateBtn"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setPaymentFilter("all")
                    setCurrentPage(1)
                    loadOrders(1)
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Order Details #{selectedOrder.id}</h3>
                <Button
                  id="closeOrderDetailModalBtn"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOrderModal(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Customer Name</Label>
                    <p>{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Phone Number</Label>
                    <p>{selectedOrder.customerPhone}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Order Status</Label>
                    <Badge className={`${getStatusBadgeColor(selectedOrder.orderStatus)} border mt-1`}>
                      {ORDER_STATUS_LABELS[selectedOrder.orderStatus]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Payment Status</Label>
                    <Badge className={`${getPaymentBadgeColor(selectedOrder.paymentStatus)} border mt-1`}>
                      {PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Order Items</Label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.map((item) => {
                      const isDelivered = item.itemStatus === 'delivered'
                      const isItemUpdating = !!item.id && updatingItems.has(item.id)
                      const canToggleItem = !!item.id && selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'completed'
                      return (
                        <div key={item.id} className={`flex justify-between items-center p-3 rounded-md ${isDelivered ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.itemPrice}</p>
                            {item.specialInstructions && (
                              <p className="text-sm text-blue-600">Note: {item.specialInstructions}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">₹{item.subtotal}</p>
                            {canToggleItem ? (
                              <Button
                                id={`modalToggleItemDelivered-${item.id}-Btn`}
                                variant={isDelivered ? "default" : "outline"}
                                size="sm"
                                className={isDelivered ? "bg-green-600 hover:bg-green-700 h-7 px-2 text-xs" : "h-7 px-2 text-xs"}
                                disabled={isItemUpdating}
                                onClick={() => handleItemStatusUpdate(selectedOrder.id, item.id as string, isDelivered ? 'pending' : 'delivered')}
                              >
                                {isItemUpdating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : isDelivered ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Delivered
                                  </>
                                ) : (
                                  "Mark Delivered"
                                )}
                              </Button>
                            ) : (
                              isDelivered && (
                                <Badge className="bg-green-600 hover:bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Delivered
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>

                {selectedOrder.specialInstructions && (
                  <div>
                    <Label className="font-medium">Special Instructions</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedOrder.specialInstructions}</p>
                  </div>
                )}

                {selectedOrder.deliveryAddress && (
                  <div>
                    <Label className="font-medium">Delivery Address</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedOrder.deliveryAddress}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <Label className="font-medium">Order Date</Label>
                    <p>{new Date(selectedOrder.orderDate).toLocaleString()}</p>
                  </div>
                  {selectedOrder.estimatedDeliveryTime && (
                    <div>
                      <Label className="font-medium">Estimated Delivery</Label>
                      <p>{new Date(selectedOrder.estimatedDeliveryTime).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={showNewOrderDialog}
        onOpenChange={(open) => {
          if (!open && !placingNewOrder) {
            setShowNewOrderDialog(false)
            resetNewOrderForm()
          }
        }}
        modal={false}
      >
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={newOrderCustomerName}
                onChange={(e) => setNewOrderCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number (Optional)</Label>
              <Input
                value={newOrderCustomerPhone}
                onChange={(e) => setNewOrderCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label>Items *</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover open={newOrderPickerOpen} onOpenChange={setNewOrderPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button id="selectNewOrderMenuItemBtn" variant="outline" role="combobox" className="flex-1 justify-between font-normal">
                      {newOrderSelectedMenuId
                        ? (() => {
                            const m = menuItems.find(m => String(m.id) === newOrderSelectedMenuId)
                            return m ? `${m.name} - ₹${m.price}` : "Select an item"
                          })()
                        : "Select an item to add"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[300px]" align="start">
                    <Command>
                      <CommandInput placeholder="Search menu items..." />
                      <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup>
                          {menuItems.map(m => (
                            <CommandItem
                              key={m.id}
                              value={m.name}
                              onSelect={() => {
                                setNewOrderSelectedMenuId(String(m.id))
                                setNewOrderPickerOpen(false)
                              }}
                            >
                              {m.name} - ₹{m.price}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex items-center border rounded-md self-start">
                  <button
                    id="decreaseNewOrderSelectedQtyBtn"
                    type="button"
                    className="p-2 hover:bg-gray-200"
                    onClick={() => setNewOrderSelectedQty(q => Math.max(1, q - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 text-sm w-8 text-center">{newOrderSelectedQty}</span>
                  <button
                    id="increaseNewOrderSelectedQtyBtn"
                    type="button"
                    className="p-2 hover:bg-gray-200"
                    onClick={() => setNewOrderSelectedQty(q => q + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <Button id="addNewOrderItemBtn" size="sm" disabled={!newOrderSelectedMenuId} onClick={handleAddNewOrderItem}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {newOrderItems.length > 0 && (
                <div className="space-y-2 mt-2">
                  {newOrderItems.map(item => (
                    <div key={item.menuItemId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-md">
                          <button
                            id={`decreaseNewOrderItemQty-${item.menuItemId}-Btn`}
                            type="button"
                            className="p-1 hover:bg-gray-200"
                            onClick={() => handleNewOrderItemQtyChange(item.menuItemId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs w-6 text-center">{item.quantity}</span>
                          <button
                            id={`increaseNewOrderItemQty-${item.menuItemId}-Btn`}
                            type="button"
                            className="p-1 hover:bg-gray-200"
                            onClick={() => handleNewOrderItemQtyChange(item.menuItemId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-medium w-14 text-right">₹{item.price * item.quantity}</span>
                        <Button
                          id={`removeNewOrderItem-${item.menuItemId}-Btn`}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveNewOrderItem(item.menuItemId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                value={newOrderInstructions}
                onChange={(e) => setNewOrderInstructions(e.target.value)}
                placeholder="Any special requests for the whole order..."
                rows={2}
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t font-semibold">
              <span>Total:</span>
              <span>₹{newOrderTotal}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                id="cancelNewOrderDialogBtn"
                variant="outline"
                className="flex-1"
                disabled={placingNewOrder}
                onClick={() => {
                  setShowNewOrderDialog(false)
                  resetNewOrderForm()
                }}
              >
                Cancel
              </Button>
              <Button
                id="placeNewOrderBtn"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={placingNewOrder || !newOrderCustomerName.trim() || newOrderItems.length === 0}
                onClick={handlePlaceNewOrder}
              >
                {placingNewOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing...
                  </>
                ) : (
                  `Place Order - ₹${newOrderTotal}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!lastItemDialogOrderId} onOpenChange={(open) => !open && setLastItemDialogOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Can't remove the last item</AlertDialogTitle>
            <AlertDialogDescription>
              This is the only item left on this order. An order can't have zero items —
              cancel the whole order instead if the customer no longer wants it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLastItemDialogOrderId(null)}>Keep Item</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                const orderId = lastItemDialogOrderId
                setLastItemDialogOrderId(null)
                if (!orderId) return
                try {
                  await updateOrderStatus(orderId, { status: 'cancelled', changedBy: 'admin' })
                  await loadOrders(currentPage)
                  toast({ title: "Order Cancelled", description: "Order has been cancelled successfully." })
                } catch (err) {
                  console.error('Failed to cancel order:', err)
                  toast({ title: "Cancellation Failed", description: "Failed to cancel order. Please try again.", variant: "destructive" })
                }
              }}
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 