import { ensureTable, getSetting } from "@/lib/db/integrations";

interface GhlContactData {
  email: string;
  name: string;
  tags?: string[];
  source?: string;
}

export async function syncContactToGhl(data: GhlContactData): Promise<void> {
  try {
    await ensureTable();
    const apiKey = await getSetting("gohighlevel_api_key");
    const locationId = await getSetting("gohighlevel_location_id");
    if (!apiKey || !locationId) return;

    await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        locationId,
        email: data.email,
        name: data.name,
        tags: data.tags || ["new-user"],
        source: data.source || "Line Runner",
      }),
    });
  } catch {
    // GoHighLevel sync is best-effort — never block auth flow
  }
}

export async function addTagToContact(email: string, tags: string[]): Promise<void> {
  try {
    await ensureTable();
    const apiKey = await getSetting("gohighlevel_api_key");
    const locationId = await getSetting("gohighlevel_location_id");
    if (!apiKey || !locationId) return;

    // Look up contact by email
    const searchRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: "2021-07-28",
        },
      }
    );

    if (!searchRes.ok) return;
    const searchData = await searchRes.json();
    const contactId = searchData?.contact?.id;
    if (!contactId) return;

    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({ tags }),
    });
  } catch {
    // Best-effort
  }
}
