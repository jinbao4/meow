"use client"

import { Header } from "@/components/header"
import { EmbedEditor } from "@/components/embed"
import { ThemeProvider } from "@/components/theme-provider"
import { SafetyInfo } from "@/components/safety-info"

export default function Home() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="gilhook-theme">
      <div className="min-h-screen bg-[#121214] text-white flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-4">
          <EmbedEditor />
        </main>
        <footer className="w-full border-t border-yellow-800/20 py-3 text-center text-xs text-muted-foreground">
          <div className="container mx-auto flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <SafetyInfo />
              <a href="#" className="text-xs hover:text-yellow-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-xs hover:text-yellow-400 transition-colors">
                Contact
              </a>
            </div>
            <div>© {new Date().getFullYear()} Gilhook. Built for the Guilded community.</div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}
