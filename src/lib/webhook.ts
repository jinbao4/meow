// Client-side webhook implementation with rate limiting
// This avoids proxying requests through a server, improving security

// Rate limiting implementation
const RATE_LIMIT = {
  MAX_REQUESTS: 5,
  TIME_WINDOW: 60 * 1000, // 1 minute in milliseconds
  requests: new Map<string, { count: number; timestamp: number }>(),
}

/**
 * Client-side webhook sender with rate limiting
 * This sends webhooks directly from the client browser to Guilded
 * without any server intermediary for improved security
 */
export async function sendWebhook(webhookUrl: string, payload: any) {
  // Validate webhook URL
  if (!webhookUrl.startsWith("https://media.guilded.gg/webhooks/")) {
    throw new Error("Invalid webhook URL. Must be a Guilded webhook URL.")
  }

  // Apply rate limiting
  const clientId = getClientId()
  const now = Date.now()
  const clientRequests = RATE_LIMIT.requests.get(clientId) || { count: 0, timestamp: now }

  // Reset counter if time window has passed
  if (now - clientRequests.timestamp > RATE_LIMIT.TIME_WINDOW) {
    clientRequests.count = 0
    clientRequests.timestamp = now
  }

  // Check if rate limit exceeded
  if (clientRequests.count >= RATE_LIMIT.MAX_REQUESTS) {
    const timeLeft = Math.ceil((RATE_LIMIT.TIME_WINDOW - (now - clientRequests.timestamp)) / 1000)
    throw new Error(`Rate limit exceeded. Please try again in ${timeLeft} seconds.`)
  }

  // Process payload
  const processedPayload = processPayload(payload)

  try {
    // Send directly to Guilded webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedPayload),
    })

    // Update rate limit counter
    clientRequests.count++
    RATE_LIMIT.requests.set(clientId, clientRequests)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`${response.status} ${response.statusText} | ${errorText}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error sending webhook:", error.message)
    throw error
  }
}

// Generate a unique client ID for rate limiting
function getClientId(): string {
  let clientId = localStorage.getItem("guilded_client_id")
  if (!clientId) {
    clientId = Math.random().toString(36).substring(2, 15)
    localStorage.setItem("guilded_client_id", clientId)
  }
  return clientId
}

// Process and clean the payload before sending
function processPayload(payload: any): any {
  const processedPayload = { ...payload }

  // Convert hex colors to decimal
  if (Array.isArray(processedPayload.embeds)) {
    processedPayload.embeds = processedPayload.embeds.map((embed: any) => {
      const processedEmbed = { ...embed }

      // Convert color from hex to decimal number
      if (processedEmbed.color && typeof processedEmbed.color === "string") {
        processedEmbed.color = hexToDecimal(processedEmbed.color)
      }

      // Clean author
      if (processedEmbed.author) {
        const { name, icon_url } = processedEmbed.author
        if (!name && !icon_url) {
          delete processedEmbed.author // Delete author if both empty
        } else if (icon_url && !isValidMediaUri(icon_url)) {
          delete processedEmbed.author.icon_url
        }
      }

      // Clean footer
      if (processedEmbed.footer && !processedEmbed.footer.text) {
        delete processedEmbed.footer
      }

      // Clean image
      if (processedEmbed.image && (!isValidUrl(processedEmbed.image) || processedEmbed.image.length > 1024)) {
        delete processedEmbed.image
      }

      // Clean thumbnail
      if (
        processedEmbed.thumbnail &&
        (!isValidUrl(processedEmbed.thumbnail) || processedEmbed.thumbnail.length > 1024)
      ) {
        delete processedEmbed.thumbnail
      }

      // Clean fields
      if (Array.isArray(processedEmbed.fields)) {
        processedEmbed.fields = processedEmbed.fields.filter((field: any) => field.name && field.value)
        if (processedEmbed.fields.length === 0) {
          delete processedEmbed.fields
        }
      }

      return processedEmbed
    })

    // If after cleaning embeds are empty, remove embeds
    if (processedPayload.embeds.length === 0) {
      delete processedPayload.embeds
    }
  }

  return processedPayload
}

// Helper functions
function hexToDecimal(hex: string): number {
  if (!hex.startsWith("#")) return Number.parseInt(hex, 16)
  return Number.parseInt(hex.replace("#", ""), 16)
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function isValidMediaUri(url: string): boolean {
  return isValidUrl(url)
}
