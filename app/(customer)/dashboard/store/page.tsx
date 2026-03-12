"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ShoppingCart,
  Gift,
  Package,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import type { CatalogItem, CatalogCategory, CatalogBrand } from "@/lib/types";

export default function StorePage() {
  const { profile } = useProfile();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [brandId, setBrandId] = useState<string>("all");
  const [fulfillmentType, setFulfillmentType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryId !== "all") params.set("category_id", categoryId);
      if (brandId !== "all") params.set("brand_id", brandId);
      if (fulfillmentType !== "all") params.set("fulfillment_type", fulfillmentType);
      params.set("page", String(page));
      params.set("per_page", "24");

      const res = await fetch(`/api/customer/catalog/items?${params}`);
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setItems(data.items ?? []);
      setTotalPages(data.total_pages ?? 1);
      setTotalItems(data.total_items ?? 0);
    } catch {
      toast.error("Failed to load catalog");
    }
    setLoading(false);
  }, [search, categoryId, brandId, fulfillmentType, page]);

  const fetchFilters = useCallback(async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch("/api/customer/catalog/categories"),
        fetch("/api/customer/catalog/brands"),
      ]);
      if (catRes.ok) {
        const { data } = await catRes.json();
        setCategories(flattenCategories(data.categories ?? []));
      }
      if (brandRes.ok) {
        const { data } = await brandRes.json();
        setBrands(data.brands ?? []);
      }
    } catch {
      // non-critical
    }
  }, []);

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/catalog/cart");
      if (res.ok) {
        const { data } = await res.json();
        setCartCount(data.total_line_items ?? 0);
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (profile?.company_id) {
      fetchItems();
    }
  }, [profile, fetchItems]);

  useEffect(() => {
    if (profile?.company_id) {
      fetchFilters();
      fetchCartCount();
    }
  }, [profile, fetchFilters, fetchCartCount]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  async function handleAddToCart(item: CatalogItem) {
    setAddingToCart(item.catalog_item_id);
    try {
      const res = await fetch("/api/customer/catalog/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ catalog_item_id: item.catalog_item_id }],
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to add to cart");
      } else {
        toast.success(`${item.name} added to cart`);
        setCartCount((c) => c + 1);
      }
    } catch {
      toast.error("Failed to add to cart");
    }
    setAddingToCart(null);
  }

  function getItemImage(item: CatalogItem): string | null {
    const imgs = item.images;
    return (
      imgs?.image_300_1_1 ||
      imgs?.image_300_3_2 ||
      imgs?.image_150_1_1 ||
      imgs?.image_500_1_1 ||
      null
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reward Store</h1>
          <p className="text-muted-foreground">
            Your balance:{" "}
            <span className="font-bold text-foreground">
              {(profile?.total_points ?? 0).toLocaleString()} pts
            </span>
          </p>
        </div>
        <Link href="/dashboard/store/cart">
          <Button variant="outline" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white hover:bg-amber-500">
                {cartCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search rewards..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="flex flex-wrap gap-4 p-4">
            <div className="w-48">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Category
              </label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.category_id} value={String(c.category_id)}>
                      {c.display_name} ({c.num_items})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Brand
              </label>
              <Select
                value={brandId}
                onValueChange={(v) => {
                  setBrandId(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.brand_id} value={String(b.brand_id)}>
                      {b.display_name} ({b.num_items})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Type
              </label>
              <Select
                value={fulfillmentType}
                onValueChange={(v) => {
                  setFulfillmentType(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(categoryId !== "all" ||
              brandId !== "all" ||
              fulfillmentType !== "all" ||
              search) && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryId("all");
                    setBrandId("all");
                    setFulfillmentType("all");
                    setSearch("");
                    setSearchInput("");
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results info */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {totalItems.toLocaleString()} item{totalItems !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No items found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const img = getItemImage(item);
            const canAfford = (profile?.total_points ?? 0) >= item.points;
            const isAdding = addingToCart === item.catalog_item_id;

            return (
              <Card key={item.catalog_item_id} className="group overflow-hidden">
                <Link href={`/dashboard/store/${item.catalog_item_id}`}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {img ? (
                      <img
                        src={img}
                        alt={item.name}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {item.fulfillment_type === "digital" ? (
                          <Smartphone className="h-16 w-16 text-muted-foreground/40" />
                        ) : (
                          <Package className="h-16 w-16 text-muted-foreground/40" />
                        )}
                      </div>
                    )}
                    {item.fulfillment_type === "digital" && (
                      <Badge className="absolute right-2 top-2 bg-teal-600 text-white hover:bg-teal-600">
                        Digital
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{item.brand}</p>
                  <Link href={`/dashboard/store/${item.catalog_item_id}`}>
                    <h3 className="mt-1 font-semibold leading-tight line-clamp-2 hover:text-teal-600">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="mt-2 text-lg font-extrabold text-amber-600">
                    {item.points.toLocaleString()}{" "}
                    <span className="text-sm font-medium">pts</span>
                  </p>
                  {item.original_points > item.points && (
                    <p className="text-xs text-muted-foreground line-through">
                      {item.original_points.toLocaleString()} pts
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white"
                    disabled={!canAfford || !item.is_available || isAdding}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(item);
                    }}
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : !item.is_available ? (
                      "Out of Stock"
                    ) : !canAfford ? (
                      "Not Enough Points"
                    ) : (
                      "Add to Cart"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/** Flatten nested category tree into a flat array */
function flattenCategories(cats: CatalogCategory[]): CatalogCategory[] {
  const result: CatalogCategory[] = [];
  function walk(list: CatalogCategory[]) {
    for (const c of list) {
      result.push(c);
      if (c.categories?.length) walk(c.categories);
    }
  }
  walk(cats);
  return result;
}
