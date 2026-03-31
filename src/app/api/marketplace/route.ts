import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  listMasterclassListings,
  createMasterclassListing,
  getSellerEarnings,
  getSellerListings,
} from "@/lib/db/masterclass";
import { createMasterclassSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const sellerOnly = searchParams.get("seller") === "true";

  if (sellerOnly) {
    const listings = await getSellerListings(session.user.id);
    const earnings = await getSellerEarnings(session.user.id);
    return NextResponse.json({ listings, earnings });
  }

  const listings = await listMasterclassListings(search);
  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createMasterclassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { scriptTitle, price, description, annotationNotes } = parsed.data;
  const priceCents = Math.round(price * 100);

  const listing = await createMasterclassListing(
    session.user.id,
    scriptTitle,
    priceCents,
    description,
    annotationNotes || null
  );

  return NextResponse.json(listing, { status: 201 });
}
