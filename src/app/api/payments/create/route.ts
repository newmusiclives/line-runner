import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { paymentSchema } from "@/lib/validators";
import { PRICING_PLANS } from "@/lib/manifest-financial";
import { createSubscription } from "@/lib/db/subscriptions";
import { ensureTable, getSetting } from "@/lib/db/integrations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { planId, email, name } = parsed.data;
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const amountCents = Math.round(plan.price * 100);

  // Try real Manifest Financial payment if configured
  await ensureTable();
  const manifestUrl = await getSetting("manifest_api_url");
  const manifestKey = await getSetting("manifest_secret_key");

  let transactionId: string;
  let mode: "live" | "simulated";

  if (manifestUrl && manifestKey) {
    // Real payment processing
    try {
      const payRes = await fetch(`${manifestUrl}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${manifestKey}`,
        },
        body: JSON.stringify({
          amount: amountCents,
          currency: "usd",
          description: `Line Runner - ${plan.name}`,
          customer_email: email,
          customer_name: name,
          metadata: { plan_id: plan.id, plan_period: plan.period },
        }),
      });

      if (!payRes.ok) {
        const errText = await payRes.text();
        return NextResponse.json(
          { error: "Payment failed", details: errText },
          { status: 402 }
        );
      }

      const payData = await payRes.json();
      transactionId = payData.id || payData.transaction_id || payData.payment_id;
      mode = "live";
    } catch (err: any) {
      return NextResponse.json(
        { error: "Payment processing error", details: err.message },
        { status: 502 }
      );
    }
  } else {
    // Simulated payment — no Manifest keys configured
    transactionId = `sim_${Date.now()}`;
    mode = "simulated";
  }

  const subscription = await createSubscription(
    session.user.id,
    plan.id,
    amountCents,
    plan.period,
    plan.costBreakdown.includedMinutes,
    plan.costBreakdown.includedVoices,
    transactionId
  );

  // Send welcome email via GoHighLevel if configured
  await sendGhlWelcomeEmail(email, name, plan.name).catch(() => {});

  return NextResponse.json({ success: true, subscription, mode }, { status: 201 });
}

async function sendGhlWelcomeEmail(email: string, name: string, planName: string) {
  const ghlKey = await getSetting("gohighlevel_api_key");
  const locationId = await getSetting("gohighlevel_location_id");
  if (!ghlKey || !locationId) return;

  // Create or update contact in GoHighLevel
  await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ghlKey}`,
      "Content-Type": "application/json",
      Version: "2021-07-28",
    },
    body: JSON.stringify({
      locationId,
      email,
      name,
      tags: [`plan:${planName.toLowerCase()}`, "new-subscriber"],
      source: "Line Runner",
    }),
  });
}
