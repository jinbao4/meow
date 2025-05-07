// src/lib/webhook.ts
export async function sendWebhook(url: string, payload: any) {
    // Clone the payload to avoid mutating original
    const cleanPayload = { ...payload };
  
    // If embeds exist but are empty, remove them
    if (Array.isArray(cleanPayload.embeds) && cleanPayload.embeds.length === 0) {
      delete cleanPayload.embeds;
    }
  
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanPayload),
    });
  
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send: ${res.status} ${res.statusText} | ${text}`);
    }
  }
  