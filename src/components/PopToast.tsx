"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

interface PopupToastProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export function PopupToast({ message, type, onClose }: PopupToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow time for fade-out animation
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 p-3 rounded-md shadow-lg transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${type === "success" ? "bg-green-600" : "bg-red-600"} text-white z-50`}
    >
      {type === "success" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      <span>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="ml-2 p-1 rounded-full hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
