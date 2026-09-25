import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createPublicServerClient } from "./supabase-public.server";
import type { Category, ProductDetail, ProductListItem } from "@/types/catalog";

const LIST_COLUMNS =
  "id,title,slug,short_description,price,compare_at_price,discount_percentage,page_count,rating,review_count,sales_count,format,is_free,is_featured,is_bestseller,created_at,categories(name,slug)";

type Row = Record<string, unknown> & { categories?: { name: string; slug: string } | null };

function toListItem(row: Row): ProductListItem {
  const { categories, ...rest } = row;
  return {
    ...(rest as unknown as Omit<ProductListItem, "category">),
    price: Number(rest["price"] ?? 0),
    compare_at_price: rest["compare_at_price"] == null ? null : Number(rest["compare_at_price"]),
    rating: Number(rest["rating"] ?? 0),
    category: categories ?? null,
  };
}

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  sort: z.enum(["popular", "newest", "price-asc", "price-desc", "rating"]).default("popular"),
  maxPrice: z.number().min(0).max(100000).optional(),
  minRating: z.number().min(0).max(5).optional(),
  freeOnly: z.boolean().optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(48).default(9),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = createPublicServerClient();
    let query = supabase
      .from("products")
      .select(LIST_COLUMNS, { count: "exact" })
      .eq("is_published", true);

    if (data.category) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (!cat) return { items: [] as ProductListItem[], total: 0 };
      query = query.eq("category_id", cat.id);
    }
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ");
      query = query.or(
        `title.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%`,
      );
    }
    if (data.freeOnly) query = query.eq("is_free", true);
    if (typeof data.maxPrice === "number") query = query.lte("price", data.maxPrice);
    if (typeof data.minRating === "number") query = query.gte("rating", data.minRating);

    switch (data.sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "price-asc":
        query = query.order("price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false });
        break;
      case "rating":
        query = query.order("rating", { ascending: false });
        break;
      default:
        query = query.order("sales_count", { ascending: false });
    }

    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await query.range(from, from + data.pageSize - 1);
    if (error) {
      console.error("[catalog] listProducts", error);
      throw new Error("We could not load the notes right now.");
    }
    return { items: (rows ?? []).map((r) => toListItem(r as Row)), total: count ?? 0 };
  });

export const listHomeSections = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicServerClient();
  const [featured, bestsellers, free, categories] = await Promise.all([
    supabase
      .from("products")
      .select(LIST_COLUMNS)
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("sales_count", { ascending: false })
      .limit(3),
    supabase
      .from("products")
      .select(LIST_COLUMNS)
      .eq("is_published", true)
      .eq("is_bestseller", true)
      .order("sales_count", { ascending: false })
      .limit(3),
    supabase
      .from("products")
      .select(LIST_COLUMNS)
      .eq("is_published", true)
      .eq("is_free", true)
      .order("sales_count", { ascending: false })
      .limit(2),
    supabase.from("categories").select("id,name,slug,description,sort_order").order("sort_order"),
  ]);

  const counts = await supabase
    .from("products")
    .select("category_id")
    .eq("is_published", true);

  const countMap = new Map<string, number>();
  for (const row of counts.data ?? []) {
    if (!row.category_id) continue;
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  }

  return {
    featured: (featured.data ?? []).map((r) => toListItem(r as Row)),
    bestsellers: (bestsellers.data ?? []).map((r) => toListItem(r as Row)),
    free: (free.data ?? []).map((r) => toListItem(r as Row)),
    categories: ((categories.data ?? []) as Category[]).map((c) => ({
      ...c,
      productCount: countMap.get(c.id) ?? 0,
    })),
  };
});

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,slug,description,sort_order")
    .order("sort_order");
  const { data: products } = await supabase
    .from("products")
    .select("category_id")
    .eq("is_published", true);

  const countMap = new Map<string, number>();
  for (const row of products ?? []) {
    if (!row.category_id) continue;
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  }
  return ((categories ?? []) as Category[]).map((c) => ({
    ...c,
    productCount: countMap.get(c.id) ?? 0,
  }));
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(160) }).parse(input))
  .handler(async ({ data }): Promise<ProductDetail | null> => {
    const supabase = createPublicServerClient();
    const { data: row, error } = await supabase
      .from("products")
      .select(
        `${LIST_COLUMNS},description,file_size,tags,learn_points,includes,requirements,updated_at,product_previews(id,image_url,page_label,sort_order)`,
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) console.error("[catalog] getProductBySlug", error);
    if (!row) return null;

    const { data: reviews } = await supabase
      .from("reviews")
      .select("id,rating,review,author_name,created_at")
      .eq("product_id", (row as { id: string }).id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    const { product_previews: previews, ...rest } = row as Row & {
      product_previews?: { id: string; image_url: string; page_label: string | null }[];
    };

    return {
      ...(toListItem(rest as Row) as ProductListItem),
      description: (rest["description"] as string) ?? null,
      file_size: (rest["file_size"] as string) ?? null,
      tags: (rest["tags"] as string[]) ?? [],
      learn_points: (rest["learn_points"] as string[]) ?? [],
      includes: (rest["includes"] as string[]) ?? [],
      requirements: (rest["requirements"] as string[]) ?? [],
      updated_at: rest["updated_at"] as string,
      previews: previews ?? [],
      reviews: reviews ?? [],
    };
  });

export const listRelatedProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ categorySlug: z.string().optional(), excludeSlug: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = createPublicServerClient();
    let query = supabase.from("products").select(LIST_COLUMNS).eq("is_published", true).limit(4);
    if (data.categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (cat) query = query.eq("category_id", cat.id);
    }
    const { data: rows } = await query.order("sales_count", { ascending: false });
    return (rows ?? [])
      .map((r) => toListItem(r as Row))
      .filter((p) => p.slug !== data.excludeSlug)
      .slice(0, 3);
  });

export const searchSuggestions = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ term: z.string().max(80) }).parse(input))
  .handler(async ({ data }) => {
    if (!data.term.trim()) return [] as { title: string; slug: string }[];
    const supabase = createPublicServerClient();
    const term = data.term.replace(/[%,()]/g, " ");
    const { data: rows } = await supabase
      .from("products")
      .select("title,slug")
      .eq("is_published", true)
      .ilike("title", `%${term}%`)
      .limit(6);
    return rows ?? [];
  });
