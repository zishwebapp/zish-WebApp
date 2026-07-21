"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, Minus, Plus } from "lucide-react"

interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  description: string
  image?: string
}

interface MobileMenuSearchProps {
  menuItems: MenuItem[]
  categories: string[]
  cart: any[] // Add main cart state
  onAddToCart: (item: MenuItem) => void
  onUpdateQuantity: (item: MenuItem, newQuantity: number) => void // Add quantity update callback
  selectedCategory: string
  onCategoryChange: (category: string) => void
  locationAllowed: boolean // Add location state
  checkingLocation: boolean // Add checking location state
}

// Add the helper function at the top of the file
function isNonVegItem(itemName: string): boolean {
  const nonVegItems = [
    'chicken nuggets',
    'chicken tikki burger', 
    'peri peri chicken sandwich',
    'chicken grill sandwich',
    'chicken pizza (small)',
    'chicken pizza (medium)',
    'chicken pizza (large)',
    'chicken wings',
    'chicken pop corn',
    'chicken strips',
    'chicken cheese balls (3)',
    'chicken cheese balls (6)',
    'chicken cheese pizza (small)',
    'chicken cheese pizza (medium)',
    'chicken cheese pizza (large)',
    'zish signature platter'
  ]
  return nonVegItems.some(nonVegItem => 
    itemName.toLowerCase().includes(nonVegItem.toLowerCase())
  )
}

export function MobileMenuSearch({
  menuItems,
  categories,
  cart, // Use main cart instead of local state
  onAddToCart,
  onUpdateQuantity, // Use callback for quantity updates
  selectedCategory,
  onCategoryChange,
  locationAllowed, // Use location state
  checkingLocation, // Use checking location state
}: MobileMenuSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  // Remove local cart state - const [cart, setCart] = useState<{ [key: number]: number }>({})

  const filteredItems = menuItems.filter((item) => {
    // Global search filter - searches across all items regardless of category
    const searchTermLower = searchTerm.trim().toLowerCase()
    const searchMatch =
      !searchTermLower ||
      (item.name && item.name.toLowerCase().includes(searchTermLower)) ||
      (item.description && item.description.toLowerCase().includes(searchTermLower)) ||
      (item.category && item.category.toLowerCase().includes(searchTermLower))

    // If there's a search term, show all matching items regardless of category
    if (searchTerm.trim()) {
      return searchMatch
    }

    // If no search term, filter by selected category
    return item.category === selectedCategory
  })

  const handleAddToCart = (item: MenuItem) => {
    onAddToCart(item)
  }

  // Get quantity from main cart state
  const getItemQuantity = (itemId: number) => {
    const cartItem = cart.find((item) => item.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  const updateQuantity = (item: MenuItem, newQuantity: number) => {
    if (newQuantity >= 0) {  // Prevent negative quantities
      onUpdateQuantity(item, newQuantity);
    }
  }

  // Check if add to cart should be disabled
  const isAddToCartDisabled = !locationAllowed || checkingLocation

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/80 backdrop-blur-sm border-amber-200 focus:border-amber-400 rounded-xl"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            id={`mobileCategory-${category}-Btn`}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            className={`transition-all duration-300 font-medium px-4 py-2 rounded-full ${
              selectedCategory === category
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0"
                : "border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white bg-white/80 backdrop-blur-sm"
            }`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 font-medium">
        {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found
      </div>

      {/* Menu Items */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const quantity = getItemQuantity(item.id)
          return (
            <Card
              key={item.id}
              className="bg-white/80 backdrop-blur-sm border border-amber-200/50 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* Non-veg indicator */}
                        {isNonVegItem(item.name) && (
                          <div className="w-4 h-4 bg-white rounded-sm border border-red-500 flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs mt-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-0"
                      >
                        {item.category}
                      </Badge>
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      ₹{item.price}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                  {quantity > 0 ? (
                    <div className="flex items-center justify-center">
                      <div className="flex items-center bg-gray-800 rounded-lg p-1">
                        <Button
                          id={`mobileMenuItem-${item.id}-decreaseQtyBtn`}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-white hover:bg-gray-700 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item, quantity - 1);
                          }}
                          disabled={isAddToCartDisabled}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="mx-2 text-white font-semibold text-sm min-w-[1.5rem] text-center">
                          {quantity}
                        </span>
                        <Button
                          id={`mobileMenuItem-${item.id}-increaseQtyBtn`}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-white hover:bg-gray-700 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item, quantity + 1);
                          }}
                          disabled={isAddToCartDisabled}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      id={`mobileMenuItem-${item.id}-addToCartBtn`}
                      size="sm"
                      className={`w-full font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-0 ${
                        isAddToCartDisabled
                          ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400 hover:transform-none hover:shadow-md"
                          : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item);
                      }}
                      disabled={isAddToCartDisabled}
                    >
                      <ShoppingCart className="mr-1 h-3 w-3" />
                      {checkingLocation ? "Checking..." : "Add"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-amber-200 shadow-lg">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Items Found</h3>
              <p className="text-gray-500 text-sm mb-4">
                {searchTerm
                  ? `No items match "${searchTerm}" across all categories`
                  : `No items available in ${selectedCategory}`}
              </p>
              {searchTerm && (
                <Button
                  id="mobileClearSearchBtn"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white font-semibold px-4 py-2 rounded-full transition-all duration-300"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
