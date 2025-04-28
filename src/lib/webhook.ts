// src/lib/webhook.ts
export async function sendWebhook(url: string, payload: any) {
    const res = await fetch(url, {
      method: "POST",          // 🔥 POST POST POST
      headers: {
        "Content-Type": "application/json",  // 🔥 Correct header
      },
      body: JSON.stringify(payload),         // 🔥 Correct body
    })
  
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Failed to send: ${res.status} ${res.statusText} | ${text}`)
    }
  }
  