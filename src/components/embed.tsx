"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Copy, Save, Pencil, ImageIcon, Link, Clock, User, FileText, AlignLeft } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { ColorPicker } from "@/components/ui/color-picker"
import { sendWebhook } from "@/lib/webhook"
import { PopupToast } from "@/components/PopToast"

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

export function EmbedEditor() {
  const [embeds, setEmbeds] = useState<GuildedEmbed[]>([])
  const [content, setContent] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rawJson, setRawJson] = useState("")
  const [activeTab, setActiveTab] = useState("content")
  const [isSending, setIsSending] = useState(false)
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    const savedData = localStorage.getItem("guilded_embed_data")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        if (parsed.embeds) setEmbeds(parsed.embeds)
        if (parsed.content) setContent(parsed.content)
        if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl)
      } catch (e) {
        console.error("Failed to load saved data", e)
      }
    }
  }, [])

  useEffect(() => {
    setRawJson(JSON.stringify({ content, embeds }, null, 2))
  }, [content, embeds])

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

  const addEmbed = () => {
    setEmbeds((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        color: "#F5C400",
        timestamp: new Date().toISOString(),
        author: { name: "", icon_url: "" },
        footer: { text: "" },
        fields: [],
      },
    ])
  }

  const removeEmbed = (index: number) => {
    setEmbeds((prev) => prev.filter((_, i) => i !== index))
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
    navigator.clipboard.writeText(JSON.stringify({ content, embeds }, null, 2))
  }

  const handleSend = async () => {
    if (!webhookUrl) {
      showPopup("Webhook URL is required!", "error")
      return
    }
    try {
      setIsSending(true)
      await sendWebhook(webhookUrl, { content, embeds })
      showPopup("Webhook sent successfully!", "success")
    } catch (err: any) {
      showPopup("Failed to send: " + (err.message || "Unknown error"), "error")
    } finally {
      setIsSending(false)
    }
  }

  const saveToStorage = () => {
    localStorage.setItem("guilded_embed_data", JSON.stringify({ content, embeds }))
    showPopup("Saved to local storage.", "success")
  }

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(rawJson)
      if (typeof parsed !== "object" || parsed === null) {
        showPopup("Invalid JSON structure.", "error")
        return
      }
      setContent(parsed.content || "")
      setEmbeds(parsed.embeds || [])
      setDrawerOpen(false)
      showPopup("Updated from JSON!", "success")
    } catch (err: any) {
      showPopup("Invalid JSON: " + err.message, "error")
    }
  }

  const showPopup = (message: string, type: "success" | "error") => {
    setPopup({ message, type })
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      return "Invalid date"
    }
  }

  return (
    <div
      className="relative w-full max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6"
      style={{ borderRadius: "12px" }}
    >
      {/* Left Side - Editor */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Content
                </TabsTrigger>
                <TabsTrigger value="embeds" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Embeds
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea
                    placeholder="Type a message (optional)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder="https://media.guilded.gg/webhooks/your-webhook-id"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* Embeds Tab */}
              <TabsContent value="embeds" className="space-y-4">
                {embeds.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No embeds yet. Create your first embed!</p>
                    <Button
                      onClick={addEmbed}
                      className="bg-[#F5C400] hover:bg-[#D4A900] text-black"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Create Embed
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* EMBED CARDS will go here (sending next part) */}

                    {embeds.map((embed, index) => (
                      <Card key={index}>
                        <CardHeader className="flex flex-row justify-between items-center py-2 px-4">
                          <CardTitle className="text-sm font-medium">Embed {index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmbed(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardHeader>

                        <CardContent className="p-4 space-y-4">
                          <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="w-full grid grid-cols-5 mb-4">
                              <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                              <TabsTrigger value="author" className="text-xs">Author</TabsTrigger>
                              <TabsTrigger value="fields" className="text-xs">Fields</TabsTrigger>
                              <TabsTrigger value="footer" className="text-xs">Footer</TabsTrigger>
                              <TabsTrigger value="appearance" className="text-xs">Appearance</TabsTrigger>
                            </TabsList>

                            {/* Basic Tab */}
                            <TabsContent value="basic" className="space-y-3">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                  value={embed.title || ""}
                                  onChange={(e) => updateEmbed(index, "title", e.target.value)}
                                  placeholder="Embed title"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={embed.description || ""}
                                  onChange={(e) => updateEmbed(index, "description", e.target.value)}
                                  placeholder="Embed description"
                                  rows={3}
                                  className="resize-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                  value={embed.url || ""}
                                  onChange={(e) => updateEmbed(index, "url", e.target.value)}
                                  placeholder="https://example.com"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Timestamp</Label>
                                <Input
                                  value={embed.timestamp || ""}
                                  onChange={(e) => updateEmbed(index, "timestamp", e.target.value)}
                                  placeholder="ISO timestamp"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateEmbed(index, "timestamp", new Date().toISOString())}
                                >
                                  Set Current Time
                                </Button>
                              </div>
                            </TabsContent>

                            {/* Author Tab */}
                            <TabsContent value="author" className="space-y-3">
                              <div className="space-y-2">
                                <Label>Author Name</Label>
                                <Input
                                  value={embed.author?.name || ""}
                                  onChange={(e) => updateEmbed(index, "author.name", e.target.value)}
                                  placeholder="Author name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Author Icon URL</Label>
                                <Input
                                  value={embed.author?.icon_url || ""}
                                  onChange={(e) => updateEmbed(index, "author.icon_url", e.target.value)}
                                  placeholder="https://example.com/avatar.png"
                                />
                              </div>
                            </TabsContent>

                            {/* Fields Tab */}
                            <TabsContent value="fields" className="space-y-4">
                              {embed.fields?.map((field, fieldIndex) => (
                                <div key={fieldIndex} className="space-y-2 border p-3 rounded-md">
                                  <div className="flex justify-between items-center">
                                    <Label>Field {fieldIndex + 1}</Label>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeField(index, fieldIndex)}
                                      className="h-6 w-6 text-destructive hover:text-destructive/90"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={field.name}
                                    onChange={(e) => updateField(index, fieldIndex, "name", e.target.value)}
                                    placeholder="Field name"
                                  />
                                  <Input
                                    value={field.value}
                                    onChange={(e) => updateField(index, fieldIndex, "value", e.target.value)}
                                    placeholder="Field value"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={field.inline || false}
                                      onCheckedChange={(checked) => updateField(index, fieldIndex, "inline", checked)}
                                    />
                                    <Label>Inline</Label>
                                  </div>
                                </div>
                              ))}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addField(index)}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" /> Add Field
                              </Button>
                            </TabsContent>

                            {/* Footer Tab */}
                            <TabsContent value="footer" className="space-y-3">
                              <div className="space-y-2">
                                <Label>Footer Text</Label>
                                <Input
                                  value={embed.footer?.text || ""}
                                  onChange={(e) => updateEmbed(index, "footer.text", e.target.value)}
                                  placeholder="Footer text"
                                />
                              </div>
                            </TabsContent>

                            {/* Appearance Tab */}
                            <TabsContent value="appearance" className="space-y-3">
                              <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="flex gap-3 items-center">
                                  <ColorPicker
                                    value={embed.color || "#F5C400"}
                                    onChange={(color) => updateEmbed(index, "color", color)}
                                    className="h-9 w-9"
                                  />
                                  <Input
                                    type="text"
                                    value={embed.color || "#F5C400"}
                                    onChange={(e) => updateEmbed(index, "color", e.target.value)}
                                    placeholder="#F5C400"
                                    className="w-32"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input
                                  value={embed.image || ""}
                                  onChange={(e) => updateEmbed(index, "image", e.target.value)}
                                  placeholder="https://example.com/image.png"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Thumbnail URL</Label>
                                <Input
                                  value={embed.thumbnail || ""}
                                  onChange={(e) => updateEmbed(index, "thumbnail", e.target.value)}
                                  placeholder="https://example.com/thumbnail.png"
                                />
                              </div>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    ))}

                    <Button onClick={addEmbed} className="w-full bg-[#F5C400] hover:bg-[#D4A900] text-black">
                      <Plus className="w-4 h-4 mr-2" /> Add Embed
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* Footer Buttons */}
          <CardFooter className="flex flex-wrap gap-2 justify-between p-4 bg-muted/50">
            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="bg-[#F5C400] hover:bg-[#D4A900] text-black"
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
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Sending...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Send
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={copyJson}>
                <Copy className="w-4 h-4 mr-2" /> Copy JSON
              </Button>
            </div>

            <Button variant="outline" onClick={() => setDrawerOpen(true)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit Raw JSON
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Right Side - Preview */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden flex flex-col border">
        <div className="flex-1 p-6 overflow-auto space-y-6">

          {/* Fake Chat Header */}
          <div className="flex items-center gap-3 border-b pb-3 border-border">
            <div className="w-10 h-10 rounded-full bg-[#F5C400] flex items-center justify-center text-black font-bold text-lg">
              G
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold">Gilhook</span>
                <span className="bg-[#F5C400] text-black text-xs font-bold px-1 rounded">WEBHOOK</span>
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(new Date().toISOString())}</span>
            </div>
          </div>

          {/* Content Message */}
          {content && (
            <div className="text-foreground">{content}</div>
          )}

          {/* No Embeds */}
          {embeds.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No embeds to preview</p>
            </div>
          )}

          {/* Embeds Preview */}
          {embeds.map((embed, index) => (
            <div
              key={index}
              className="border-l-4 rounded-md overflow-hidden bg-muted/30"
              style={{ borderColor: embed.color || "#F5C400" }}
            >
              {/* Author */}
              {embed.author?.name && (
                <div className="flex items-center gap-2 px-4 pt-3">
                  {embed.author.icon_url && (
                    <img
                      src={embed.author.icon_url}
                      alt="Author"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="font-semibold text-sm text-foreground">{embed.author.name}</span>
                </div>
              )}

              {/* Title */}
              {embed.title && (
                <div className="px-4 pt-2">
                  <a
                    href={embed.url || "#"}
                    className={`font-bold text-lg ${embed.url ? "text-white hover:underline" : "text-foreground"}`}
                  >
                    {embed.title}
                  </a>
                </div>
              )}

              {/* Description */}
              {embed.description && (
                <div className="px-4 pt-2 text-foreground whitespace-pre-line">
                  {embed.description}
                </div>
              )}

              {/* Image */}
              {embed.image && (
                <div className="px-4 pt-3">
                  <img
                    src={embed.image}
                    alt="Embed image"
                    className="rounded-md max-w-full max-h-[300px] object-cover"
                  />
                </div>
              )}

              {/* Thumbnail */}
              {embed.thumbnail && (
                <div className="float-right ml-4 mt-2 px-4">
                  <img
                    src={embed.thumbnail}
                    alt="Thumbnail"
                    className="rounded-md max-w-[80px] max-h-[80px] object-cover"
                  />
                </div>
              )}

              {/* Fields */}
              {embed.fields && embed.fields.length > 0 && (
                <div className="px-4 pt-3 grid grid-cols-1 gap-3">
                  {embed.fields.map((field, idx) => (
                    <div key={idx} className={field.inline ? "inline-block mr-4" : "block"}>
                      <div className="font-semibold text-foreground">{field.name}</div>
                      <div className="text-muted-foreground">{field.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              {embed.footer?.text && (
                <div className="px-4 py-3 mt-2 text-xs text-muted-foreground border-t border-border">
                  {embed.footer.text}
                  {embed.timestamp && <span className="ml-2">• {formatDate(embed.timestamp)}</span>}
                </div>
              )}

              {!embed.footer?.text && embed.timestamp && (
                <div className="px-4 py-3 mt-2 text-xs text-muted-foreground">
                  {formatDate(embed.timestamp)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Drawer for Raw JSON */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Raw JSON</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <Textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="h-[400px] font-mono text-sm"
            />
          </div>
          <DrawerFooter>
            <Button onClick={handleSaveJson} className="bg-[#F5C400] hover:bg-[#D4A900] text-black">
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Popup Toast */}
      {popup && (
        <PopupToast
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
