"use client"

import { useState } from "react"
import { Shield, Info, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function SafetyInfo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors underline underline-offset-2"
      >
        <Shield className="inline-block w-3 h-3 mr-1" />
        Safety & Privacy
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#2a2a32] border-[#3e3d45] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-[#F5C400]" /> Safety & Privacy Information
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Gilhook is designed with security and privacy as top priorities. Here's how we protect your data:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2 bg-[#1e1e24] p-4 rounded-md">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-[#F5C400]" /> Client-Side Processing
              </h3>
              <p className="text-gray-300 text-sm">
                All webhook requests are sent directly from your browser to Guilded. We never store or process your
                webhook URLs or data on any server.
              </p>
            </div>

            <div className="space-y-2 bg-[#1e1e24] p-4 rounded-md">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-[#F5C400]" /> No Middleman
              </h3>
              <p className="text-gray-300 text-sm">
                Unlike some other webhook tools, Gilhook never acts as a middleman for your requests. Your webhook
                content goes directly from your browser to Guilded's servers, eliminating security risks associated with
                third-party proxying.
              </p>
            </div>

            <div className="space-y-2 bg-[#1e1e24] p-4 rounded-md">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-[#F5C400]" /> Rate Limiting
              </h3>
              <p className="text-gray-300 text-sm">
                We implement client-side rate limiting to prevent abuse. You can send up to 5 webhook requests per
                minute. This helps protect both your account and Guilded's services from potential abuse.
              </p>
            </div>

            <div className="space-y-2 bg-[#1e1e24] p-4 rounded-md">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-[#F5C400]" /> Local Storage Only
              </h3>
              <p className="text-gray-300 text-sm">
                Your embeds and settings are saved only in your browser's local storage. Nothing is sent to our servers.
                This means your data stays on your device and is never transmitted elsewhere.
              </p>
            </div>

            <div className="space-y-2 bg-[#1e1e24] p-4 rounded-md">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-[#F5C400]" /> Open Source
              </h3>
              <p className="text-gray-300 text-sm">
                Gilhook is open source, meaning anyone can review the code to verify our security claims. We believe in
                transparency and community-driven development.
              </p>
              <a
                href="https://github.com/yourusername/gilhook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F5C400] hover:underline text-sm flex items-center mt-2"
              >
                <ExternalLink className="h-3 w-3 mr-1" /> View source code on GitHub
              </a>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} className="bg-[#F5C400] text-black hover:bg-[#D4A900] font-medium">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
