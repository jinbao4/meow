"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Github } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative w-full">
      {/* Subtle fancy background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 via-background to-yellow-100/20 dark:from-yellow-900/20 dark:via-background dark:to-yellow-900/20 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMGYwZjAiPjwvcmVjdD4KPC9zdmc+')] opacity-20 dark:opacity-10"></div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-yellow-100/40 dark:border-yellow-900/40 backdrop-blur-md bg-background/80 dark:bg-background/60 supports-[backdrop-filter]:bg-background/50 dark:supports-[backdrop-filter]:bg-background/40">
        <div className="container mx-auto flex h-16 items-center justify-between relative z-10 px-4">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-300 dark:to-yellow-500 flex items-center justify-center shadow-md shadow-yellow-400/20 dark:shadow-yellow-500/20">
              <span className="text-white dark:text-black font-bold text-xs">GH</span>
            </div>
            <Link href="/" className="relative group">
              <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-800 dark:from-yellow-300 dark:to-yellow-500">
                Gilhook
              </span>
              <span className="absolute inset-0 rounded-md blur-md opacity-0 group-hover:opacity-100 transition duration-300 bg-yellow-400/20 dark:bg-yellow-600/20"></span>
            </Link>
          </div>

          {/* Github and Theme toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full hover:bg-yellow-100/40 dark:hover:bg-yellow-900/40 transition-all"
            >
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100/40 dark:hover:bg-yellow-900/40 transition-all"
            >
              {mounted && theme === "dark" ?  (
                <SunIcon className="h-[1.3rem] w-[1.3rem] text-yellow-300" />
              ) : (
                <MoonIcon className="h-[1.3rem] w-[1.3rem] text-yellow-600" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>

        {/* Decorative line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-yellow-400/40 dark:via-yellow-500/40 to-transparent"></div>
      </header>
    </div>
  )
}
