import { captureException } from "@/lib/error-tracking";

export async function POST(request: Request) {
  const { message, stack } = await request.json();
  const error = new Error(message || "Client-side error");
  if (stack) error.stack = stack;
  await captureException(error, { source: "client" });
  return Response.json({ ok: true });
}
