import { NextResponse } from "next/server";
import { ensureTable, getSetting } from "@/lib/db/integrations";

export async function GET() {
  const providers: string[] = ["credentials"];

  // Check if Google OAuth is configured via env or DB
  if (process.env.GOOGLE_CLIENT_ID) {
    providers.push("google");
  } else {
    try {
      await ensureTable();
      const clientId = await getSetting("google_client_id");
      const clientSecret = await getSetting("google_client_secret");
      if (clientId && clientSecret) {
        providers.push("google");
      }
    } catch {
      // DB not available
    }
  }

  return NextResponse.json({ providers });
}
