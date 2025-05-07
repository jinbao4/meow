export async function sendWebhook(webhookUrl: string, payload: any) {
  // We'll let the API route handle the conversion and validation
  const response = await fetch("/api/send-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webhookUrl,
      payload,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to send webhook")
  }

  return await response.json()
}
