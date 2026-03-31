import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { nanoid } from "nanoid";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deliveryId = searchParams.get("id");

  // Public access for single delivery lookup (client-facing page)
  if (deliveryId) {
    const sql = getDb();
    const rows = await sql`
      SELECT id, project_title, client_name, client_email, audio_file_name,
             hours_worked, hourly_rate, invoice_amount, usage_rights, usage_duration,
             status, delivery_link, created_at
      FROM client_deliveries
      WHERE id = ${deliveryId}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return Response.json({ error: "Delivery not found" }, { status: 404 });
    }
    return Response.json({ delivery: rows[0] });
  }

  // Authenticated list of all deliveries
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const rows = await sql`
    SELECT id, project_title, client_name, client_email, audio_file_name,
           hours_worked, hourly_rate, invoice_amount, usage_rights, usage_duration,
           status, delivery_link, created_at
    FROM client_deliveries
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return Response.json({ deliveries: rows });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const {
    project_title, client_name, client_email, audio_file_name,
    hours_worked, hourly_rate, usage_rights, usage_duration,
  } = body;

  if (!project_title || !client_name || !client_email) {
    return Response.json({ error: "project_title, client_name, and client_email are required" }, { status: 400 });
  }

  const id = nanoid();
  const invoiceAmount = (hours_worked || 0) * (hourly_rate || 0);
  const deliveryLink = `/delivery/${id}`;

  await sql`
    INSERT INTO client_deliveries (
      id, user_id, project_title, client_name, client_email, audio_file_name,
      hours_worked, hourly_rate, invoice_amount, usage_rights, usage_duration,
      status, delivery_link, created_at
    ) VALUES (
      ${id}, ${userId}, ${project_title}, ${client_name}, ${client_email},
      ${audio_file_name || ""}, ${hours_worked || 0}, ${hourly_rate || 0},
      ${invoiceAmount}, ${usage_rights || ""}, ${usage_duration || ""},
      ${"pending"}, ${deliveryLink}, NOW()
    )
  `;

  return Response.json({ id, delivery_link: deliveryLink });
}

export async function PUT(request: Request) {
  const session = await auth();
  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return Response.json({ error: "id and status are required" }, { status: 400 });
  }

  const validStatuses = ["pending", "approved", "paid"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const sql = getDb();

  // Allow public status update (client approving) or authenticated updates
  if (status === "approved") {
    // Client can approve without auth
    await sql`
      UPDATE client_deliveries SET status = ${status} WHERE id = ${id}
    `;
    return Response.json({ success: true });
  }

  // Other status changes require auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  await sql`
    UPDATE client_deliveries SET status = ${status} WHERE id = ${id} AND user_id = ${userId}
  `;

  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  await sql`
    DELETE FROM client_deliveries WHERE id = ${id} AND user_id = ${userId}
  `;

  return Response.json({ success: true });
}
