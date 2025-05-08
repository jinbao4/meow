"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Copy, Save, Send, Palette, Bookmark, Sparkles, Shield, Info } from "lucide-react"
import { sendWebhook } from "@/lib/webhook"
import { PopupToast } from "@/components/PopToast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ColorPicker } from "@/components/ui/color-picker"
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
  const [activeTab, setActiveTab] = useState("content")
  const [isSending, setIsSending] = useState(false)
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark")
  const [savedEmbeds, setSavedEmbeds] = useState<SavedEmbed[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<() => void | null>(() => null)
  const [saveEmbedName, setSaveEmbedName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const [showSecurityInfo, setShowSecurityInfo] = useState(false)
  const [focusedEmbedIndex, setFocusedEmbedIndex] = useState<number | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [activeEmbedTab, setActiveEmbedTab] = useState("basic")

  // Add an embed by default if none exist
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
        addDefaultEmbed()
      }
    } else {
      addDefaultEmbed()
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

  // Add a default embed if none exist
  const addDefaultEmbed = () => {
    if (embeds.length === 0) {
      setEmbeds([
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
    }
  }

  // Update when data changes
  useEffect(() => {
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

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* Left Side - Editor */}
        <div className="space-y-4">
          <div className="bg-[#1a1a1c] border-0 transition-all shadow-lg rounded-lg overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex border-b border-[#2a2a2c]">
                <TabsList className="w-full bg-transparent h-auto rounded-none">
                  <TabsTrigger
                    value="content"
                    className="flex-1 py-3 rounded-none data-[state=active]:bg-[#2a2a32] data-[state=active]:border-b-2 data-[state=active]:border-[#F5C400] data-[state=inactive]:text-gray-400"
                  >
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="embeds"
                    className="flex-1 py-3 rounded-none data-[state=active]:bg-[#2a2a32] data-[state=active]:border-b-2 data-[state=active]:border-[#F5C400] data-[state=inactive]:text-gray-400"
                  >
                    Embeds
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
                      className={cn(
                        "resize-none transition-all",
                        focusedField === "content"
                          ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                          : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                      )}
                      onFocus={() => setFocusedField("content")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Webhook Name</Label>
                      <Input
                        placeholder="Gilhook"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={cn(
                          "transition-all",
                          focusedField === "username"
                            ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                            : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                        )}
                        onFocus={() => setFocusedField("username")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Avatar URL</Label>
                      <Input
                        placeholder="https://example.com/avatar.png"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className={cn(
                          "transition-all",
                          focusedField === "avatarUrl"
                            ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                            : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                        )}
                        onFocus={() => setFocusedField("avatarUrl")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-gray-300">Webhook URL</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowSecurityInfo(true)}
                              className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                            >
                              <Shield className="h-3.5 w-3.5 mr-1" /> Security Info
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Learn about our security measures</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      placeholder="https://media.guilded.gg/webhooks/your-webhook-id"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className={cn(
                        "transition-all",
                        focusedField === "webhookUrl"
                          ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                          : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                      )}
                      onFocus={() => setFocusedField("webhookUrl")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </TabsContent>

                {/* Embeds Tab */}
                <TabsContent value="embeds" className="space-y-4 mt-0">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button onClick={addEmbed} className="bg-[#F5C400] hover:bg-[#D4A900] text-black">
                        <Plus className="w-4 h-4 mr-2" /> Add Embed
                      </Button>

                      <Button
                        className="bg-[#1a1a1c] hover:bg-[#2a2a2c] text-white"
                        variant="outline"
                        onClick={openSaveDialog}
                      >
                        <Bookmark className="w-4 h-4 mr-2" /> Saved
                        {savedEmbeds.length > 0 && (
                          <Badge className="ml-2 bg-[#F5C400] text-black">{savedEmbeds.length}</Badge>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewTheme(previewTheme === "dark" ? "light" : "dark")}
                              className="h-8 bg-[#121214] border-[#2a2a2c] text-white hover:bg-[#2a2a2c]"
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
                    <div className="text-center py-12 border border-dashed border-[#2a2a2c] rounded-lg bg-[#1a1a1c]">
                      <Sparkles className="w-12 h-12 text-[#F5C400] mx-auto mb-3 opacity-70" />
                      <p className="text-gray-300 mb-4 font-medium">No embeds yet. Create your first embed!</p>
                      <Button onClick={addEmbed} className="bg-[#F5C400] hover:bg-[#D4A900] text-black">
                        <Plus className="w-4 h-4 mr-2" /> Create Embed
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {embeds.map((embed, index) => (
                        <div
                          key={index}
                          className={cn(
                            "rounded-lg overflow-hidden transition-all border",
                            focusedEmbedIndex === index
                              ? "bg-[#1a1a1c] border-[#F5C400]"
                              : "bg-[#121214] border-[#2a2a2c] opacity-90",
                          )}
                          onClick={() => setFocusedEmbedIndex(index)}
                        >
                          <div
                            className="h-2"
                            style={{ backgroundColor: embed.color || "#F5C400", width: "100%" }}
                          ></div>

                          <div className="px-4 py-3 flex justify-between items-center border-b border-[#2a2a2c]">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium text-white">Embed {index + 1}</span>
                              <Badge
                                variant="outline"
                                className="bg-[#121214] text-xs border-[#2a2a2c] text-white px-2 py-0.5 rounded-full"
                              >
                                {embed.color || "#F5C400"}
                              </Badge>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEmbed(index)}
                              className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="p-4">
                            <Tabs value={activeEmbedTab} onValueChange={setActiveEmbedTab} className="w-full">
                              <TabsList className="w-full bg-[#121214] rounded-md mb-4">
                                <TabsTrigger
                                  value="basic"
                                  className="data-[state=active]:bg-[#2a2a2c] data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                                >
                                  Basic
                                </TabsTrigger>
                                <TabsTrigger
                                  value="author"
                                  className="data-[state=active]:bg-[#2a2a2c] data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                                >
                                  Author
                                </TabsTrigger>
                                <TabsTrigger
                                  value="fields"
                                  className="data-[state=active]:bg-[#2a2a2c] data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                                >
                                  Fields
                                </TabsTrigger>
                                <TabsTrigger
                                  value="footer"
                                  className="data-[state=active]:bg-[#2a2a2c] data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                                >
                                  Footer
                                </TabsTrigger>
                                <TabsTrigger
                                  value="appearance"
                                  className="data-[state=active]:bg-[#2a2a2c] data-[state=active]:text-white data-[state=inactive]:text-gray-400"
                                >
                                  Appearance
                                </TabsTrigger>
                              </TabsList>

                              {/* Basic Tab */}
                              <TabsContent value="basic" className="space-y-4 mt-0">
                                <div className="space-y-2">
                                  <Label className="text-white">Title</Label>
                                  <Input
                                    value={embed.title || ""}
                                    onChange={(e) => updateEmbed(index, "title", e.target.value)}
                                    placeholder="Embed title"
                                    className={cn(
                                      "transition-all",
                                      focusedField === `${index}-title`
                                        ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                        : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                    )}
                                    onFocus={() => setFocusedField(`${index}-title`)}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-white">Description</Label>
                                  <Textarea
                                    value={embed.description || ""}
                                    onChange={(e) => updateEmbed(index, "description", e.target.value)}
                                    placeholder="Embed description"
                                    rows={4}
                                    className={cn(
                                      "resize-none transition-all",
                                      focusedField === `${index}-description`
                                        ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                        : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                    )}
                                    onFocus={() => setFocusedField(`${index}-description`)}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-white">URL</Label>
                                  <Input
                                    value={embed.url || ""}
                                    onChange={(e) => updateEmbed(index, "url", e.target.value)}
                                    placeholder="https://example.com"
                                    className={cn(
                                      "transition-all",
                                      focusedField === `${index}-url`
                                        ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                        : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                    )}
                                    onFocus={() => setFocusedField(`${index}-url`)}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-white">Timestamp</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={embed.timestamp || ""}
                                      onChange={(e) => updateEmbed(index, "timestamp", e.target.value)}
                                      placeholder="ISO timestamp"
                                      className={cn(
                                        "transition-all flex-1",
                                        focusedField === `${index}-timestamp`
                                          ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                          : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                      )}
                                      onFocus={() => setFocusedField(`${index}-timestamp`)}
                                      onBlur={() => setFocusedField(null)}
                                    />
                                    <Button
                                      variant="outline"
                                      onClick={() => updateEmbed(index, "timestamp", new Date().toISOString())}
                                      className="bg-[#121214] border-[#2a2a2c] text-white hover:bg-[#2a2a2c]"
                                    >
                                      Set Current Time
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>

                              {/* Author Tab */}
                              <TabsContent value="author" className="space-y-4 mt-0">
                                <div className="space-y-2">
                                  <Label className="text-white">Author Name</Label>
                                  <Input
                                    value={embed.author?.name || ""}
                                    onChange={(e) => updateEmbed(index, "author.name", e.target.value)}
                                    placeholder="Author name"
                                    className={cn(
                                      "transition-all",
                                      focusedField === `${index}-author-name`
                                        ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                        : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                    )}
                                    onFocus={() => setFocusedField(`${index}-author-name`)}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-white">Author Icon URL</Label>
                                  <Input
                                    value={embed.author?.icon_url || ""}
                                    onChange={(e) => updateEmbed(index, "author.icon_url", e.target.value)}
                                    placeholder="https://example.com/avatar.png"
                                    className={cn(
                                      "transition-all",
                                      focusedField === `${index}-author-icon`
                                        ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                        : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                    )}
                                    onFocus={() => setFocusedField(`${index}-author-icon`)}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                </div>
                              </TabsContent>

                              {/* Fields Tab */}
                              <TabsContent value="fields" className="space-y-4 mt-0">
                                {embed.fields?.map((field, fieldIndex) => (
                                  <div
                                    key={fieldIndex}
                                    className="space-y-2 border border-[#2a2a2c] p-3 rounded-md bg-[#121214]"
                                  >
                                    <div className="flex justify-between items-center">
                                      <Label className="text-white">Field {fieldIndex + 1}</Label>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeField(index, fieldIndex)}
                                        className="h-7 w-7 text-gray-400 hover:text-red-400"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>

                                    <Input
                                      value={field.name}
                                      onChange={(e) => updateField(index, fieldIndex, "name", e.target.value)}
                                      placeholder="Field name"
                                      className={cn(
                                        "transition-all",
                                        focusedField === `${index}-field-${fieldIndex}-name`
                                          ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                          : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                      )}
                                      onFocus={() => setFocusedField(`${index}-field-${fieldIndex}-name`)}
                                      onBlur={() => setFocusedField(null)}
                                    />

                                    <Input
                                      value={field.value}
                                      onChange={(e) => updateField(index, fieldIndex, "value", e.target.value)}
                                      placeholder="Field value"
                                      className={cn(
                                        "transition-all",
                                        focusedField === `${index}-field-${fieldIndex}-value`
                                          ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                          : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                      )}
                                      onFocus={() => setFocusedField(`${index}-field-${fieldIndex}-value`)}
                                      onBlur={() => setFocusedField(null)}
                                    />

                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        checked={field.inline || false}
                                        onCheckedChange={(checked) => updateField(index, fieldIndex, "inline", checked)}
                                      />
                                      <Label className="text-gray-300">Inline</Label>
                                    </div>
                                  </div>
                                ))}

                                <Button
                                  variant="outline"
                                  onClick={() => addField(index)}
                                  className="w-full bg-[#121214] border-[#2a2a2c] text-white hover:bg-[#2a2a2c]"
                                >
                                  <Plus className="w-4 h-4 mr-2" /> Add Field
                                </Button>
                              </TabsContent>

                              {/* Footer Tab */}
                              <TabsContent value="footer" className="space-y-4 mt-0">
                                <div className="space-y-2">
                                  <Label className="text-white">Footer Text</Label>
                                  <Input
                                    value={embed.footer?.text || ""}
                                    onChange={(e) => updateEmbed(index, "footer.text", e.target.value)}
                                    placeholder="Footer text"
                                    className={cn(
                                      "transition-all",
                                      focusedField === `${index}-footer`
                                        ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                        : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                    )}
                                    onFocus={() => setFocusedField(`${index}-footer`)}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                </div>
                              </TabsContent>

                              {/* Appearance Tab */}
                              <TabsContent value="appearance" className="space-y-4 mt-0">
                                <div className="space-y-2">
                                  <Label className="text-white">Color</Label>
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
                                      className={cn(
                                        "w-32 transition-all",
                                        focusedField === `${index}-color`
                                          ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                          : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                      )}
                                      onFocus={() => setFocusedField(`${index}-color`)}
                                      onBlur={() => setFocusedField(null)}
                                    />
                                    <div className="text-sm text-gray-300">
                                      Decimal: {hexToDecimal(embed.color || "#F5C400")}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-white">Image URL</Label>
                                  <Input
                                    value={embed.image || ""}
                                    onChange={(e) => updateEmbed(index, "image", e.target.value)}
                                    placeholder="https://example.com/image.png"
                                    className={cn(
                                      "transition-all",
                                      focusedField === `${index}-image`
                                        ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                        : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                    )}
                                    onFocus={() => setFocusedField(`${index}-image`)}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-white">Thumbnail URL</Label>
                                  <Input
                                    value={embed.thumbnail || ""}
                                    onChange={(e) => updateEmbed(index, "thumbnail", e.target.value)}
                                    placeholder="https://example.com/thumbnail.png"
                                    className={cn(
                                      "transition-all",
                                      focusedField === `${index}-thumbnail`
                                        ? "bg-[#2a2a2c] border-[#F5C400] text-white"
                                        : "bg-[#121214] border-[#2a2a2c] text-gray-300",
                                    )}
                                    onFocus={() => setFocusedField(`${index}-thumbnail`)}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer Buttons */}
            <div className="flex flex-wrap gap-2 justify-between p-4 border-t border-[#2a2a2c] bg-[#1a1a1c] rounded-b-lg">
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
                        className="bg-[#1a1a1c] hover:bg-[#2a2a2c] text-white border border-[#2a2a2c] transition-all"
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
                        className="border-[#2a2a2c] bg-[#1a1a1c] hover:bg-[#2a2a2c] text-gray-300 transition-all"
                      >
                        <Copy className="w-4 h-4 mr-2" /> Copy JSON
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Copy webhook JSON to clipboard</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div
          className={cn(
            "rounded-lg overflow-hidden transition-all border border-[#2a2a2c]",
            previewTheme === "dark" ? "bg-[#1a1a1c]" : "bg-white",
          )}
        >
          <div className={cn("p-3 flex items-center gap-3", previewTheme === "dark" ? "bg-[#1a1a1c]" : "bg-white")}>
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
                  previewTheme === "dark" ? "bg-[#2a2a2c] text-white" : "bg-gray-200 text-gray-700",
                )}
              >
                WEBHOOK
              </span>
            </div>
          </div>

          <div className={cn("p-0", previewTheme === "dark" ? "bg-[#1a1a1c]" : "bg-white")}>
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
                  previewTheme === "dark" ? "bg-[#2a2a2c]" : "bg-gray-100",
                )}
              >
                {/* Left color bar */}
                <div className="w-1 flex-shrink-0" style={{ backgroundColor: embed.color || "#F5C400" }}></div>

                <div className="flex-grow p-3">
                  {/* Author */}
                  {embed.author?.name && (
                    <div className="flex items-center gap-2 mb-2">
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
                    <div className="mb-1">
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
                        "whitespace-pre-line mb-2",
                        previewTheme === "dark" ? "text-[#e5e5e6]" : "text-gray-700",
                      )}
                    >
                      {embed.description}
                    </div>
                  )}

                  {/* Fields */}
                  {embed.fields && embed.fields.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mb-2">
                      {embed.fields.map((field, idx) => (
                        <div key={idx} className={field.inline ? "inline-block mr-4" : "block"}>
                          <div
                            className={cn("font-semibold", previewTheme === "dark" ? "text-white" : "text-gray-800")}
                          >
                            {field.name}
                          </div>
                          <div className={cn(previewTheme === "dark" ? "text-[#c7c7c9]" : "text-gray-600")}>
                            {field.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Image */}
                  {embed.image && (
                    <div className="mt-2 mb-2">
                      <img
                        src={embed.image || "/placeholder.svg"}
                        alt="Embed image"
                        className="rounded-[3px] max-w-full max-h-[300px] object-cover"
                      />
                    </div>
                  )}

                  {/* Thumbnail */}
                  {embed.thumbnail && (
                    <div className="float-right ml-4 mt-0">
                      <img
                        src={embed.thumbnail || "/placeholder.svg"}
                        alt="Thumbnail"
                        className="rounded-[3px] max-w-[80px] max-h-[80px] object-cover"
                      />
                    </div>
                  )}

                  {/* Footer */}
                  {(embed.footer?.text || embed.timestamp) && (
                    <div className={cn("mt-2 text-xs", previewTheme === "dark" ? "text-[#9b9b9b]" : "text-gray-500")}>
                      {embed.footer?.text && <span>{embed.footer.text}</span>}
                      {embed.footer?.text && embed.timestamp && <span className="mx-1">•</span>}
                      {embed.timestamp && <span>{formatDate(embed.timestamp).split(",")[0]}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup Toast */}
      {popup && <PopupToast message={popup.message} type={popup.type} onClose={() => setPopup(null)} />}

      {/* Security Info Dialog */}
      <AlertDialog open={showSecurityInfo} onOpenChange={setShowSecurityInfo}>
        <AlertDialogContent className="bg-[#1a1a1c] border-[#2a2a2c] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#F5C400]" /> Security Information
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Gilhook is designed with security in mind. Here's how we protect your data:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-[#F5C400]" /> Client-Side Processing
              </h3>
              <p className="text-gray-300 text-sm">
                All webhook requests are sent directly from your browser to Guilded. We never store or process your
                webhook URLs or data on any server.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-[#F5C400]" /> Rate Limiting
              </h3>
              <p className="text-gray-300 text-sm">
                We implement client-side rate limiting to prevent abuse. You can send up to 5 webhook requests per
                minute.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-[#F5C400]" /> Local Storage Only
              </h3>
              <p className="text-gray-300 text-sm">
                Your embeds and settings are saved only in your browser's local storage. Nothing is sent to our servers.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowSecurityInfo(false)}
              className="bg-[#F5C400] text-black hover:bg-[#D4A900] font-medium"
            >
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="bg-[#1a1a1c] border-[#2a2a2c] text-white">
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
              className="bg-[#121214] border-[#2a2a2c] text-white focus:border-[#F5C400] focus:ring-[#F5C400]"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2a2a2c] text-white hover:bg-[#3a3a3c] border-[#3a3a3c]">
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
        <AlertDialogContent className="bg-[#1a1a1c] border-[#2a2a2c] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              You have unsaved changes that will be lost. Do you want to continue without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2a2a2c] text-white hover:bg-[#3a3a3c] border-[#3a3a3c]">
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
    </div>
  )
}
