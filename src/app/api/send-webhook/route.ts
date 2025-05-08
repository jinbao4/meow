// This file is no longer needed as webhook sending is now handled client-side
// for improved security. See lib/webhook.ts for the implementation.

import { NextResponse } from "next/server"

export async function GET(req: Request) {
  return NextResponse.json(
    {
      message:
        "This API endpoint has been deprecated. Webhooks are now sent directly from the client for improved security.",
    },
    { status: 410 },
  )
}

export async function POST(req: Request) {
  return NextResponse.json(
    {
      message:
        "This API endpoint has been deprecated. Webhooks are now sent directly from the client for improved security.",
    },
    { status: 410 },
  )
}
