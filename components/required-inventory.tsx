"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import {
  ClipboardList,
  Clock,
  CheckCircle,
  Search,
  Package2,
  DollarSign,
  User,
  Download,
  Calendar as CalendarIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InventoryOrder {
  id: string
  itemId: string
  itemName: string
  unit: string
  rate: number
  quantity: number
  totalAmount: number
  notes: string
  status: "pending" | "purchased"
  orderedBy: string
  orderDate: string
  createdAt: string
}

interface RequiredInventoryProps {
  userType: "admin" | "superadmin" | null
}

export function RequiredInventory({ userType }: RequiredInventoryProps) {
  const [inventoryOrders, setInventoryOrders] = useState<InventoryOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<InventoryOrder[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const { toast } = useToast()
  const [dateFilter, setDateFilter] = useState<"all" | "thisMonth" | "lastMonth" | "custom">("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  // Load data from API (fallback to localStorage)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { listInventoryOrders } = await import("@/lib/inventory-api")
        const orders = await listInventoryOrders({ status: 'all' })
        if (cancelled) return
        const flat = orders.flatMap(o => o.items.map((li, idx) => ({
          id: `${o.id}-${idx}`,
          itemId: '',
          itemName: li.itemName,
          unit: li.unit,
          rate: li.rate,
          quantity: li.quantity,
          totalAmount: li.lineAmount,
          notes: '',
          status: o.status === 'purchased' ? 'purchased' : 'pending',
          orderedBy: o.ordered_by,
          orderDate: o.ordered_at,
          createdAt: o.ordered_at,
        })))
        setInventoryOrders(flat)
      } catch {
        const savedOrders = JSON.parse(localStorage.getItem("inventoryOrders") || "[]")
        if (!cancelled) setInventoryOrders(savedOrders)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...inventoryOrders]

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(order => 
        order.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderedBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // User filter
    if (userFilter !== "all") {
      filtered = filtered.filter(order => order.orderedBy === userFilter)
    }

    // Date filter
    let start: Date | null = null
    let end: Date | null = null
    const now = new Date()

    if (dateFilter === "thisMonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (dateFilter === "lastMonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    } else if (dateFilter === "custom" && customStartDate && customEndDate) {
      start = new Date(customStartDate)
      start.setHours(0, 0, 0, 0)
      end = new Date(customEndDate)
      end.setHours(23, 59, 59, 999)
    }

    if (start && end) {
      filtered = filtered.filter(order => {
        const d = new Date(order.orderDate)
        return d >= start! && d <= end!
      })
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredOrders(filtered)
  }, [inventoryOrders, searchTerm, statusFilter, userFilter, dateFilter, customStartDate, customEndDate])

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "purchased") => {
    const updatedOrders = inventoryOrders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    )
    
    setInventoryOrders(updatedOrders)
    localStorage.setItem("inventoryOrders", JSON.stringify(updatedOrders))
    try {
      if (newStatus === 'purchased') {
        const { markInventoryOrderPurchased } = await import("@/lib/inventory-api")
        const idNum = Number(orderId.split('-')[0])
        if (!Number.isNaN(idNum)) {
          await markInventoryOrderPurchased(idNum, 'superadmin')
        }
      }
    } catch {}

    const order = inventoryOrders.find(o => o.id === orderId)
    toast({
      title: "Status Updated",
      description: `Order for ${order?.itemName} marked as ${newStatus}.`,
    })
  }

  // Export currently filtered orders to CSV
  const exportToCSV = () => {
    if (!filteredOrders.length) return
    const headers = [
      "Item",
      "Unit",
      "Quantity",
      "Rate",
      "Total Amount",
      "Ordered By",
      "Order Date",
      "Status",
    ]
    const rows = filteredOrders.map(o => [
      o.itemName,
      o.unit,
      String(o.quantity),
      String(o.rate),
      o.totalAmount.toFixed(2),
      o.orderedBy,
      new Date(o.orderDate).toLocaleDateString(),
      o.status,
    ])
    const csv = [headers, ...rows]
      .map(r =>
        r
          .map(field => {
            const s = String(field ?? "")
            return s.includes(",") || s.includes('"') || s.includes("\n")
              ? `"${s.replace(/"/g, '""')}"`
              : s
          })
          .join(","),
      )
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const d = new Date()
    link.download = `inventory-orders-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getPeriodLabel = () => {
    switch (dateFilter) {
      case "thisMonth":
        return "This Month"
      case "lastMonth":
        return "Last Month"
      case "custom":
        return customStartDate && customEndDate ? `${customStartDate} to ${customEndDate}` : "Custom Range"
      default:
        return "All Dates"
    }
  }

  // Only allow Super Admin access
  if (userType !== "superadmin") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <ClipboardList className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Required Inventory management is only available for Super Admin users.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate stats
  const pendingOrders = inventoryOrders.filter(order => order.status === "pending")
  const purchasedOrders = inventoryOrders.filter(order => order.status === "purchased")
  const totalPendingAmount = pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalPurchasedAmount = purchasedOrders.reduce((sum, order) => sum + order.totalAmount, 0)

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(inventoryOrders.map(order => order.orderedBy)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-purple-600" />
            Required Inventory
          </h2>
          <p className="text-gray-600 mt-1">Manage inventory orders from admin users</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{pendingOrders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Purchased Orders</p>
                <p className="text-2xl font-bold text-green-600">{purchasedOrders.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-600">₹{totalPendingAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Purchased Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{totalPurchasedAmount.toFixed(2)}</p>
              </div>
              <Package2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filtering Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Date Filtering Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Period</Label>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === "custom" && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Showing: {getPeriodLabel()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="purchased">Purchased</SelectItem>
              </SelectContent>
            </Select>

            {/* User Filter */}
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Inventory Orders ({filteredOrders.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {inventoryOrders.length === 0 
                  ? "No inventory orders placed yet." 
                  : "No orders match your filters"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Details</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Ordered By</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.itemName}</div>
                        <div className="text-sm text-gray-500">{order.unit}</div>
                        {order.notes && (
                          <div className="text-xs text-blue-600 mt-1">
                            Note: {order.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{order.quantity}</TableCell>
                      <TableCell>₹{order.rate}</TableCell>
                      <TableCell className="font-semibold text-green-600">₹{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.orderedBy}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={order.status === "pending" ? "secondary" : "default"}
                          className={order.status === "pending" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {order.status === "pending" ? (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "purchased")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Purchased
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "pending")}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Mark Pending
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 