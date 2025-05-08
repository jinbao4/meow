"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Github } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon, LifeBuoy } from "lucide-react"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (!mounted) return
    if (theme === "light") setTheme("dark")
    else setTheme("light")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-yellow-200/20 dark:border-yellow-800/30 bg-[#1f1f23]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-sm shadow-sm">
            GH
          </div>
          <span className="text-lg font-bold text-yellow-400 tracking-tight">Gilhook</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-yellow-100/10 dark:hover:bg-yellow-900/30 transition"
          >
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-yellow-100/10 dark:hover:bg-yellow-900/30 transition"
          >
            <Link href="https://guilded.gg/sparkles" target="_blank" rel="noopener noreferrer">
              <LifeBuoy className="h-5 w-5" />
              <span className="sr-only">Support Server</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-yellow-100/10 dark:hover:bg-yellow-900/30 transition"
          >
            {mounted && theme === "dark" ? (
              <SunIcon className="h-5 w-5 text-yellow-300" />
            ) : (
              <MoonIcon className="h-5 w-5 text-yellow-600" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
