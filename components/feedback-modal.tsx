"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, MessageSquare, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { submitFeedback } from "@/lib/feedback-api"
import type { FeedbackSubmission } from "@/lib/types"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [fullName, setFullName] = useState("")
  const [emailAddress, setEmailAddress] = useState("")
  const [feedback, setFeedback] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Only validate email format if email is provided
    if (emailAddress.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      newErrors.emailAddress = "Please enter a valid email address"
    }

    // Only rating is required
    if (rating === 0) {
      newErrors.rating = "Please provide a rating"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const feedbackData: FeedbackSubmission = {
        rating,
        customerName: fullName.trim() || undefined,
        email: emailAddress.trim() || undefined,
        feedback: feedback.trim() || undefined,
      }

      await submitFeedback(feedbackData)

      toast({
        title: "Thank you for your feedback!",
        description: "Your feedback helps us improve our service.",
      })

      // Reset form
      setRating(0)
      setHoveredRating(0)
      setFullName("")
      setEmailAddress("")
      setFeedback("")
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const handleCancel = () => {
    // Reset form when canceling
    setRating(0)
    setHoveredRating(0)
    setFullName("")
    setEmailAddress("")
    setFeedback("")
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0">
        {/* Header - Removed the manual close button */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-orange-600" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="emailAddress" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="emailAddress"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full ${errors.emailAddress ? "border-red-500" : ""}`}
              disabled={isSubmitting}
            />
            {errors.emailAddress && (
              <p className="text-sm text-red-500">{errors.emailAddress}</p>
            )}
          </div>

          {/* Rate Your Experience */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Rate Your Experience <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  id={`starRating-${star}-Btn`}
                  type="button"
                  className={`p-1 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-amber-400"
                      : "text-gray-300 hover:text-amber-200"
                  }`}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                >
                  <Star className="h-7 w-7 fill-current" />
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-sm text-red-500">{errors.rating}</p>}
          </div>

          {/* Your Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-medium text-gray-700">
              Your Feedback
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              disabled={isSubmitting}
              className="w-full resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              id="cancelFeedbackBtn"
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              id="submitFeedbackBtn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 