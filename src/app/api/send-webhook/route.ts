import { NextResponse } from "next/server"

function isValidUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function isValidMediaUri(url: string) {
  // Guilded requires media URIs to be from specific domains or have specific formats
  if (!isValidUrl(url)) return false
  
  const validDomains = [
    "media.guilded.gg",
    "img.guildedcdn.com",
    "s3-us-west-2.amazonaws.com/www.guilded.gg",
    "cdn.discordapp.com",
    "i.imgur.com",
    "imgur.com",
    "i.ibb.co",
    "ibb.co",
    "tenor.com",
    "media.tenor.com",
    "giphy.com",
    "media.giphy.com",
    "gfycat.com"
  ]
  
  try {
    const { hostname } = new URL(url)
    return validDomains.some(domain => hostname.includes(domain) || hostname.endsWith(domain))
  } catch {
    return false
  }
}

function hexToDecimal(hex: string): number {
  if (!hex.startsWith("#")) return parseInt(hex, 16)
  return parseInt(hex.replace("#", ""), 16)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { webhookUrl, payload } = body

  if (!webhookUrl || !payload) {
    return NextResponse.json({ success: false, error: "Missing webhookUrl or payload" }, { status: 400 })
  }

  try {
    // --- FULL CLEANING ---
    if (Array.isArray(payload.embeds)) {
      payload.embeds = payload.embeds.map((embed: any) => {
        // Convert color from hex to decimal number
        if (embed.color && typeof embed.color === "string") {
          embed.color = hexToDecimal(embed.color)
        }

        // Clean author
        if (embed.author) {
          const { name, icon_url } = embed.author
          if (!name && !icon_url) {
            delete embed.author // Delete author if both empty
          } else {
            if (icon_url) {
              if (!isValidMediaUri(icon_url)) {
                delete embed.author.icon_url
              }
            }
          }
        }

        // Clean footer
        if (embed.footer) {
          const { text } = embed.footer
          if (!text) {
            delete embed.footer
          }
        }

        // Clean image
        if (embed.image) {
          if (!isValidUrl(embed.image) || embed.image.length > 1024) {
            delete embed.image
          }
        }

        // Clean thumbnail
        if (embed.thumbnail) {
          if (!isValidUrl(embed.thumbnail) || embed.thumbnail.length > 1024) {
            delete embed.thumbnail
          }
        }

        // Clean fields
        if (Array.isArray(embed.fields)) {
          embed.fields = embed.fields.filter((field: any) => field.name && field.value)
          if (embed.fields.length === 0) {
            delete embed.fields
          }
        }

        return embed
      })

      // If after cleaning embeds are empty, remove embeds
      if (payload.embeds.length === 0) {
        delete payload.embeds
      }
    }

    // Send to Guilded webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { success: false, error: `${response.status} ${response.statusText} | ${errorText}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending webhook:", error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
