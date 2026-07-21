"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface WrongPasswordModalProps {
  open: boolean
  onClose: () => void
}

export function WrongPasswordModal({ open, onClose }: WrongPasswordModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent aria-describedby="wrong-password-description" className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-red-600">Incorrect Username or Password</DialogTitle>
        </DialogHeader>
        <div id="wrong-password-description" className="space-y-4">
          <img
            src="/images/incorrect-password.jpg"
            alt="Incorrect password"
            className="w-full h-auto max-h-[50vh] object-contain rounded-lg mx-auto"
          />
          <p className="text-center text-sm text-gray-600">Please check your credentials and try again.</p>
          <Button id="closeWrongPasswordModalBtn" onClick={onClose} className="w-full bg-amber-600 hover:bg-amber-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
