"use client"

import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderSuccessPopupProps {
  open: boolean
  onClose: () => void
  orderId?: string
  totalAmount?: number
}

export function OrderSuccessPopup({ open, onClose, orderId, totalAmount }: OrderSuccessPopupProps) {
  console.log('OrderSuccessPopup render:', { open, orderId, totalAmount })
  
  if (!open) {
    console.log('OrderSuccessPopup not rendering - open is false')
    return null
  }
  
  console.log('OrderSuccessPopup rendering popup')

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[90vw] max-w-md rounded-2xl bg-white shadow-2xl border border-amber-200 p-6 animate-in fade-in zoom-in-95" style={{ zIndex: 10000 }}>
        {/* Close */}
        <button
          id="closeOrderSuccessPopupBtn"
          aria-label="Close"
          className="absolute right-3 top-3 p-2 rounded-md hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Thank you for your order!</h2>
          <p className="text-gray-600">Please visit the counter to make the payment.</p>

          {(orderId || totalAmount) && (
            <div className="bg-gray-50 rounded-lg p-4 w-full text-sm">
              {orderId && (
                <div className="flex justify-between"><span className="text-gray-600">Order ID:</span><span className="font-semibold">#{orderId}</span></div>
              )}
              {totalAmount !== undefined && (
                <div className="flex justify-between mt-2"><span className="text-gray-600">Total Amount:</span><span className="font-semibold text-green-600">₹{totalAmount}</span></div>
              )}
            </div>
          )}

          <Button id="orderSuccessGotItBtn" className="w-full bg-green-600 hover:bg-green-700" onClick={onClose}>
            Got it, thanks!
          </Button>
        </div>
      </div>
    </div>
  )
}


