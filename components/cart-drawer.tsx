"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react"
import { OrderModal } from "./order-modal"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
  cartId: string
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  specialInstructions?: string
}

interface CartDrawerProps {
  cart: CartItem[]
  updateQuantity: (cartId: string, quantity: number) => void
  removeFromCart: (cartId: string) => void
  clearCart: () => void
}

export function CartDrawer({ cart, updateQuantity, removeFromCart, clearCart }: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const { toast } = useToast()

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleClearCart = () => {
    clearCart()
    setIsOpen(false)
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart.",
    })
  }

  const handleCheckout = () => {
    console.log("Checkout clicked, cart:", cart)
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      })
      return
    }
    setIsOpen(false)
    setIsOrderModalOpen(true)
    console.log("Opening order modal")
  }

  const handleOrderModalClose = () => {
    setIsOrderModalOpen(false)
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <>
      {/* Compact Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-amber-600 text-white p-4 shadow-lg z-40 flex items-center justify-between">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <div className="flex items-center space-x-2 cursor-pointer flex-1">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">
                {getTotalItems()} Item{getTotalItems() !== 1 ? "s" : ""} | ₹{getTotalPrice().toFixed(2)}
              </span>
            </div>
          </SheetTrigger>
        </Sheet>

        <div className="flex items-center space-x-2">
          <Button id="clearCartBtn" variant="ghost" size="sm" onClick={handleClearCart} className="text-white hover:bg-amber-700 p-2">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            id="checkoutBarBtn"
            onClick={handleCheckout}
            className="bg-white text-amber-600 hover:bg-gray-100 font-medium px-6"
            type="button"
          >
            Checkout
          </Button>
        </div>
      </div>

      {/* Cart Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                <span>Your Cart ({getTotalItems()} items)</span>
              </div>
              {cart.length > 0 && (
                <Button
                  id="clearAllCartItemsBtn"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCart}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.cartId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-sm text-amber-600 font-semibold">₹{item.price}</p>
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 mt-1">Note: {item.specialInstructions}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            id={`decreaseQty-${item.cartId}-Btn`}
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.cartId, Math.max(0, item.quantity - 1))}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Badge variant="secondary" className="px-3 py-1">
                            {item.quantity}
                          </Badge>
                          <Button
                            id={`increaseQty-${item.cartId}-Btn`}
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            id={`removeItem-${item.cartId}-Btn`}
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.cartId)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-600">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-amber-600">₹{getTotalPrice().toFixed(2)}</span>
                  </div>

                  <Button
                    id="proceedToCheckoutBtn"
                    onClick={handleCheckout}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    size="lg"
                    type="button"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Order Modal */}
      <OrderModal isOpen={isOrderModalOpen} onClose={handleOrderModalClose} cart={cart} clearCart={clearCart} />
    </>
  )
} 