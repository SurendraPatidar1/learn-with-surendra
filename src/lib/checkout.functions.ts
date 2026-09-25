import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Checkout / payment server functions.
 *
 * Flow: createCheckout -> Razorpay Checkout (or mock) -> verifyPayment
 * (server-side signature check) -> order marked paid -> entitlement granted.
 * The browser's "payment succeeded" claim is never trusted on its own.
 */

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const couponSchema = z.object({ code: z.string().trim().min(2).max(40), amount: z.number().min(0) });

/** Server-side coupon validation. The client never computes the final price. */
export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => couponSchema.parse(input))
  .handler(async ({ data }) => {
    const db = await adminClient();
    const { data: coupon } = await db
      .from("coupons")
      .select("*")
      .eq("code", data.code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon) return { ok: false as const, message: "That coupon code is not valid." };
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return { ok: false as const, message: "This coupon has expired." };
    if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit)
      return { ok: false as const, message: "This coupon has reached its usage limit." };
    if (data.amount < Number(coupon.min_order_value))
      return {
        ok: false as const,
        message: `This coupon needs a minimum order of ₹${Number(coupon.min_order_value)}.`,
      };

    let discount =
      coupon.discount_type === "percentage"
        ? (data.amount * Number(coupon.discount_value)) / 100
        : Number(coupon.discount_value);
    if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount));
    discount = Math.min(Math.round(discount), data.amount);

    return {
      ok: true as const,
      code: coupon.code,
      discount,
      total: data.amount - discount,
      message: `Coupon ${coupon.code} applied.`,
    };
  });

/** Creates a pending order (+ Razorpay order) for one product. */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ productId: z.string().uuid(), couponCode: z.string().trim().max(40).optional() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { createRazorpayOrder, razorpayMode, publishableRazorpayKeyId } = await import(
      "./razorpay.server"
    );
    const db = await adminClient();

    const { data: product } = await db
      .from("products")
      .select("id,title,price,is_free,is_published")
      .eq("id", data.productId)
      .maybeSingle();
    if (!product || !product.is_published) throw new Error("This product is not available.");

    // Already owned?
    const { data: owned } = await db
      .from("order_items")
      .select("id,orders!inner(status)")
      .eq("user_id", context.userId)
      .eq("product_id", product.id)
      .eq("orders.status", "paid")
      .maybeSingle();
    if (owned) return { alreadyOwned: true as const };

    // Server-side pricing. Never accept a price from the client.
    const subtotal = Number(product.price);
    let discount = 0;
    let appliedCode: string | null = null;

    if (data.couponCode && subtotal > 0) {
      const { data: coupon } = await db
        .from("coupons")
        .select("*")
        .eq("code", data.couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      if (
        coupon &&
        (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
        (coupon.usage_limit == null || coupon.used_count < coupon.usage_limit) &&
        subtotal >= Number(coupon.min_order_value)
      ) {
        let value =
          coupon.discount_type === "percentage"
            ? (subtotal * Number(coupon.discount_value)) / 100
            : Number(coupon.discount_value);
        if (coupon.max_discount != null) value = Math.min(value, Number(coupon.max_discount));
        discount = Math.min(Math.round(value), subtotal);
        appliedCode = coupon.code;
      }
    }

    const total = subtotal - discount;

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        user_id: context.userId,
        subtotal,
        discount_amount: discount,
        total_amount: total,
        coupon_code: appliedCode,
        status: total === 0 ? "paid" : "pending",
      })
      .select("id")
      .single();
    if (orderError || !order) {
      console.error("[checkout] order insert", orderError);
      throw new Error("We could not start your order. Please try again.");
    }

    await db.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      user_id: context.userId,
      title_snapshot: product.title,
      unit_price: total,
    });

    // Free product: granted immediately, no payment step.
    if (total === 0) {
      await db.from("products").update({ sales_count: undefined }).eq("id", product.id);
      await db.from("notifications").insert({
        user_id: context.userId,
        title: "Free resource added",
        body: `${product.title} is now in your library.`,
        type: "success",
      });
      return { free: true as const, orderId: order.id };
    }

    const rzp = await createRazorpayOrder({
      amountInPaise: Math.round(total * 100),
      receipt: order.id,
      notes: { order_id: order.id, product: product.title },
    });

    await db
      .from("orders")
      .update({ razorpay_order_id: rzp.id })
      .eq("id", order.id);
    await db.from("payments").insert({
      order_id: order.id,
      user_id: context.userId,
      razorpay_order_id: rzp.id,
      amount: total,
      status: "created",
    });

    return {
      free: false as const,
      orderId: order.id,
      razorpayOrderId: rzp.id,
      amount: rzp.amount,
      currency: rzp.currency,
      mode: razorpayMode(),
      keyId: publishableRazorpayKeyId(),
      productTitle: product.title,
    };
  });

/** Verifies a Razorpay signature server-side and grants access on success. */
export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        razorpayPaymentId: z.string().min(4).max(120),
        razorpaySignature: z.string().min(8).max(256),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { verifyRazorpayPayment } = await import("./razorpay.server");
    const db = await adminClient();

    const { data: order } = await db
      .from("orders")
      .select("id,user_id,total_amount,status,razorpay_order_id,coupon_code")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order || order.user_id !== context.userId) throw new Error("Order not found.");
    if (order.status === "paid") return { ok: true as const, orderId: order.id };
    if (!order.razorpay_order_id) throw new Error("This order has no payment attached.");

    const valid = verifyRazorpayPayment({
      razorpayOrderId: order.razorpay_order_id,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
    });

    if (!valid) {
      await db.from("orders").update({ status: "failed" }).eq("id", order.id);
      await db
        .from("payments")
        .update({ status: "failed", razorpay_payment_id: data.razorpayPaymentId })
        .eq("order_id", order.id);
      return { ok: false as const, message: "We could not verify this payment." };
    }

    await db.from("orders").update({ status: "paid" }).eq("id", order.id);
    await db
      .from("payments")
      .update({
        status: "captured",
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
      })
      .eq("order_id", order.id);

    if (order.coupon_code) {
      const { data: coupon } = await db
        .from("coupons")
        .select("id,used_count")
        .eq("code", order.coupon_code)
        .maybeSingle();
      if (coupon) {
        await db
          .from("coupons")
          .update({ used_count: coupon.used_count + 1 })
          .eq("id", coupon.id);
        await db
          .from("coupon_usage")
          .insert({ coupon_id: coupon.id, user_id: context.userId, order_id: order.id });
      }
    }

    await db.from("notifications").insert({
      user_id: context.userId,
      title: "Payment successful",
      body: "Your purchase is ready in My Purchases.",
      type: "success",
    });

    return { ok: true as const, orderId: order.id };
  });

/** Dev-only helper: signs the mock payment so the real verification path runs. */
export const mockPaymentSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { razorpayMode, mockSignature } = await import("./razorpay.server");
    if (razorpayMode() !== "mock") throw new Error("Mock payments are disabled.");

    const db = await adminClient();
    const { data: order } = await db
      .from("orders")
      .select("id,user_id,razorpay_order_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== context.userId || !order.razorpay_order_id)
      throw new Error("Order not found.");

    const paymentId = `pay_mock_${order.id.replace(/-/g, "").slice(0, 14)}`;
    return {
      razorpayPaymentId: paymentId,
      razorpaySignature: mockSignature(order.razorpay_order_id, paymentId),
    };
  });
