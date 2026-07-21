"use client"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

interface LocationPopupProps {
  isOpen: boolean
  onClose: () => void
  onEnableLocation: () => void
}

export function LocationPopup({ isOpen, onClose, onEnableLocation }: LocationPopupProps) {
  const handleOkClick = () => {
    onEnableLocation()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-200 border-0 p-0 rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only">Enable Location</DialogTitle>
        <DialogDescription className="sr-only">
          Please enable location access to use the order functionality
        </DialogDescription>
        <div className="bg-white rounded-2xl m-6 p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">
            Enable Location
          </h2>
          
          {/* Description */}
          <div className="space-y-3 text-gray-700">
            <p className="text-base leading-relaxed">
              Please enable the location to use the order functionality.
            </p>
          </div>
          
          {/* OK Button */}
          <Button
            id="enableLocationOkBtn"
            onClick={handleOkClick}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-4 rounded-lg transition-colors duration-200"
            size="lg"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
