"use client"

import { useEffect } from "react"

interface PopupToastProps {
  message: string
  type?: "success" | "error"
  onClose: () => void
}

export function PopupToast({ message, type = "success", onClose }: PopupToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000) // Auto close after 4 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-4 text-white ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      <div className="flex-shrink-0">
        {type === "success" ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="font-bold">{type === "success" ? "Success" : "Error"}</p>
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-300"
      >
        ✕
      </button>
    </div>
  )
}
