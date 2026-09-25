import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Student library: purchases, entitlement-checked downloads, dashboard stats. */

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getMyLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;

    const [{ data: items }, { data: downloads }, { data: wishlist }] = await Promise.all([
      db
        .from("order_items")
        .select(
          "id,unit_price,created_at,order_id,products(id,title,slug,page_count,format,thumbnail_url,categories(name,slug)),orders!inner(status,created_at)",
        )
        .eq("user_id", context.userId)
        .eq("orders.status", "paid")
        .order("created_at", { ascending: false }),
      db
        .from("downloads")
        .select("id,created_at,products(title,slug)")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("wishlist")
        .select("id,created_at,products(id,title,slug,price,compare_at_price,is_free,rating,page_count,categories(name,slug))")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false }),
    ]);

    return {
      purchases: items ?? [],
      downloads: downloads ?? [],
      wishlist: wishlist ?? [],
    };
  });

/** True when the signed-in user owns this product through a paid order. */
async function hasEntitlement(userId: string, productId: string) {
  const db = await adminClient();
  const { data } = await db
    .from("order_items")
    .select("id,order_id,orders!inner(status)")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("orders.status", "paid")
    .maybeSingle();
  return data ?? null;
}

/**
 * Entitlement-gated download. The permanent private path is never returned —
 * only a short-lived signed URL, and only to a verified purchaser.
 */
export const getDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ productId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const db = await adminClient();

    const entitlement = await hasEntitlement(context.userId, data.productId);
    if (!entitlement) {
      return { ok: false as const, message: "You do not have access to this file yet." };
    }

    const { data: product } = await db
      .from("products")
      .select("id,title,file_path")
      .eq("id", data.productId)
      .maybeSingle();

    if (!product?.file_path) {
      return {
        ok: false as const,
        message: "This file has not been uploaded yet. Please check back shortly.",
      };
    }

    const { data: signed, error } = await db.storage
      .from("product-files")
      .createSignedUrl(product.file_path, 120, { download: `${product.title}.pdf` });

    if (error || !signed) {
      console.error("[library] signed url", error);
      return { ok: false as const, message: "The download could not be prepared. Try again." };
    }

    await db.from("downloads").insert({
      user_id: context.userId,
      product_id: product.id,
      order_id: entitlement.order_id,
    });

    return { ok: true as const, url: signed.signedUrl };
  });

export const getDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const [purchases, downloads, wishlist, profile] = await Promise.all([
      db
        .from("order_items")
        .select("id,orders!inner(status)", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("orders.status", "paid"),
      db
        .from("downloads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
      db
        .from("wishlist")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
      db.from("profiles").select("full_name,email,avatar_url,phone,created_at").eq("id", context.userId).maybeSingle(),
    ]);

    return {
      purchaseCount: purchases.count ?? 0,
      downloadCount: downloads.count ?? 0,
      wishlistCount: wishlist.count ?? 0,
      profile: profile.data ?? null,
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(80),
        phone: z.string().trim().max(20).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone || null })
      .eq("id", context.userId);
    if (error) {
      console.error("[library] updateMyProfile", error);
      throw new Error("We could not save your profile. Please try again.");
    }
    return { ok: true as const };
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        review: z.string().trim().max(1000).optional(),
        authorName: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // RLS additionally enforces "purchasers only" on insert.
    const { error } = await context.supabase.from("reviews").upsert(
      {
        product_id: data.productId,
        user_id: context.userId,
        rating: data.rating,
        review: data.review ?? null,
        author_name: data.authorName ?? null,
        status: "approved",
      },
      { onConflict: "product_id,user_id" },
    );
    if (error) {
      return { ok: false as const, message: "Only verified purchasers can review this resource." };
    }
    return { ok: true as const };
  });

export const getMyEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ productId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const entitlement = await hasEntitlement(context.userId, data.productId);
    return { owned: Boolean(entitlement) };
  });
