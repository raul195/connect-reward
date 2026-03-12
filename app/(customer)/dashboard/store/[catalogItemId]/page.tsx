"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Smartphone,
  Loader2,
  Check,
  Truck,
  Zap,
} from "lucide-react";
import type { CatalogItem, CatalogStockInfo } from "@/lib/types";

export default function ItemDetailPage() {
  const { catalogItemId } = useParams<{ catalogItemId: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [stock, setStock] = useState<CatalogStockInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchItem = useCallback(async () => {
    try {
      const res = await fetch(`/api/customer/catalog/items/${catalogItemId}`);
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setItem(data.item);
      setStock(data.stock);
    } catch {
      toast.error("Failed to load item");
    }
    setLoading(false);
  }, [catalogItemId]);

  useEffect(() => {
    if (profile?.company_id && catalogItemId) {
      fetchItem();
    }
  }, [profile, catalogItemId, fetchItem]);

  async function handleAddToCart() {
    if (!item) return;
    setAdding(true);
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
      }
    } catch {
      toast.error("Failed to add to cart");
    }
    setAdding(false);
  }

  function getImages(it: CatalogItem): string[] {
    const imgs = it.images;
    const all: string[] = [];
    if (imgs?.image_500_1_1) all.push(imgs.image_500_1_1);
    if (imgs?.image_500_3_2) all.push(imgs.image_500_3_2);
    if (imgs?.image_300_1_1 && !all.length) all.push(imgs.image_300_1_1);
    return all;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-3 text-muted-foreground">Item not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/store")}>
          Back to Store
        </Button>
      </div>
    );
  }

  const images = getImages(item);
  const canAfford = (profile?.total_points ?? 0) >= item.points;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/store" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-xl bg-muted">
          {images.length > 0 ? (
            <img
              src={images[0]}
              alt={item.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              {item.fulfillment_type === "digital" ? (
                <Smartphone className="h-24 w-24 text-muted-foreground/40" />
              ) : (
                <Package className="h-24 w-24 text-muted-foreground/40" />
              )}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{item.brand}</p>
            <h1 className="text-2xl font-bold">{item.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.fulfillment_type === "digital" ? "default" : "outline"}>
              {item.fulfillment_type === "digital" ? (
                <><Zap className="mr-1 h-3 w-3" />Digital</>
              ) : (
                <><Truck className="mr-1 h-3 w-3" />Physical</>
              )}
            </Badge>
            {stock?.available !== false && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Check className="mr-1 h-3 w-3" />
                In Stock
              </Badge>
            )}
            {stock?.available === false && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-3xl font-extrabold text-amber-600">
              {item.points.toLocaleString()}{" "}
              <span className="text-base font-medium">pts</span>
            </p>
            {item.original_points > item.points && (
              <p className="text-sm text-muted-foreground line-through">
                {item.original_points.toLocaleString()} pts
              </p>
            )}
            {item.retail_price && Number(item.retail_price) > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Retail value: ${Number(item.retail_price).toFixed(2)}
              </p>
            )}
            {item.fulfillment_type === "physical" &&
              item.shipping_estimate &&
              Number(item.shipping_estimate) > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  + {Number(item.shipping_estimate).toFixed(0)} pts shipping
                </p>
              )}
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              disabled={!canAfford || !item.is_available || adding}
              onClick={handleAddToCart}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              {!item.is_available
                ? "Out of Stock"
                : !canAfford
                  ? "Not Enough Points"
                  : "Add to Cart"}
            </Button>
          </div>

          {!canAfford && item.is_available && (
            <p className="text-sm text-muted-foreground">
              You need{" "}
              <span className="font-semibold">
                {(item.points - (profile?.total_points ?? 0)).toLocaleString()}
              </span>{" "}
              more points to redeem this item.
            </p>
          )}

          {/* Description */}
          {item.description && (
            <div className="pt-4">
              <h2 className="font-semibold">Description</h2>
              <div
                className="mt-2 text-sm text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </div>
          )}

          {/* Shipping info for physical items */}
          {item.fulfillment_type === "physical" && (
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="font-medium">Shipping Information</p>
                <p className="mt-1 text-muted-foreground">
                  Physical items require a shipping address at checkout.
                  {stock?.estimated_ship_date && (
                    <>
                      {" "}Estimated ship date:{" "}
                      {new Date(stock.estimated_ship_date).toLocaleDateString()}
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
