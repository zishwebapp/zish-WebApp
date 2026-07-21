"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Search, Clock, CheckCircle } from "lucide-react"
import { fetchOrdersByPhone } from "@/lib/order-api"
import type { Order } from "@/lib/types"

export function CustomerOrderTracking() {
  const [phone, setPhone] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  const searchOrders = async () => {
    if (!phone.trim()) return
    
    setLoading(true)
    try {
      const fetchedOrders = await fetchOrdersByPhone(phone)
      setOrders(fetchedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Track Your Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1"
            />
            <Button id="searchOrdersBtn" onClick={searchOrders} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {orders.map((order) => (
            <Card key={order.id} className="mb-4">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">Order #{order.id}</h3>
                  <Badge variant="outline">
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {new Date(order.orderDate).toLocaleDateString()}
                </p>
                <p className="font-semibold">
                  Total: ${order.totalAmount.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
} 