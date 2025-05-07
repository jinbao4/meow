import { NextResponse } from "next/server";
import { sendWebhook } from "@/lib/webhook"; // <-- Your existing webhook sender

function isValidUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hexToDecimal(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { webhookUrl, payload } = body;

  if (!webhookUrl || !payload) {
    return NextResponse.json({ success: false, error: "Missing webhookUrl or payload" }, { status: 400 });
  }

  try {
    // --- FULL CLEANING ---
    if (Array.isArray(payload.embeds)) {
      payload.embeds = payload.embeds.map((embed: any) => {
        // Convert color from hex to decimal number
        if (embed.color && typeof embed.color === "string") {
          embed.color = hexToDecimal(embed.color);
        }

        // Clean author
        if (embed.author) {
          const { name, icon_url } = embed.author;
          if (!name && !icon_url) {
            delete embed.author; // Delete author if both empty
          } else {
            if (icon_url && (!isValidUrl(icon_url) || icon_url.length > 1024)) {
              delete embed.author.icon_url;
            }
          }
        }

        // Clean footer
        if (embed.footer) {
          const { text } = embed.footer;
          if (!text) {
            delete embed.footer;
          }
        }

        // Clean image
        if (embed.image && (!isValidUrl(embed.image) || embed.image.length > 1024)) {
          delete embed.image;
        }

        // Clean thumbnail
        if (embed.thumbnail && (!isValidUrl(embed.thumbnail) || embed.thumbnail.length > 1024)) {
          delete embed.thumbnail;
        }

        // Clean fields
        if (Array.isArray(embed.fields)) {
          embed.fields = embed.fields.filter((field: any) => field.name && field.value);
          if (embed.fields.length === 0) {
            delete embed.fields;
          }
        }

        return embed;
      });

      // If after cleaning embeds are empty, remove embeds
      if (payload.embeds.length === 0) {
        delete payload.embeds;
      }
    }

    await sendWebhook(webhookUrl, payload);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending webhook:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
