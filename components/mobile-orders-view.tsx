"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Search, Clock, CheckCircle, Package, Phone, User, Calendar, ChefHat, XCircle, AlertCircle, DollarSign, Coffee, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchOrdersByPhone, fetchAllOrders } from "@/lib/order-api"
import type { Order } from "@/lib/types"
import { OrderPDFService } from '@/lib/pdf-service'

interface MobileOrdersViewProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileOrdersView({ isOpen, onClose }: MobileOrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("phone") // "phone" or "name"
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const { toast } = useToast()

  // Real API search function
  const searchOrders = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a name or phone number to search.",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    console.log("🔍 Starting search for:", searchTerm, "Type:", searchType)
    
    try {
      let orders: Order[] = []
      
      if (searchType === "phone") {
        console.log("📞 Calling fetchOrdersByPhone API...")
        orders = await fetchOrdersByPhone(searchTerm.trim())
        console.log("📞 Phone search results:", orders)
      } else {
        console.log("👤 Calling fetchAllOrders API for name search...")
        const response = await fetchAllOrders({
          limit: 100,
          page: 1
        })
        console.log("👤 All orders response:", response)
        // Filter by customer name on frontend
        orders = response.orders.filter(order => 
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase().trim())
        )
        console.log("👤 Filtered orders by name:", orders)
      }

      setUserOrders(orders)
      setHasSearched(true)

      if (orders.length === 0) {
        toast({
          title: "No Orders Found",
          description: `No orders found for ${searchType === "phone" ? "phone number" : "name"}: ${searchTerm}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Orders Found",
          description: `Found ${orders.length} order(s).`,
        })
      }
    } catch (error) {
      console.error('❌ Error searching orders:', error)
      toast({
        title: "Search Error", 
        description: "Failed to search orders. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "preparing":
        return <ChefHat className="h-4 w-4" />
      case "ready":
        return <Package className="h-4 w-4" />
      case "delivered":
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <XCircle className="h-4 w-4" />
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      case "refunded":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatCurrency = (value: any): string => {
    const numValue = parseFloat(value) || 0;
    return numValue.toFixed(2);
  };

  const formatPhoneNumber = (value: string) => {
    // Just return numbers without any dashes
    return value.replace(/\D/g, "")
  }

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (searchType === "phone") {
      setSearchTerm(formatPhoneNumber(value))
    } else {
      setSearchTerm(value)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setUserOrders([])
    setHasSearched(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Search className="h-6 w-6 text-amber-600" />
              My Orders
            </h2>
            <Button variant="ghost" onClick={onClose} className="text-gray-500">
              ✕
            </Button>
          </div>

          {/* Search Section */}
          <div className="space-y-4">
            {/* Search Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={searchType === "phone" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSearchType("phone")
                  setSearchTerm("")
                  setHasSearched(false)
                }}
                className={searchType === "phone" ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                <Phone className="h-4 w-4 mr-1" />
                Phone
              </Button>
              <Button
                variant={searchType === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSearchType("name")
                  setSearchTerm("")
                  setHasSearched(false)
                }}
                className={searchType === "name" ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                <User className="h-4 w-4 mr-1" />
                Name
              </Button>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  placeholder={searchType === "phone" ? "Enter phone number (0987654321)" : "Enter customer name"}
                  maxLength={searchType === "phone" ? 15 : 50}
                  className="text-base"
                />
              </div>
              <Button
                onClick={searchOrders}
                disabled={isSearching || !searchTerm.trim()}
                className="bg-amber-600 hover:bg-amber-700 px-6"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {searchTerm && (
              <Button variant="outline" size="sm" onClick={clearSearch} className="w-full bg-transparent">
                Clear Search
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {hasSearched && (
            <div className="space-y-4">
              {userOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders Found</h3>
                    <p className="text-gray-500">
                      No orders found for {searchType === "phone" ? "phone number" : "name"}:{" "}
                      <strong>{searchTerm}</strong>
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Make sure you entered the correct {searchType === "phone" ? "phone number" : "name"} used when
                      placing the order.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Found {userOrders.length} order{userOrders.length !== 1 ? "s" : ""}
                    </h3>
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      {searchType === "phone" ? "Phone" : "Name"}: {searchTerm}
                    </Badge>
                  </div>

                  {userOrders.map((order) => (
                    <Card key={order.id} className="border-l-4 border-l-amber-500 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              Order #{order.id.toString().slice(-6)}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(order.orderDate || order.createdAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>{order.customerName}</strong> • {order.customerPhone}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-800 flex items-center gap-2">
                              Items Ordered:
                              {order.items && order.items.length > 0 && (
                                <span className="text-xs font-normal text-gray-500">
                                  ({order.items.filter(i => i.itemStatus === 'delivered').length}/{order.items.length} delivered)
                                </span>
                              )}
                            </h4>
                            <div className="space-y-2">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex justify-between items-center p-3 rounded-lg ${item.itemStatus === 'delivered' ? 'bg-green-50' : 'bg-gray-50'}`}
                                  >
                                    <div>
                                      <span className="font-medium text-gray-800">
                                        {item.quantity}x {item.itemName}
                                      </span>
                                      {item.specialInstructions && (
                                        <p className="text-xs text-gray-500 mt-1">Note: {item.specialInstructions}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {item.itemStatus === 'delivered' ? (
                                        <Badge className="bg-green-600 hover:bg-green-600 text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Delivered
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs text-gray-500">
                                          Pending
                                        </Badge>
                                      )}
                                      <span className="font-semibold text-amber-600">₹{formatCurrency(item.subtotal)}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                  <span className="font-medium text-gray-800">
                                    Order details not available
                                  </span>
                                  <span className="font-semibold text-amber-600">₹{formatCurrency(order.totalAmount)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Special Instructions */}
                          {order.specialInstructions && (
                            <div>
                              <h4 className="font-semibold mb-1 text-gray-800">Special Instructions:</h4>
                              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                                {order.specialInstructions}
                              </p>
                            </div>
                          )}

                          {/* Status and Payment Display */}
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Order Status */}
                            <div className="flex-1">
                              <Label className="text-sm font-medium mb-2 block">Order Status:</Label>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className={`flex items-center space-x-1 pointer-events-none ${
                                    order.orderStatus?.toLowerCase() === "pending"
                                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                      : order.orderStatus?.toLowerCase() === "preparing"
                                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                                      : order.orderStatus?.toLowerCase() === "ready"
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : order.orderStatus?.toLowerCase() === "delivered"
                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                                      : order.orderStatus?.toLowerCase() === "cancelled"
                                      ? "bg-red-600 hover:bg-red-700 text-white"
                                      : "bg-gray-600 hover:bg-gray-700 text-white"
                                  }`}
                                >
                                  {getStatusIcon(order.orderStatus)}
                                  <span>{order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}</span>
                                </Button>
                              </div>
                            </div>

                            {/* Payment Status */}
                            <div className="flex-1">
                              <Label className="text-sm font-medium mb-2 block">Payment Status:</Label>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className={`flex items-center space-x-1 pointer-events-none ${
                                    order.paymentStatus?.toLowerCase() === "pending"
                                      ? "bg-red-600 hover:bg-red-700 text-white"
                                      : order.paymentStatus?.toLowerCase() === "paid"
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : order.paymentStatus?.toLowerCase() === "failed"
                                      ? "bg-red-600 hover:bg-red-700 text-white"
                                      : "bg-gray-600 hover:bg-gray-700 text-white"
                                  }`}
                                >
                                  {getPaymentStatusIcon(order.paymentStatus || "pending")}
                                  <span>
                                    {(order.paymentStatus || "pending").charAt(0).toUpperCase() +
                                      (order.paymentStatus || "pending").slice(1)}
                                  </span>
                                </Button>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Order Total */}
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span className="text-gray-800">Total Amount:</span>
                            <span className="text-amber-600">₹{formatCurrency(order.totalAmount)}</span>
                          </div>

                          {/* PDF Download Button - ADD THIS SECTION */}
                          <div className="mt-4 flex justify-end">
                            <Button
                              onClick={() => OrderPDFService.download(order)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                            >
                              <Download className="h-4 w-4" />
                              Download PDF
                            </Button>
                          </div>

                          {/* Order Status Message */}
                          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <p className="text-sm text-gray-700 font-medium">
                              {order.orderStatus === "pending" &&
                                "🕐 Your order has been received and is waiting to be prepared."}
                              {order.orderStatus === "preparing" && "👨‍🍳 Great! Your order is being prepared by our team."}
                              {order.orderStatus === "ready" && "✅ Your order is ready! Please collect it from the counter."}
                              {order.orderStatus === "delivered" && "🎉 Your order has been delivered. Thank you!"}
                            </p>
                            {order.paymentStatus === "pending" && (
                              <p className="text-sm text-red-600 mt-2 font-medium">
                                💳 Payment pending - Please pay at the counter when collecting your order.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-12">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Search Your Orders</h3>
              <p className="text-gray-500 mb-4">Enter your phone number or name to find your orders</p>
              <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
                <h4 className="font-semibold text-blue-800 mb-2">How to find your orders:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use the phone number you provided when ordering</li>
                  <li>• Or search by the exact name you gave</li>
                  <li>• All your orders will be displayed with current status</li>
                  <li>• Order statuses: Pending → Preparing → Ready → Delivered</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 