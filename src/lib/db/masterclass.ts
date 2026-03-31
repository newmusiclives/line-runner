import { getDb } from "./index";
import { nanoid } from "nanoid";

export interface DbMasterclassListing {
  id: string;
  seller_id: string;
  script_title: string;
  take_id: string | null;
  price_cents: number;
  description: string;
  audio_commentary_url: string | null;
  annotation_notes: string | null;
  rating: number;
  review_count: number;
  purchase_count: number;
  status: "active" | "draft" | "removed";
  created_at: string;
}

export interface MasterclassListingWithSeller extends DbMasterclassListing {
  seller_name: string;
  seller_email: string;
}

export interface DbMasterclassPurchase {
  id: string;
  listing_id: string;
  buyer_id: string;
  amount_cents: number;
  purchased_at: string;
}

export async function createMasterclassListing(
  sellerId: string,
  scriptTitle: string,
  priceCents: number,
  description: string,
  annotationNotes: string | null
): Promise<DbMasterclassListing> {
  const sql = getDb();
  const id = nanoid();
  await sql`
    INSERT INTO masterclass_listings (id, seller_id, script_title, price_cents, description, annotation_notes, status)
    VALUES (${id}, ${sellerId}, ${scriptTitle}, ${priceCents}, ${description}, ${annotationNotes}, 'active')
  `;
  return (await getMasterclassListingById(id))!;
}

export async function getMasterclassListingById(
  id: string
): Promise<MasterclassListingWithSeller | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT ml.*, u.name as seller_name, u.email as seller_email
    FROM masterclass_listings ml
    JOIN users u ON ml.seller_id = u.id
    WHERE ml.id = ${id}
  `;
  return (rows[0] as MasterclassListingWithSeller) ?? null;
}

export async function listMasterclassListings(
  search?: string
): Promise<MasterclassListingWithSeller[]> {
  const sql = getDb();
  if (search) {
    const pattern = `%${search}%`;
    const rows = await sql`
      SELECT ml.*, u.name as seller_name, u.email as seller_email
      FROM masterclass_listings ml
      JOIN users u ON ml.seller_id = u.id
      WHERE ml.status = 'active'
        AND (ml.script_title ILIKE ${pattern} OR u.name ILIKE ${pattern} OR ml.description ILIKE ${pattern})
      ORDER BY ml.purchase_count DESC, ml.created_at DESC
    `;
    return rows as MasterclassListingWithSeller[];
  }
  const rows = await sql`
    SELECT ml.*, u.name as seller_name, u.email as seller_email
    FROM masterclass_listings ml
    JOIN users u ON ml.seller_id = u.id
    WHERE ml.status = 'active'
    ORDER BY ml.purchase_count DESC, ml.created_at DESC
  `;
  return rows as MasterclassListingWithSeller[];
}

export async function purchaseMasterclass(
  listingId: string,
  buyerId: string,
  amountCents: number
): Promise<DbMasterclassPurchase> {
  const sql = getDb();
  const id = nanoid();
  await sql`
    INSERT INTO masterclass_purchases (id, listing_id, buyer_id, amount_cents)
    VALUES (${id}, ${listingId}, ${buyerId}, ${amountCents})
  `;
  await sql`
    UPDATE masterclass_listings
    SET purchase_count = purchase_count + 1
    WHERE id = ${listingId}
  `;
  const rows = await sql`SELECT * FROM masterclass_purchases WHERE id = ${id}`;
  return rows[0] as DbMasterclassPurchase;
}

export async function hasUserPurchased(
  listingId: string,
  userId: string
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    SELECT 1 FROM masterclass_purchases
    WHERE listing_id = ${listingId} AND buyer_id = ${userId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function getSellerEarnings(
  sellerId: string
): Promise<{ total_cents: number; listing_count: number; total_purchases: number }> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      COALESCE(SUM(mp.amount_cents), 0) as total_cents,
      COUNT(DISTINCT ml.id) as listing_count,
      COUNT(mp.id) as total_purchases
    FROM masterclass_listings ml
    LEFT JOIN masterclass_purchases mp ON mp.listing_id = ml.id
    WHERE ml.seller_id = ${sellerId} AND ml.status = 'active'
  `;
  return {
    total_cents: Number(rows[0]?.total_cents ?? 0),
    listing_count: Number(rows[0]?.listing_count ?? 0),
    total_purchases: Number(rows[0]?.total_purchases ?? 0),
  };
}

export async function getSellerListings(
  sellerId: string
): Promise<DbMasterclassListing[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM masterclass_listings
    WHERE seller_id = ${sellerId}
    ORDER BY created_at DESC
  `;
  return rows as DbMasterclassListing[];
}
