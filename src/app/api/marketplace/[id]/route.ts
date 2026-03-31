import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getMasterclassListingById,
  purchaseMasterclass,
  hasUserPurchased,
} from "@/lib/db/masterclass";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { purchaseMasterclassSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await getMasterclassListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const purchased = await hasUserPurchased(id, session.user.id);
  return NextResponse.json({ ...listing, purchased });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = purchaseMasterclassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const listing = await getMasterclassListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (listing.seller_id === session.user.id) {
    return NextResponse.json({ error: "Cannot purchase your own listing" }, { status: 400 });
  }

  const alreadyPurchased = await hasUserPurchased(id, session.user.id);
  if (alreadyPurchased) {
    return NextResponse.json({ error: "Already purchased" }, { status: 400 });
  }

  // Record the purchase
  const purchase = await purchaseMasterclass(id, session.user.id, listing.price_cents);

  // Record earnings for seller in the ledger
  const sql = getDb();
  const ledgerId = nanoid();
  await sql`
    INSERT INTO earnings_ledger (id, user_id, source, amount_cents, description, reference_id)
    VALUES (${ledgerId}, ${listing.seller_id}, 'masterclass', ${listing.price_cents}, ${`Sale: ${listing.script_title}`}, ${purchase.id})
  `;

  return NextResponse.json({ success: true, purchase }, { status: 201 });
}
