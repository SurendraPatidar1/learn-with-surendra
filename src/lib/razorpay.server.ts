import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay payment service — server only.
 *
 * MODES
 *  - live/test keys present (RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET) -> real
 *    Razorpay Orders API + real signature verification.
 *  - keys absent -> MOCK mode: a deterministic local order id is issued and a
 *    locally-signed payload is accepted. Mock mode is for development only and
 *    is reported to the client so the UI can label it.
 *
 * RAZORPAY_KEY_SECRET is never sent to the browser.
 */

export type RazorpayMode = "live" | "mock";

export function razorpayMode(): RazorpayMode {
  return process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"] ? "live" : "mock";
}

export function publishableRazorpayKeyId(): string | null {
  return process.env["RAZORPAY_KEY_ID"] ?? null;
}

function mockSecret(): string {
  return process.env["RAZORPAY_KEY_SECRET"] ?? "mock_dev_secret";
}

export type RazorpayOrder = {
  id: string;
  amount: number; // paise
  currency: string;
  mode: RazorpayMode;
  keyId: string | null;
};

/** Creates a Razorpay order (or a mock one in development). */
export async function createRazorpayOrder(input: {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const currency = input.currency ?? "INR";

  if (razorpayMode() === "mock") {
    return {
      id: `order_mock_${input.receipt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`,
      amount: input.amountInPaise,
      currency,
      mode: "mock",
      keyId: null,
    };
  }

  const keyId = process.env["RAZORPAY_KEY_ID"]!;
  const keySecret = process.env["RAZORPAY_KEY_SECRET"]!;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency,
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
  });

  if (!response.ok) {
    console.error("[razorpay] order creation failed", response.status, await response.text());
    throw new Error("We could not start the payment. Please try again in a moment.");
  }

  const order = (await response.json()) as { id: string; amount: number; currency: string };
  return { id: order.id, amount: order.amount, currency: order.currency, mode: "live", keyId };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Verifies the checkout signature. NEVER trust the browser's success callback alone. */
export function verifyRazorpayPayment(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const expected = createHmac("sha256", mockSecret())
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");
  return safeEqual(expected, input.razorpaySignature);
}

/** Signature the mock checkout uses so the same verification path is exercised in dev. */
export function mockSignature(razorpayOrderId: string, razorpayPaymentId: string): string {
  return createHmac("sha256", mockSecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
}

/** Verifies a Razorpay webhook body against RAZORPAY_WEBHOOK_SECRET. */
export function verifyRazorpayWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
