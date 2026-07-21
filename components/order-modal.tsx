"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingCart, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { placeOrder } from "@/lib/order-api"
import type { OrderSubmission } from "@/lib/types"
import { OrderSuccessPopup } from "./order-success-popup"

interface CartItem {
  id: string
  cartId: string
  name: string
  price: number
  image: string
  quantity: number
  specialInstructions?: string
}

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  clearCart: () => void
  onSuccess?: (data: { id: string; totalAmount: number }) => void
}

// Validation functions
const validateEmail = (email: string): string | null => {
  if (!email.trim()) return null // Optional field
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address"
  }
  return null
}

const validatePhoneNumber = (phone: string): string | null => {
  if (!phone.trim()) return null // Optional field
  
  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length < 10) {
    return "Phone number must be at least 10 digits"
  }
  if (cleanPhone.length > 15) {
    return "Phone number cannot exceed 15 digits"
  }
  
  return null
}

export function OrderModal({ isOpen, onClose, cart, clearCart, onSuccess }: OrderModalProps) {
  console.log('OrderModal props received:', { isOpen, onSuccess: typeof onSuccess, onSuccessExists: !!onSuccess })
  
  // No more callback complexity - we handle everything directly!
  
  const [customerName, setCustomerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [generalInstructions, setGeneralInstructions] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Validation error states
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  
  // Direct popup state (the ONLY popup we need)
  const [showPopup, setShowPopup] = useState(false)
  const [popupData, setPopupData] = useState<{id: string, totalAmount: number} | null>(null)
  
  const { toast } = useToast()

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Real-time validation handlers
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomerEmail(value)
    setEmailError(validateEmail(value))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhoneNumber(value)
    setPhoneError(validatePhoneNumber(value))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomerName(value)
    if (!value.trim()) {
      setNameError("Customer name is required")
    } else if (value.trim().length < 2) {
      setNameError("Name must be at least 2 characters")
    } else {
      setNameError(null)
    }
  }

  // Validate all fields before submission
  const validateForm = (): boolean => {
    let isValid = true

    // Validate name (required)
    if (!customerName.trim()) {
      setNameError("Customer name is required")
      isValid = false
    } else if (customerName.trim().length < 2) {
      setNameError("Name must be at least 2 characters")
      isValid = false
    }

    // Validate email (optional but must be valid if provided)
    const emailValidationError = validateEmail(customerEmail)
    setEmailError(emailValidationError)
    if (emailValidationError) isValid = false

    // Validate phone (optional but must be valid if provided)
    const phoneValidationError = validatePhoneNumber(phoneNumber)
    setPhoneError(phoneValidationError)
    if (phoneValidationError) isValid = false

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before submitting",
        variant: "destructive",
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare order data
      console.log('Cart items before processing:', cart.map(item => ({ id: item.id, name: item.name, type: typeof item.id })));
      
      const orderData: OrderSubmission = {
        customerName: customerName.trim(),
        customerPhone: phoneNumber.trim() || "Not provided",
        customerEmail: customerEmail.trim() || "Not provided",
        items: cart.map(item => {
          const menuItemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
          console.log(`Processing item: ${item.name}, original id: ${item.id} (${typeof item.id}), converted id: ${menuItemId}`);
          return {
            menuItemId: menuItemId,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions || ""
          };
        }),
        specialInstructions: generalInstructions.trim() || ""
      }

      console.log('Submitting order:', orderData)

      const response = await placeOrder(orderData)
      console.log('placeOrder returned:', response)

      // Show success popup immediately
      console.log('Order placed successfully!')
      const orderInfo = {
        id: response.id.toString(),
        totalAmount: response.totalAmount
      };
      console.log('Showing popup with order info:', orderInfo)
      
      setPopupData(orderInfo)
      setShowPopup(true)
      console.log('SUCCESS POPUP STATE SET TO TRUE - POPUP SHOULD APPEAR NOW!')

      // Reset form and clear cart, but don't close modal yet
      resetForm()
      // clearCart()  // <-- REMOVE THIS LINE
      // onClose() will be called when success modal is closed
      
    } catch (error) {
      console.error('Order submission error:', error);
      
      // More specific error handling
      let errorMessage = 'Failed to place order. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('not available')) {
          errorMessage = 'Some items in your cart are no longer available. Please refresh your cart and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCustomerName("")
    setPhoneNumber("")
    setCustomerEmail("")
    setGeneralInstructions("")
    setEmailError(null)
    setPhoneError(null)
    setNameError(null)
  }

  const handlePopupClose = () => {
    console.log('Popup closed by user')
    setShowPopup(false)
    setPopupData(null)
    // Clear cart when popup is closed
    clearCart()
    // Close the parent order modal after popup is closed
    onClose()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Debug current modal states
  console.log('OrderModal render:', { isOpen, showPopup, popupData })

  return (
    <>
      <Dialog
        open={isOpen && !showPopup}
        onOpenChange={(open) => {
          // Only allow parent close when popup is NOT being shown
          if (!showPopup) {
            if (!open) handleClose()
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ShoppingCart className="h-5 w-5" />
              Checkout ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})
            </DialogTitle>
          </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Order Summary</h3>
            <div className="max-h-40 overflow-y-auto space-y-3 border rounded-lg p-4 bg-orange-50">
              {cart.map((item) => (
                <div key={item.cartId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={item.image || "/placeholder.jpg"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        ₹{item.price} × {item.quantity}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-xs text-blue-600 italic">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-orange-600">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t font-bold text-lg">
              <span>Total:</span>
              <span className="text-orange-600">₹{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <Label htmlFor="customerName" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                type="text"
                value={customerName}
                onChange={handleNameChange}
                placeholder="Enter your full name"
                className={`mt-2 ${nameError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
                autoComplete="off"
              />
              {nameError && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{nameError}</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Phone Number (Optional)
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="123-456-7890"
                className={`mt-2 ${phoneError ? 'border-red-500 focus:border-red-500' : ''}`}
                autoComplete="off"
              />
              {phoneError && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{phoneError}</span>
                </div>
              )}
              {!phoneError && phoneNumber && (
                <p className="text-xs text-green-600 mt-1">✓ Valid phone number</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="customerEmail" className="text-sm font-medium">
                Email (Optional)
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={handleEmailChange}
                placeholder="your.email@example.com"
                className={`mt-2 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
                autoComplete="off"
              />
              {emailError && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
              {!emailError && customerEmail && (
                <p className="text-xs text-green-600 mt-1">✓ Valid email address</p>
              )}
            </div>

            {/* Special Instructions */}
            <div>
              <Label htmlFor="generalInstructions" className="text-sm font-medium">
                General Instructions (Optional)
              </Label>
              <Textarea
                id="generalInstructions"
                value={generalInstructions}
                onChange={(e) => setGeneralInstructions(e.target.value)}
                placeholder="Any general requests or dietary requirements for your entire order..."
                className="mt-2 resize-none"
                rows={3}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              id="cancelOrderBtn"
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              id="placeOrderBtn"
              type="submit"
              className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white font-medium"
              disabled={isSubmitting || !!nameError || !!emailError || !!phoneError}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                `Place Order - ₹${getTotalPrice().toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* SUCCESS POPUP - THE ONLY ONE WE NEED */}
    <OrderSuccessPopup
      open={showPopup}
      onClose={handlePopupClose}
      orderId={popupData?.id}
      totalAmount={popupData?.totalAmount}
    />
  </>
  )
}
