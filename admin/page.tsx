"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MultiSelectDropdown } from "@/components/multi-select-dropdown"
import {
  Coffee,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Plus,
  Trash2,
  FileText,
  Home,
  LogIn,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { fetchOrderStats } from "@/lib/order-api"

interface Order {
  id: string
  items?: Array<{
    name: string
    price: number
    quantity: number
    specialInstructions?: string
    subtotal: string
  }>
  total: string
  customerName: string
  phoneNumber?: string
  generalInstructions?: string
  status: string
  paymentStatus: string
  timestamp: string
  date: string
}

interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  description: string
  image?: string
}

interface TodaysSpecial {
  id: number
  specialId: string
  name: string
  price: number
  category: string
  description: string
  image?: string
}

const menuItems: MenuItem[] = [
  // Tea Items
  { id: 1, name: "Normal Tea", price: 15, category: "Tea", description: "Classic Indian tea" },
  { id: 2, name: "Black Tea", price: 15, category: "Tea", description: "Pure black tea" },
  { id: 3, name: "Masala Tea", price: 22, category: "Tea", description: "Traditional spiced tea" },
  { id: 4, name: "Special Masala Tea", price: 25, category: "Tea", description: "Premium spiced tea" },
  { id: 5, name: "Elachi Tea", price: 22, category: "Tea", description: "Cardamom flavored tea" },
  { id: 6, name: "Ginger Tea", price: 22, category: "Tea", description: "Fresh ginger tea" },
  { id: 7, name: "Green Tea", price: 25, category: "Tea", description: "Healthy green tea" },
  { id: 8, name: "Green Tea with Honey", price: 29, category: "Tea", description: "Green tea with natural honey" },
  { id: 9, name: "Honey Lemon Tea", price: 25, category: "Tea", description: "Refreshing honey lemon tea" },
  { id: 10, name: "Chocolate Tea", price: 29, category: "Tea", description: "Chocolate flavored tea" },
  { id: 11, name: "Kashmiri Kahwa", price: 49, category: "Tea", description: "Traditional Kashmiri tea" },

  // Coffee Items
  { id: 12, name: "Black Coffee", price: 20, category: "Coffee", description: "Pure black coffee" },
  { id: 13, name: "Milk Coffee", price: 22, category: "Coffee", description: "Coffee with milk" },
  { id: 14, name: "Special Filter Coffee", price: 22, category: "Coffee", description: "South Indian filter coffee" },
  { id: 15, name: "Jaggery Coffee", price: 22, category: "Coffee", description: "Coffee sweetened with jaggery" },
  { id: 16, name: "Chocolate Coffee", price: 29, category: "Coffee", description: "Coffee with chocolate" },
  { id: 17, name: "Belgian Coffee", price: 90, category: "Coffee", description: "Premium Belgian coffee" },
  { id: 18, name: "Coffee On The Rocks", price: 90, category: "Coffee", description: "Iced coffee" },
  { id: 19, name: "Ferrero Coffee", price: 90, category: "Coffee", description: "Ferrero flavored coffee" },
  { id: 20, name: "Hard Rock Coffee", price: 80, category: "Coffee", description: "Strong coffee blend" },
  { id: 21, name: "Mud Coffee", price: 100, category: "Coffee", description: "Rich mud coffee" },
  { id: 22, name: "Turkish Coffee", price: 90, category: "Coffee", description: "Traditional Turkish coffee" },

  // Juices & Beverages
  { id: 23, name: "Fresh Lime", price: 35, category: "Juice", description: "Fresh lime juice" },
  { id: 24, name: "Ginger Lime", price: 40, category: "Juice", description: "Ginger lime juice" },
  { id: 25, name: "Jaljeera", price: 35, category: "Juice", description: "Cumin flavored drink" },
  { id: 26, name: "Watermelon", price: 29, category: "Juice", description: "Fresh watermelon juice" },
  { id: 27, name: "Water Melon", price: 50, category: "Juice", description: "Premium watermelon juice" },
  { id: 28, name: "Pineapple", price: 50, category: "Juice", description: "Fresh pineapple juice" },
  { id: 29, name: "Mango", price: 49, category: "Juice", description: "Fresh mango juice" },
  { id: 30, name: "Mango Alphonso", price: 70, category: "Juice", description: "Premium Alphonso mango" },
  { id: 31, name: "Banana", price: 60, category: "Juice", description: "Fresh banana shake" },
  { id: 32, name: "Chickoo", price: 60, category: "Juice", description: "Fresh chickoo shake" },
  { id: 33, name: "Musk Melon", price: 60, category: "Juice", description: "Fresh musk melon juice" },
  { id: 34, name: "Avocado", price: 80, category: "Juice", description: "Fresh avocado shake" },

  // Milkshakes & Shakes
  { id: 35, name: "Badam Milk", price: 49, category: "Shakes", description: "Almond milk shake" },
  { id: 36, name: "Boost Milk", price: 39, category: "Shakes", description: "Boost flavored milk" },
  { id: 37, name: "Cold Boost", price: 29, category: "Shakes", description: "Cold boost drink" },
  { id: 38, name: "Cold Bournvita", price: 29, category: "Shakes", description: "Cold Bournvita drink" },
  { id: 39, name: "Horlicks Milk", price: 39, category: "Shakes", description: "Horlicks milk shake" },
  { id: 40, name: "Hot Chocolate Milk", price: 49, category: "Shakes", description: "Hot chocolate milk" },
  { id: 41, name: "Pilani Milk", price: 35, category: "Shakes", description: "Pilani special milk" },
  { id: 42, name: "Butter Milk", price: 20, category: "Shakes", description: "Traditional buttermilk" },
  { id: 43, name: "Nutella Shake", price: 100, category: "Shakes", description: "Nutella flavored shake" },
  { id: 44, name: "Dry Fruit Shake", price: 100, category: "Shakes", description: "Mixed dry fruit shake" },
  { id: 45, name: "Berry Blue Berry Shake", price: 90, category: "Shakes", description: "Blueberry shake" },
  { id: 46, name: "Natural Protein", price: 90, category: "Shakes", description: "Natural protein shake" },
  { id: 47, name: "Whey Protein", price: 100, category: "Shakes", description: "Whey protein shake" },

  // Ice Cream & Desserts
  { id: 48, name: "Ice Cream Scoop", price: 20, category: "Ice Cream", description: "Single ice cream scoop" },
  { id: 49, name: "Vanilla Shoo Shoo", price: 45, category: "Ice Cream", description: "Vanilla ice cream special" },
  {
    id: 50,
    name: "Strawberry Shoo Shoo",
    price: 45,
    category: "Ice Cream",
    description: "Strawberry ice cream special",
  },
  { id: 51, name: "Chocolate Ice Cream", price: 49, category: "Ice Cream", description: "Rich chocolate ice cream" },
  {
    id: 52,
    name: "Madagascar Ice Cream",
    price: 49,
    category: "Ice Cream",
    description: "Madagascar vanilla ice cream",
  },
  {
    id: 53,
    name: "Red Velvet Ice Cream",
    price: 49,
    category: "Ice Cream",
    description: "Red velvet flavored ice cream",
  },
  { id: 54, name: "Butterscotch", price: 49, category: "Ice Cream", description: "Butterscotch ice cream" },
  { id: 55, name: "Chocolate", price: 49, category: "Ice Cream", description: "Chocolate ice cream" },
  { id: 56, name: "Malai Kulfi", price: 45, category: "Ice Cream", description: "Traditional malai kulfi" },
  { id: 57, name: "Punjab Kulfi", price: 45, category: "Ice Cream", description: "Punjab style kulfi" },

  // Food Items
  { id: 81, name: "Veg Sandwich", price: 59, category: "Food", description: "Fresh vegetable sandwich" },
  { id: 82, name: "Veg Grilled Sandwich", price: 79, category: "Food", description: "Grilled vegetable sandwich" },
  { id: 83, name: "Cheese Grilled Sandwich", price: 99, category: "Food", description: "Cheese grilled sandwich" },
  { id: 84, name: "Corn Cheese Sandwich", price: 99, category: "Food", description: "Corn cheese sandwich" },
  { id: 85, name: "Corn Peri Peri Sandwich", price: 79, category: "Food", description: "Corn peri peri sandwich" },
  { id: 86, name: "Paneer Sandwich", price: 99, category: "Food", description: "Paneer sandwich" },
  { id: 87, name: "Paneer Nutella Sandwich", price: 99, category: "Food", description: "Paneer nutella sandwich" },
  {
    id: 88,
    name: "Choco Peanut Nutella Sandwich",
    price: 99,
    category: "Food",
    description: "Chocolate peanut nutella sandwich",
  },
  {
    id: 89,
    name: "Mexican Peri Peri Sandwich",
    price: 99,
    category: "Food",
    description: "Mexican peri peri sandwich",
  },
  { id: 90, name: "Egg Sandwich", price: 79, category: "Food", description: "Egg sandwich" },

  // Bread Items
  { id: 91, name: "Bread Butter Jam", price: 39, category: "Food", description: "Bread with butter and jam" },
  { id: 92, name: "Bread Omelette", price: 59, category: "Food", description: "Bread with omelette" },
  { id: 93, name: "Bread Mayo Omelette", price: 69, category: "Food", description: "Bread with mayo omelette" },
  { id: 94, name: "Bun Butter Jam", price: 29, category: "Food", description: "Bun with butter and jam" },
  { id: 95, name: "Bun Muska", price: 39, category: "Food", description: "Bun muska" },

  // Pizza
  {
    id: 96,
    name: "Double Cheese Margherita",
    price: 139,
    category: "Food",
    description: "Double cheese margherita pizza",
  },
  { id: 97, name: "Corn Cheese Pizza", price: 109, category: "Food", description: "Corn cheese pizza" },
  { id: 98, name: "Paneer Cheese Pizza", price: 119, category: "Food", description: "Paneer cheese pizza" },
  { id: 99, name: "Chilli Paneer Pizza", price: 119, category: "Food", description: "Chilli paneer pizza" },
  { id: 100, name: "Mexican Pizza", price: 109, category: "Food", description: "Mexican style pizza" },
  { id: 101, name: "Italian Pizza", price: 109, category: "Food", description: "Italian style pizza" },
  { id: 102, name: "Greek Pizza", price: 139, category: "Food", description: "Greek style pizza" },

  // Snacks
  { id: 118, name: "Classic Fries", price: 79, category: "Snacks", description: "Classic french fries" },
  { id: 119, name: "Masala Fries", price: 79, category: "Snacks", description: "Masala seasoned fries" },
  { id: 120, name: "Peri Peri Fries", price: 79, category: "Snacks", description: "Peri peri fries" },
  { id: 121, name: "Lemon Fries", price: 79, category: "Snacks", description: "Lemon seasoned fries" },
  { id: 122, name: "Loaded Cheese Fries", price: 119, category: "Snacks", description: "Loaded cheese fries" },
  { id: 123, name: "Loaded Peri Peri Fries", price: 99, category: "Snacks", description: "Loaded peri peri fries" },
  { id: 124, name: "Loaded Tikka Fries", price: 119, category: "Snacks", description: "Loaded tikka fries" },
  { id: 125, name: "Paneer Fries", price: 119, category: "Snacks", description: "Paneer fries" },
  { id: 126, name: "Potato Wedges", price: 79, category: "Snacks", description: "Potato wedges" },
  { id: 127, name: "Potato Bites", price: 79, category: "Snacks", description: "Potato bites" },
  { id: 128, name: "Crispy Corn", price: 79, category: "Snacks", description: "Crispy corn" },
]

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "zish2026",
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [todaysSpecials, setTodaysSpecials] = useState<TodaysSpecial[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  })
  const [loadingStats, setLoadingStats] = useState(false)
  const { toast } = useToast()

  // Check if already logged in on component mount
  useEffect(() => {
    const savedLoginState = localStorage.getItem("adminLoggedIn")
    if (savedLoginState === "true") {
      setIsLoggedIn(true)
    }
  }, [])

  // Load data from localStorage when logged in
  useEffect(() => {
    if (isLoggedIn) {
      const loadStats = async () => {
        try {
          setLoadingStats(true)
          const apiStats = await fetchOrderStats()
          setStats((prev) => ({
            totalOrders: apiStats.orders_today ?? prev.totalOrders,
            totalRevenue: apiStats.daily_revenue ?? prev.totalRevenue,
            pendingOrders: apiStats.pending_orders ?? prev.pendingOrders,
            completedOrders: apiStats.completed_orders ?? prev.completedOrders,
          }))
        } catch (error) {
          console.error('Failed to fetch stats:', error)
          // Fallback to localStorage stats on error
          const savedOrders = JSON.parse(localStorage.getItem("cafeOrders") || "[]")
          const totalOrders = savedOrders?.length || 0
          const totalRevenue = savedOrders?.reduce((sum: number, order: Order) => {
            const orderTotal = order?.total ? Number.parseFloat(order.total) : 0
            return sum + orderTotal
          }, 0) || 0
          const pendingOrders = savedOrders?.filter((order: Order) => order?.status === "pending")?.length || 0
          const completedOrders = savedOrders?.filter((order: Order) => order?.status === "completed")?.length || 0

          setStats({
            totalOrders,
            totalRevenue,
            pendingOrders,
            completedOrders,
          })
        } finally {
          setLoadingStats(false)
        }
      }

      loadStats()
      
      // Still load orders and specials from localStorage
      const savedOrders = JSON.parse(localStorage.getItem("cafeOrders") || "[]")
      const savedSpecials = JSON.parse(localStorage.getItem("todaysSpecials") || "[]")
      setOrders(savedOrders)
      setTodaysSpecials(savedSpecials)
    }
  }, [isLoggedIn])

  // Note: stats are fetched in the effect above; no duplicate calls

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    if (loginUsername === ADMIN_CREDENTIALS.username && loginPassword === ADMIN_CREDENTIALS.password) {
      setIsLoggedIn(true)
      localStorage.setItem("adminLoggedIn", "true")
      setLoginUsername("")
      setLoginPassword("")
      toast({
        title: "Login Successful",
        description: "Welcome to Zish Cafe Admin Panel",
      })
    } else {
      setLoginError("Invalid username or password")
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    }
  }

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    setOrders(updatedOrders)
    localStorage.setItem("cafeOrders", JSON.stringify(updatedOrders))

    // Recalculate stats
    const pendingOrders = updatedOrders.filter((order: Order) => order?.status === "pending")?.length || 0
    const completedOrders = updatedOrders.filter((order: Order) => order?.status === "completed")?.length || 0
    setStats((prev) => ({ ...prev, pendingOrders, completedOrders }))

    toast({
      title: "Order Updated",
      description: `Order #${orderId.slice(-6)} status changed to ${newStatus}`,
    })
  }

  const updatePaymentStatus = (orderId: string, newPaymentStatus: string) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order,
    )
    setOrders(updatedOrders)
    localStorage.setItem("cafeOrders", JSON.stringify(updatedOrders))

    toast({
      title: "Payment Updated",
      description: `Order #${orderId.slice(-6)} payment status changed to ${newPaymentStatus}`,
    })
  }

  const addTodaysSpecials = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to add as today's specials",
        variant: "destructive",
      })
      return
    }

    const selectedMenuItems = menuItems.filter((item) => selectedItems.includes(item.id.toString()))
    const newSpecials = selectedMenuItems.map((item) => ({
      ...item,
      specialId: `special_${Date.now()}_${item.id}`,
    }))

    const updatedSpecials = [...todaysSpecials, ...newSpecials]
    setTodaysSpecials(updatedSpecials)
    localStorage.setItem("todaysSpecials", JSON.stringify(updatedSpecials))
    setSelectedItems([])

    toast({
      title: "Specials Added",
      description: `${selectedMenuItems.length} item(s) added to today's specials`,
    })
  }

  const removeTodaysSpecial = (specialId: string) => {
    const updatedSpecials = todaysSpecials.filter((special) => special.specialId !== specialId)
    setTodaysSpecials(updatedSpecials)
    localStorage.setItem("todaysSpecials", JSON.stringify(updatedSpecials))

    toast({
      title: "Special Removed",
      description: "Item removed from today's specials",
    })
  }

  const clearAllSpecials = () => {
    setTodaysSpecials([])
    localStorage.setItem("todaysSpecials", JSON.stringify([]))

    toast({
      title: "All Specials Cleared",
      description: "All today's specials have been removed",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "preparing":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-green-200 text-green-900"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid cash":
        return "bg-green-100 text-green-800"
      case "paid upi":
        return "bg-blue-100 text-blue-800"
      case "unpaid":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusButtonVariant = (currentStatus: string, buttonStatus: string) => {
    return currentStatus === buttonStatus ? "default" : "outline"
  }

  const getStatusButtonClass = (currentStatus: string, buttonStatus: string) => {
    if (currentStatus === buttonStatus) {
      switch (buttonStatus) {
        case "pending":
          return "bg-yellow-500 hover:bg-yellow-600 text-white"
        case "preparing":
          return "bg-blue-500 hover:bg-blue-600 text-white"
        case "ready":
          return "bg-green-500 hover:bg-green-600 text-white"
        case "completed":
          return "bg-green-600 hover:bg-green-700 text-white"
        case "cancelled":
          return "bg-red-500 hover:bg-red-600 text-white"
        default:
          return ""
      }
    }
    return "hover:bg-gray-50"
  }

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Coffee className="h-8 w-8 text-amber-600" />
              <span className="text-2xl font-bold text-amber-600">Zish Cafe</span>
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5 text-amber-600" />
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              {loginError && <div className="text-red-600 text-sm text-center">{loginError}</div>}
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Zish Cafe Admin</h1>
              <p className="text-gray-600">Manage orders and today's specials</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Home className="h-4 w-4" />
                  Visit Website
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Coffee className="h-8 w-8 text-amber-600" />
                <span className="text-xl font-semibold text-amber-600">Admin Panel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Specials Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Manage Today's Specials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Specials */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Add Items to Today's Specials</Label>
              <div className="space-y-4">
                <MultiSelectDropdown
                  options={menuItems}
                  selectedIds={selectedItems}
                  onSelectionChange={setSelectedItems}
                  placeholder="Select menu items for today's specials..."
                />
                <div className="flex gap-3">
                  <Button onClick={addTodaysSpecials} className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Selected Items
                  </Button>
                  {todaysSpecials.length > 0 && (
                    <Button
                      onClick={clearAllSpecials}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Specials
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Current Specials */}
            {todaysSpecials.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Current Today's Specials ({todaysSpecials.length})
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todaysSpecials.map((special) => (
                    <div
                      key={special.specialId}
                      className="border rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{special.name}</h4>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {special.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-600">₹{special.price}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTodaysSpecial(special.specialId)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{special.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Orders Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Coffee className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders Yet</h3>
                <p className="text-gray-500">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-6 bg-white shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">Order #{order.id.slice(-6)}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p>
                              <strong>Customer:</strong> {order.customerName || "N/A"}
                            </p>
                            {order.phoneNumber && (
                              <p>
                                <strong>Phone:</strong> {order.phoneNumber}
                              </p>
                            )}
                          </div>
                          <div>
                            <p>
                              <strong>Date:</strong> {order.date || "N/A"}
                            </p>
                            <p>
                              <strong>Total:</strong>{" "}
                              <span className="font-semibold text-amber-600">₹{order.total || "0"}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Order Items:</h4>
                      <div className="space-y-2">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{item.name || "Unknown Item"}</span>
                                <span className="text-gray-500 ml-2">x{item.quantity || 0}</span>
                                {item.specialInstructions && (
                                  <div className="text-xs text-blue-600 mt-1">Note: {item.specialInstructions}</div>
                                )}
                              </div>
                              <span className="font-semibold text-amber-600">₹{item.subtotal || "0"}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm">No items found</div>
                        )}
                      </div>
                    </div>

                    {/* General Instructions */}
                    {order.generalInstructions && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-amber-600" />
                          Special Instructions:
                        </h4>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-gray-700 text-sm">{order.generalInstructions}</p>
                        </div>
                      </div>
                    )}

                    {/* Status Buttons and Payment Dropdown */}
                    <div className="space-y-4">
                      {/* Status Buttons */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Order Status:</Label>
                        <div className="flex flex-wrap gap-2">
                          {["pending", "preparing", "ready", "completed", "cancelled"].map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={getStatusButtonVariant(order.status, status)}
                              className={`${getStatusButtonClass(order.status, status)} text-xs`}
                              onClick={() => updateOrderStatus(order.id, status)}
                            >
                              {getStatusIcon(status)}
                              <span className="ml-1 capitalize">{status}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Payment Dropdown */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Payment Status:</Label>
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid cash">Paid Cash</option>
                          <option value="paid upi">Paid UPI</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

