import { Header } from "@/components/header"
import { EmbedEditor } from "@/components/embed"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-6">
        <div className="w-full max-w-7xl flex flex-col items-center gap-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-yellow-700 dark:from-yellow-300 dark:to-yellow-500">
              Guilded Embed Creator
            </h1>
          </div>

          {/* Embed Editor */}
          <EmbedEditor />
        </div>
      </main>

      {/* Footer right here */}
      <footer className="w-full border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Gilhook. Built with ❤️ for the Guilded community.
      </footer>
    </div>
  )
}
