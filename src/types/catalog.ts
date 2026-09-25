export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type ProductListItem = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  discount_percentage: number;
  page_count: number | null;
  rating: number;
  review_count: number;
  sales_count: number;
  format: string;
  is_free: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  created_at: string;
  category: { name: string; slug: string } | null;
};

export type ProductDetail = ProductListItem & {
  description: string | null;
  file_size: string | null;
  tags: string[];
  learn_points: string[];
  includes: string[];
  requirements: string[];
  updated_at: string;
  previews: { id: string; image_url: string; page_label: string | null }[];
  reviews: {
    id: string;
    rating: number;
    review: string | null;
    author_name: string | null;
    created_at: string;
  }[];
};

export type SortKey = "popular" | "newest" | "price-asc" | "price-desc" | "rating";
