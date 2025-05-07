"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Pencil,
  FileText,
  AlignLeft,
  Send,
  Palette,
  Bookmark,
  Wand2,
  AlertTriangle,
  Star,
  Clock,
  Sparkles,
} from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { ColorPicker } from "@/components/ui/color-picker"
import { sendWebhook } from "@/lib/webhook"
import { PopupToast } from "@/components/PopToast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EmbedField {
  name: string
  value: string
  inline?: boolean
}

interface GuildedEmbed {
  title?: string
  description?: string
  url?: string
  color?: string
  timestamp?: string
  fields?: EmbedField[]
  author?: {
    name: string
    icon_url?: string
  }
  footer?: {
    text: string
  }
  image?: string
  thumbnail?: string
}

interface SavedEmbed {
  id: string
  name: string
  embed: GuildedEmbed
  createdAt: string
  isFavorite?: boolean
}

export function EmbedEditor() {
  const [embeds, setEmbeds] = useState<GuildedEmbed[]>([])
  const [content, setContent] = useState("")
  const [username, setUsername] = useState("Gilhook")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rawJson, setRawJson] = useState("")
  const [activeTab, setActiveTab] = useState("content")
  const [isSending, setIsSending] = useState(false)
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark")
  const [savedEmbeds, setSavedEmbeds] = useState<SavedEmbed[]>([])
  const [showSavedEmbeds, setShowSavedEmbeds] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<() => void | null>(() => null)
  const [saveEmbedName, setSaveEmbedName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [savedFilter, setSavedFilter] = useState<"all" | "favorites">("all")
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)

  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem("guilded_embed_data")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        if (parsed.embeds) setEmbeds(parsed.embeds)
        if (parsed.content) setContent(parsed.content)
        if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl)
        if (parsed.username) setUsername(parsed.username)
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl)
        if (parsed.lastSaved) setLastSavedTime(new Date(parsed.lastSaved))
        setHasUnsavedChanges(false)
      } catch (e) {
        console.error("Failed to load saved data", e)
      }
    }

    // Load saved embeds
    const savedEmbedsData = localStorage.getItem("guilded_saved_embeds")
    if (savedEmbedsData) {
      try {
        setSavedEmbeds(JSON.parse(savedEmbedsData))
      } catch (e) {
        console.error("Failed to load saved embeds", e)
      }
    }
  }, [])

  // Update JSON when data changes
  useEffect(() => {
    setRawJson(JSON.stringify({ content, embeds, username, avatar_url: avatarUrl }, null, 2))
    setHasUnsavedChanges(true)
  }, [content, embeds, username, avatarUrl])

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const updateEmbed = (index: number, field: string, value: any) => {
    setEmbeds((prev) => {
      const updated = [...prev]
      const parts = field.split(".")

      if (parts.length === 2) {
        const [parent, child] = parts
        const parentObject = (updated[index][parent as keyof GuildedEmbed] || {}) as any
        updated[index] = {
          ...updated[index],
          [parent]: {
            ...parentObject,
            [child]: value,
          },
        }
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        }
      }
      return updated
    })
  }

  function hexToDecimal(hex: string) {
    if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return hex
    return Number.parseInt(hex.replace("#", ""), 16)
  }

  function isValidUrl(url: string) {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const addEmbed = () => {
    setEmbeds((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        color: "#F5C400",
        timestamp: "",
        author: { name: "", icon_url: "" },
        footer: { text: "" },
        fields: [],
      },
    ])
    showPopup("New embed added", "success")
  }

  const removeEmbed = (index: number) => {
    setEmbeds((prev) => prev.filter((_, i) => i !== index))
    showPopup("Embed removed", "success")
  }

  const addField = (embedIndex: number) => {
    setEmbeds((prev) => {
      const updated = [...prev]
      updated[embedIndex] = {
        ...updated[embedIndex],
        fields: [...(updated[embedIndex].fields || []), { name: "", value: "", inline: false }],
      }
      return updated
    })
    showPopup("Field added", "success")
  }

  const removeField = (embedIndex: number, fieldIndex: number) => {
    setEmbeds((prev) => {
      const updated = [...prev]
      if (updated[embedIndex].fields) {
        updated[embedIndex] = {
          ...updated[embedIndex],
          fields: updated[embedIndex].fields?.filter((_, i) => i !== fieldIndex),
        }
      }
      return updated
    })
    showPopup("Field removed", "success")
  }

  const updateField = (embedIndex: number, fieldIndex: number, key: string, value: any) => {
    setEmbeds((prev) => {
      const updated = [...prev]
      if (!updated[embedIndex].fields) {
        updated[embedIndex].fields = []
      }
      const updatedFields = [...(updated[embedIndex].fields || [])]
      updatedFields[fieldIndex] = {
        ...updatedFields[fieldIndex],
        [key]: value,
      }
      updated[embedIndex] = {
        ...updated[embedIndex],
        fields: updatedFields,
      }
      return updated
    })
  }

  const copyJson = () => {
    // Convert hex colors to decimal for the copied JSON
    const payloadToExport = {
      content,
      embeds: embeds.map((embed) => ({
        ...embed,
        color: embed.color ? hexToDecimal(embed.color) : undefined,
      })),
      username,
      avatar_url: avatarUrl,
    }

    navigator.clipboard.writeText(JSON.stringify(payloadToExport, null, 2))
    showPopup("Copied JSON to clipboard!", "success")
  }

  const handleSend = async () => {
    if (!webhookUrl) {
      showPopup("Webhook URL is required!", "error")
      return
    }

    try {
      setIsSending(true)

      // Prepare payload with username and avatar if provided
      const payload: any = { content, embeds }
      if (username) payload.username = username
      if (avatarUrl) payload.avatar_url = avatarUrl

      await sendWebhook(webhookUrl, payload)
      showPopup("Webhook sent successfully!", "success")
    } catch (err: any) {
      console.error("Webhook error:", err)
      showPopup("Failed to send: " + (err.message || "Unknown error"), "error")
    } finally {
      setIsSending(false)
    }
  }

  const saveToStorage = () => {
    const now = new Date()
    localStorage.setItem(
      "guilded_embed_data",
      JSON.stringify({ content, embeds, webhookUrl, username, avatarUrl, lastSaved: now.toISOString() }),
    )
    setLastSavedTime(now)
    setHasUnsavedChanges(false)
    showPopup("Saved to local storage", "success")
  }

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(rawJson)
      if (typeof parsed !== "object" || parsed === null) {
        showPopup("Invalid JSON structure", "error")
        return
      }
      setContent(parsed.content || "")
      setEmbeds(parsed.embeds || [])
      if (parsed.username) setUsername(parsed.username)
      if (parsed.avatar_url) setAvatarUrl(parsed.avatar_url)
      setDrawerOpen(false)
      showPopup("Updated from JSON!", "success")
    } catch (err: any) {
      showPopup("Invalid JSON: " + err.message, "error")
    }
  }

  const showPopup = (message: string, type: "success" | "error") => {
    setPopup({ message, type })
  }

  // Update the formatDate function to handle both string and Date inputs
  const formatDate = (dateInput: string | Date) => {
    try {
      const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (e) {
      return "Invalid date"
    }
  }

  const formatTime = (dateInput: string | Date) => {
    try {
      const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
      })
    } catch (e) {
      return ""
    }
  }

  const generateRandomEmbed = () => {
    const colors = ["#F5C400", "#F47B67", "#3BA55C", "#5865F2", "#ED4245", "#9B59B6", "#E67E22", "#1ABC9C"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    setEmbeds((prev) => [
      ...prev,
      {
        title: "✨ Auto-Generated Embed",
        description: "This embed was generated with AI magic! Customize it to your liking.",
        color: randomColor,
        timestamp: new Date().toISOString(),
        author: { name: "Gilhook AI", icon_url: "" },
        footer: { text: "Created with Gilhook" },
        fields: [
          { name: "Tip", value: "You can edit all parts of this embed", inline: false },
          { name: "Color", value: `This uses ${randomColor}`, inline: true },
          { name: "Timestamp", value: "Current time", inline: true },
        ],
      },
    ])
    showPopup("Generated a random embed!", "success")
  }

  // Save current embed
  const openSaveDialog = () => {
    if (embeds.length === 0) {
      showPopup("No embeds to save", "error")
      return
    }
    setSaveEmbedName("")
    setShowSaveDialog(true)
  }

  const saveCurrentEmbed = () => {
    if (!saveEmbedName.trim()) {
      showPopup("Please enter a name for your embed", "error")
      return
    }

    const newSavedEmbed: SavedEmbed = {
      id: Date.now().toString(),
      name: saveEmbedName.trim(),
      embed: embeds[0], // Save the first embed
      createdAt: new Date().toISOString(),
      isFavorite: false,
    }

    const updatedSavedEmbeds = [...savedEmbeds, newSavedEmbed]
    setSavedEmbeds(updatedSavedEmbeds)
    localStorage.setItem("guilded_saved_embeds", JSON.stringify(updatedSavedEmbeds))
    setShowSaveDialog(false)
    showPopup(`Saved embed: ${saveEmbedName}`, "success")
  }

  // Load a saved embed
  const loadSavedEmbed = (savedEmbed: SavedEmbed) => {
    const confirmAction = () => {
      setEmbeds([savedEmbed.embed])
      setShowSavedEmbeds(false)
      showPopup(`Loaded embed: ${savedEmbed.name}`, "success")
    }

    if (hasUnsavedChanges) {
      setPendingAction(() => confirmAction)
      setShowUnsavedDialog(true)
    } else {
      confirmAction()
    }
  }

  // Delete a saved embed
  const deleteSavedEmbed = (id: string) => {
    const updatedSavedEmbeds = savedEmbeds.filter((embed) => embed.id !== id)
    setSavedEmbeds(updatedSavedEmbeds)
    localStorage.setItem("guilded_saved_embeds", JSON.stringify(updatedSavedEmbeds))
    showPopup("Embed deleted", "success")
  }

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    const updatedSavedEmbeds = savedEmbeds.map((embed) =>
      embed.id === id ? { ...embed, isFavorite: !embed.isFavorite } : embed,
    )
    setSavedEmbeds(updatedSavedEmbeds)
    localStorage.setItem("guilded_saved_embeds", JSON.stringify(updatedSavedEmbeds))
  }

  // Handle unsaved changes confirmation
  const handleUnsavedConfirm = () => {
    setShowUnsavedDialog(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(() => null)
    }
  }

  // Filter saved embeds based on current filter
  const filteredSavedEmbeds = savedFilter === "all" ? savedEmbeds : savedEmbeds.filter((embed) => embed.isFavorite)

  return (
    <div
      className="relative w-full max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6"
      style={{ borderRadius: "12px" }}
    >
      {/* Left Side - Editor */}
      <div className="space-y-4">
        <Card className="bg-[#1e1e24] border-0 transition-all shadow-lg">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex border-b border-[#3e3d45]">
                <TabsList className="w-full bg-transparent h-auto rounded-none">
                  <TabsTrigger
                    value="content"
                    className="flex-1 py-3 rounded-none data-[state=active]:bg-[#2a2a32] data-[state=active]:border-b-2 data-[state=active]:border-[#F5C400]"
                  >
                    <AlignLeft className="w-4 h-4 mr-2" /> Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="embeds"
                    className="flex-1 py-3 rounded-none data-[state=active]:bg-[#2a2a32] data-[state=active]:border-b-2 data-[state=active]:border-[#F5C400]"
                  >
                    <FileText className="w-4 h-4 mr-2" /> Embeds
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Message Content</Label>
                    <Textarea
                      placeholder="Type a message (optional)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      className="resize-none bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Webhook Name</Label>
                      <Input
                        placeholder="Gilhook"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Avatar URL</Label>
                      <Input
                        placeholder="https://example.com/avatar.png"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Webhook URL</Label>
                    <Input
                      placeholder="https://media.guilded.gg/webhooks/your-webhook-id"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all"
                    />
                  </div>
                </TabsContent>

                {/* Embeds Tab */}
                <TabsContent value="embeds" className="space-y-4 mt-0">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Popover open={showSavedEmbeds} onOpenChange={setShowSavedEmbeds}>
                              <PopoverTrigger asChild>
                                <Button
                                  className="bg-[#2a2a32] hover:bg-[#3e3d45] text-white border border-[#3e3d45] transition-all"
                                  variant="outline"
                                >
                                  <Bookmark className="w-4 h-4 mr-2" /> Saved Embeds
                                  {savedEmbeds.length > 0 && (
                                    <Badge className="ml-2 bg-[#F5C400] text-black">{savedEmbeds.length}</Badge>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-[#2a2a32] border-[#3e3d45] p-0 shadow-xl">
                                <div className="p-3 border-b border-[#4a4953] flex justify-between items-center">
                                  <h3 className="font-medium text-white text-lg">Saved Embeds</h3>
                                  <div className="flex gap-1 bg-[#1e1e24] rounded-md p-0.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={cn(
                                        "h-7 px-2 text-xs rounded-sm",
                                        savedFilter === "all"
                                          ? "bg-[#3e3d45] text-white"
                                          : "text-gray-400 hover:text-white hover:bg-[#3e3d45]/50",
                                      )}
                                      onClick={() => setSavedFilter("all")}
                                    >
                                      All
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={cn(
                                        "h-7 px-2 text-xs rounded-sm",
                                        savedFilter === "favorites"
                                          ? "bg-[#3e3d45] text-white"
                                          : "text-gray-400 hover:text-white hover:bg-[#3e3d45]/50",
                                      )}
                                      onClick={() => setSavedFilter("favorites")}
                                    >
                                      Favorites
                                    </Button>
                                  </div>
                                </div>
                                <div className="p-2 max-h-[300px] overflow-y-auto">
                                  {filteredSavedEmbeds.length === 0 ? (
                                    <div className="text-center py-8 px-4">
                                      <Bookmark className="w-12 h-12 text-gray-500 mx-auto mb-2 opacity-50" />
                                      <p className="text-gray-400 mb-1">
                                        {savedFilter === "favorites" ? "No favorite embeds yet" : "No saved embeds yet"}
                                      </p>
                                      <p className="text-gray-500 text-sm">
                                        {savedFilter === "favorites"
                                          ? "Mark embeds as favorites to see them here"
                                          : "Save your embeds for quick access later"}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {filteredSavedEmbeds.map((savedEmbed) => (
                                        <div
                                          key={savedEmbed.id}
                                          className="flex items-center justify-between p-2 hover:bg-[#3e3d45] rounded-md transition-colors"
                                        >
                                          <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => loadSavedEmbed(savedEmbed)}
                                          >
                                            <div className="font-medium text-white flex items-center">
                                              {savedEmbed.name}
                                              {savedEmbed.isFavorite && (
                                                <Star className="w-3.5 h-3.5 text-[#F5C400] ml-1 fill-[#F5C400]" />
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center">
                                              <Clock className="w-3 h-3 mr-1" />
                                              {formatDate(savedEmbed.createdAt)}
                                            </div>
                                          </div>
                                          <div className="flex gap-1">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-[#4a4953]"
                                                  onClick={() => toggleFavorite(savedEmbed.id)}
                                                >
                                                  <Star
                                                    className={cn(
                                                      "h-3.5 w-3.5",
                                                      savedEmbed.isFavorite
                                                        ? "text-[#F5C400] fill-[#F5C400]"
                                                        : "text-gray-400",
                                                    )}
                                                  />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent side="bottom">
                                                {savedEmbed.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                              </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-[#4a4953]"
                                                  onClick={() => loadSavedEmbed(savedEmbed)}
                                                >
                                                  <FileText className="h-3.5 w-3.5" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent side="bottom">Load embed</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                  onClick={() => deleteSavedEmbed(savedEmbed.id)}
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent side="bottom">Delete embed</TooltipContent>
                                            </Tooltip>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 border-t border-[#4a4953]">
                                  <Button
                                    className="w-full bg-[#F5C400] hover:bg-[#D4A900] text-black font-medium transition-all"
                                    onClick={openSaveDialog}
                                  >
                                    <Save className="w-4 h-4 mr-2" /> Save Current Embed
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Access your saved embeds</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              className="bg-[#2a2a32] hover:bg-[#3e3d45] text-white border border-[#3e3d45] transition-all"
                              variant="outline"
                              onClick={generateRandomEmbed}
                            >
                              <Wand2 className="w-4 h-4 mr-2" /> Generate
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Generate a random embed template</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewTheme(previewTheme === "dark" ? "light" : "dark")}
                              className="h-8 bg-transparent border-[#3e3d45] text-white hover:bg-[#3e3d45] transition-all"
                            >
                              <Palette className="w-4 h-4 mr-2" />
                              {previewTheme === "dark" ? "Dark" : "Light"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Toggle preview theme</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {embeds.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-[#4a4953] rounded-lg bg-[#1e1e1e]/30">
                      <Sparkles className="w-12 h-12 text-[#F5C400] mx-auto mb-3 opacity-70" />
                      <p className="text-gray-300 mb-4 font-medium">No embeds yet. Create your first embed!</p>
                      <Button
                        onClick={addEmbed}
                        className="bg-[#F5C400] hover:bg-[#D4A900] text-black transition-all font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Create Embed
                      </Button>
                    </div>
                  ) : (
                    <>
                      {embeds.map((embed, index) => (
                        <Card
                          key={index}
                          className="bg-[#18181b] border-0 overflow-hidden transition-all rounded-md shadow-md"
                        >
                          <div
                            className="h-2"
                            style={{ backgroundColor: embed.color || "#F5C400", width: "100%" }}
                          ></div>
                          <div className="flex justify-between items-center p-3 border-b border-[#2a2a32]">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium text-white">Embed {index + 1}</span>
                              <Badge
                                variant="outline"
                                className="bg-[#2a2a32] text-sm border-[#3e3d45] text-white px-3 py-1 rounded-full"
                              >
                                {embed.color || "#F5C400"}
                              </Badge>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeEmbed(index)}
                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">Remove embed</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <CardContent className="p-4 space-y-4">
                            <Tabs defaultValue="basic" className="w-full">
                              <TabsList className="w-full grid grid-cols-5 mb-4 bg-[#2a2a32] rounded-md">
                                <TabsTrigger value="basic" className="text-sm data-[state=active]:bg-[#3e3e3e] py-2">
                                  Basic
                                </TabsTrigger>
                                <TabsTrigger value="author" className="text-sm data-[state=active]:bg-[#3e3e3e] py-2">
                                  Author
                                </TabsTrigger>
                                <TabsTrigger value="fields" className="text-sm data-[state=active]:bg-[#3e3e3e] py-2">
                                  Fields
                                </TabsTrigger>
                                <TabsTrigger value="footer" className="text-sm data-[state=active]:bg-[#3e3e3e] py-2">
                                  Footer
                                </TabsTrigger>
                                <TabsTrigger
                                  value="appearance"
                                  className="text-sm data-[state=active]:bg-[#3e3e3e] py-2"
                                >
                                  Appearance
                                </TabsTrigger>
                              </TabsList>

                              {/* Basic Tab */}
                              <TabsContent value="basic" className="space-y-5 mt-4">
                                <div className="space-y-2">
                                  <Label className="text-white text-base">Title</Label>
                                  <Input
                                    value={embed.title || ""}
                                    onChange={(e) => updateEmbed(index, "title", e.target.value)}
                                    placeholder="Embed title"
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-white text-base">Description</Label>
                                  <Textarea
                                    value={embed.description || ""}
                                    onChange={(e) => updateEmbed(index, "description", e.target.value)}
                                    placeholder="Embed description"
                                    rows={4}
                                    className="resize-none bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all text-base"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-white text-base">URL</Label>
                                  <Input
                                    value={embed.url || ""}
                                    onChange={(e) => updateEmbed(index, "url", e.target.value)}
                                    placeholder="https://example.com"
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                  />
                                </div>
                                <div className="space-y-2 pb-6">
                                  <Label className="text-white text-base">Timestamp</Label>
                                  <Input
                                    value={embed.timestamp || ""}
                                    onChange={(e) => updateEmbed(index, "timestamp", e.target.value)}
                                    placeholder="ISO timestamp"
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base mb-2"
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => updateEmbed(index, "timestamp", new Date().toISOString())}
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white hover:bg-[#3e3e3e] h-10"
                                  >
                                    Set Current Time
                                  </Button>
                                </div>
                              </TabsContent>

                              {/* Author Tab */}
                              <TabsContent value="author" className="space-y-5 mt-4">
                                <div className="space-y-2">
                                  <Label className="text-white text-base">Author Name</Label>
                                  <Input
                                    value={embed.author?.name || ""}
                                    onChange={(e) => updateEmbed(index, "author.name", e.target.value)}
                                    placeholder="Author name"
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                  />
                                </div>
                                <div className="space-y-2 pb-6">
                                  <Label className="text-white text-base">Author Icon URL</Label>
                                  <Input
                                    value={embed.author?.icon_url || ""}
                                    onChange={(e) => updateEmbed(index, "author.icon_url", e.target.value)}
                                    placeholder="https://example.com/avatar.png"
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                  />
                                </div>
                              </TabsContent>

                              {/* Fields Tab */}
                              <TabsContent value="fields" className="space-y-5 mt-4">
                                {embed.fields?.map((field, fieldIndex) => (
                                  <div
                                    key={fieldIndex}
                                    className="space-y-2 border border-[#3e3d45] p-4 rounded-md bg-[#2a2a32] transition-all"
                                  >
                                    <div className="flex justify-between items-center">
                                      <Label className="text-white text-base">Field {fieldIndex + 1}</Label>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeField(index, fieldIndex)}
                                        className="h-8 w-8 text-red-400 hover:text-red-300"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <Input
                                      value={field.name}
                                      onChange={(e) => updateField(index, fieldIndex, "name", e.target.value)}
                                      placeholder="Field name"
                                      className="bg-[#18181b] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                    />
                                    <Input
                                      value={field.value}
                                      onChange={(e) => updateField(index, fieldIndex, "value", e.target.value)}
                                      placeholder="Field value"
                                      className="bg-[#18181b] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                    />
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        checked={field.inline || false}
                                        onCheckedChange={(checked) => updateField(index, fieldIndex, "inline", checked)}
                                      />
                                      <Label className="text-white">Inline</Label>
                                    </div>
                                  </div>
                                ))}

                                <Button
                                  variant="outline"
                                  onClick={() => addField(index)}
                                  className="w-full bg-[#2a2a32] border-[#3e3d45] text-white hover:bg-[#3e3e3e] h-10"
                                >
                                  <Plus className="w-4 h-4 mr-2" /> Add Field
                                </Button>
                              </TabsContent>

                              {/* Footer Tab */}
                              <TabsContent value="footer" className="space-y-5 mt-4 pb-6">
                                <div className="space-y-2">
                                  <Label className="text-white text-base">Footer Text</Label>
                                  <Input
                                    value={embed.footer?.text || ""}
                                    onChange={(e) => updateEmbed(index, "footer.text", e.target.value)}
                                    placeholder="Footer text"
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                  />
                                </div>
                              </TabsContent>

                              {/* Appearance Tab */}
                              <TabsContent value="appearance" className="space-y-5 mt-4 pb-6">
                                <div className="space-y-2">
                                  <Label className="text-white text-base">Color</Label>
                                  <div className="flex gap-3 items-center">
                                    <ColorPicker
                                      value={embed.color || "#F5C400"}
                                      onChange={(color) => updateEmbed(index, "color", color)}
                                      className="h-10 w-10"
                                    />
                                    <Input
                                      type="text"
                                      value={embed.color || "#F5C400"}
                                      onChange={(e) => updateEmbed(index, "color", e.target.value)}
                                      placeholder="#F5C400"
                                      className="w-32 bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                    />
                                    <div className="text-sm text-white">
                                      Decimal: {hexToDecimal(embed.color || "#F5C400")}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-white text-base">Image URL</Label>
                                  <Input
                                    value={embed.image || ""}
                                    onChange={(e) => updateEmbed(index, "image", e.target.value)}
                                    placeholder="https://example.com/image.png"
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-white text-base">Thumbnail URL</Label>
                                  <Input
                                    value={embed.thumbnail || ""}
                                    onChange={(e) => updateEmbed(index, "thumbnail", e.target.value)}
                                    placeholder="https://example.com/thumbnail.png"
                                    className="bg-[#2a2a32] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400] transition-all h-12 text-base"
                                  />
                                </div>
                              </TabsContent>
                            </Tabs>
                          </CardContent>
                        </Card>
                      ))}

                      <Button
                        onClick={addEmbed}
                        className="w-full bg-[#F5C400] hover:bg-[#D4A900] text-black transition-all h-10 mt-2 font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Embed
                      </Button>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>

          {/* Footer Buttons */}
          <CardFooter className="flex flex-wrap gap-2 justify-between p-4 border-t border-[#3e3d45] bg-[#1e1e24]">
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSend}
                      disabled={isSending}
                      className="bg-[#F5C400] hover:bg-[#D4A900] text-black transition-all font-medium"
                    >
                      {isSending ? (
                        <div className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4 text-black"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                          </svg>
                          Sending...
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" /> Send
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Send webhook to Guilded</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={saveToStorage}
                      className="bg-[#2a2a32] hover:bg-[#3e3d45] text-white border border-[#3e3d45] transition-all"
                      variant="outline"
                    >
                      <Save className="w-4 h-4 mr-2" /> Save
                      {hasUnsavedChanges && <div className="w-1.5 h-1.5 rounded-full bg-[#F5C400] ml-2"></div>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {lastSavedTime ? (
                      <div className="text-xs">
                        Last saved: {formatDate(lastSavedTime)} at {formatTime(lastSavedTime)}
                      </div>
                    ) : (
                      "Save your work"
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={copyJson}
                      className="border-[#3e3d45] bg-[#2a2a32] hover:bg-[#3e3d45] text-gray-300 transition-all"
                    >
                      <Copy className="w-4 h-4 mr-2" /> Copy JSON
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Copy webhook JSON to clipboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setDrawerOpen(true)}
                      className="border-[#3e3d45] bg-[#2a2a32] hover:bg-[#3e3d45] text-gray-300 transition-all"
                    >
                      <Pencil className="w-4 h-4 mr-2" /> Edit Raw JSON
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Edit webhook as raw JSON</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right Side - Preview */}
      <Card
        className={cn(
          "overflow-hidden transition-all border-0 shadow-lg",
          previewTheme === "dark" ? "bg-[#2e2d33] border-gray-800" : "bg-white border-gray-200",
        )}
      >
        <div className={cn("p-3 flex items-center gap-3", previewTheme === "dark" ? "bg-[#2e2d33]" : "bg-white")}>
          <Avatar className="h-10 w-10 border-0">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={username || "Gilhook"} />
            ) : (
              <AvatarFallback className="bg-[#F5C400] text-black font-bold">
                {(username || "Gilhook").charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", previewTheme === "dark" ? "text-white" : "text-gray-800")}>
              {username || "Gilhook"}
            </span>
            <span className={cn("text-sm", previewTheme === "dark" ? "text-gray-400" : "text-gray-500")}>
              {formatDate(new Date()).split(",")[0]}
            </span>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wide",
                previewTheme === "dark" ? "bg-[#3e3d45] text-white" : "bg-gray-200 text-gray-700",
              )}
            >
              WEBHOOK
            </span>
          </div>
        </div>
        <CardContent className={cn("p-0 text-white", previewTheme === "dark" ? "bg-[#2e2d33]" : "bg-white")}>
          {/* Content */}
          {content && (
            <div className={cn("px-4 py-3", previewTheme === "dark" ? "text-[#e5e5e6]" : "text-gray-700")}>
              {content}
            </div>
          )}

          {/* No Embeds */}
          {embeds.length === 0 && (
            <div className="text-center py-10">
              <p className={previewTheme === "dark" ? "text-gray-400" : "text-gray-500"}>No embeds to preview</p>
            </div>
          )}

          {/* Embeds Preview */}
          {embeds.map((embed, index) => (
            <div
              key={index}
              className={cn(
                "mx-4 mb-3 rounded-[3px] overflow-hidden flex",
                previewTheme === "dark" ? "bg-[#36353d]" : "bg-gray-100",
              )}
            >
              {/* Left color bar */}
              <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: embed.color || "#F5C400" }}></div>

              <div className="flex-grow">
                {/* Author */}
                {embed.author?.name && (
                  <div className="flex items-center gap-2 px-4 pt-3">
                    {embed.author.icon_url && (
                      <img
                        src={embed.author.icon_url || "/placeholder.svg"}
                        alt="Author"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span
                      className={cn("font-medium text-sm", previewTheme === "dark" ? "text-white" : "text-gray-800")}
                    >
                      {embed.author.name}
                    </span>
                  </div>
                )}

                {/* Title */}
                {embed.title && (
                  <div className="px-4 pt-2">
                    <a
                      href={embed.url || "#"}
                      className={cn(
                        "font-bold text-lg",
                        previewTheme === "dark" ? "text-white hover:underline" : "text-gray-800 hover:underline",
                      )}
                    >
                      {embed.title}
                    </a>
                  </div>
                )}

                {/* Description */}
                {embed.description && (
                  <div
                    className={cn(
                      "px-4 pt-2 whitespace-pre-line",
                      previewTheme === "dark" ? "text-[#e5e5e6]" : "text-gray-700",
                    )}
                  >
                    {embed.description}
                  </div>
                )}

                {/* Image */}
                {embed.image && (
                  <div className="px-4 pt-3">
                    <img
                      src={embed.image || "/placeholder.svg"}
                      alt="Embed image"
                      className="rounded-[3px] max-w-full max-h-[300px] object-cover"
                    />
                  </div>
                )}

                {/* Thumbnail */}
                {embed.thumbnail && (
                  <div className="float-right ml-4 mt-2 px-4">
                    <img
                      src={embed.thumbnail || "/placeholder.svg"}
                      alt="Thumbnail"
                      className="rounded-[3px] max-w-[80px] max-h-[80px] object-cover"
                    />
                  </div>
                )}

                {/* Fields */}
                {embed.fields && embed.fields.length > 0 && (
                  <div className="px-4 pt-3 grid grid-cols-1 gap-3">
                    {embed.fields.map((field, idx) => (
                      <div key={idx} className={field.inline ? "inline-block mr-4" : "block"}>
                        <div className={cn("font-semibold", previewTheme === "dark" ? "text-white" : "text-gray-800")}>
                          {field.name}
                        </div>
                        <div className={cn(previewTheme === "dark" ? "text-[#c7c7c9]" : "text-gray-600")}>
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                {(embed.footer?.text || embed.timestamp) && (
                  <div
                    className={cn(
                      "px-4 py-3 mt-2 text-xs",
                      previewTheme === "dark" ? "text-[#9b9b9b]" : "text-gray-500",
                    )}
                  >
                    {embed.footer?.text && <span>{embed.footer.text}</span>}
                    {embed.footer?.text && embed.timestamp && <span className="mx-1">•</span>}
                    {embed.timestamp && <span>{formatDate(embed.timestamp).split(",")[0]}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Drawer for Raw JSON */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-[#1e1e24] border-t border-[#3e3d45]">
          <DrawerHeader>
            <DrawerTitle className="text-white">Edit Raw JSON</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <Textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="h-[400px] font-mono text-sm bg-[#2a2a32] border-[#3e3d45] text-white"
            />
          </div>
          <DrawerFooter>
            <Button onClick={handleSaveJson} className="bg-[#F5C400] hover:bg-[#D4A900] text-black font-medium">
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)} className="border-[#3e3d45] text-gray-300">
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Save Embed Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="bg-[#2a2a32] border-[#3e3d45] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Save className="h-5 w-5 text-[#F5C400]" /> Save Embed
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Give your embed a name to save it for later use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="My awesome embed"
              value={saveEmbedName}
              onChange={(e) => setSaveEmbedName(e.target.value)}
              className="bg-[#1e1e24] border-[#3e3d45] text-white focus:border-[#F5C400] focus:ring-[#F5C400]"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#3e3d45] text-white hover:bg-[#4a4953] border-[#4a4953]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={saveCurrentEmbed}
              className="bg-[#F5C400] text-black hover:bg-[#D4A900] font-medium"
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="bg-[#2a2a32] border-[#3e3d45] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#F5C400]" /> Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              You have unsaved changes that will be lost. Do you want to continue without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#3e3d45] text-white hover:bg-[#4a4953] border-[#4a4953]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsavedConfirm}
              className="bg-[#F5C400] text-black hover:bg-[#D4A900] font-medium"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popup Toast */}
      {popup && <PopupToast message={popup.message} type={popup.type} onClose={() => setPopup(null)} />}
    </div>
  )
}
