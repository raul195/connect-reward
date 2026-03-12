"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Package,
  Loader2,
  ExternalLink,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import type { CatalogOrder, CatalogOrderLineItemStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  CatalogOrderLineItemStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  new: {
    label: "New",
    color: "bg-blue-100 text-blue-700",
    icon: <Clock className="h-3 w-3" />,
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="h-3 w-3" />,
  },
  exported: {
    label: "Processing",
    color: "bg-purple-100 text-purple-700",
    icon: <Package className="h-3 w-3" />,
  },
  fulfilled: {
    label: "Fulfilled",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3 w-3" />,
  },
  backordered: {
    label: "Backordered",
    color: "bg-orange-100 text-orange-700",
    icon: <Clock className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export default function OrdersPage() {
  const { profile } = useProfile();
  const [orders, setOrders] = useState<CatalogOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CatalogOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!profile?.company_id) return;

    // We need to fetch order IDs from our point_transactions
    try {
      const res = await fetch("/api/customer/catalog/orders");
      if (res.ok) {
        const { data } = await res.json();
        setOrders(data ?? []);
      }
    } catch {
      // Orders endpoint may not return a list — we'll handle this below
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/store" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">
            No orders yet. Browse the store to redeem your points!
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard/store">Browse Store</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.order_number}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedOrder(order)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      Order #{order.order_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created).toLocaleDateString()} &middot;{" "}
                      {order.line_items.length} item
                      {order.line_items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.fulfillments?.map((f) => {
                      const isFulfilled = !!f.delivered_date || !!f.virtual_code_link;
                      const isShipped = !!f.shipped_date;
                      return (
                        <Badge
                          key={f.fulfillment_id}
                          className={
                            isFulfilled
                              ? "bg-green-100 text-green-700"
                              : isShipped
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {isFulfilled ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : isShipped ? (
                            <Truck className="mr-1 h-3 w-3" />
                          ) : (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {isFulfilled
                            ? "Delivered"
                            : isShipped
                              ? "Shipped"
                              : "Processing"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order #{selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Placed on{" "}
                {new Date(selectedOrder.created).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              {/* Shipping address */}
              {selectedOrder.address_1 && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">Ship To</p>
                  <p className="text-muted-foreground">
                    {selectedOrder.given_name} {selectedOrder.surname}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedOrder.address_1}
                  </p>
                  {selectedOrder.address_2 && (
                    <p className="text-muted-foreground">
                      {selectedOrder.address_2}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {selectedOrder.city}, {selectedOrder.state_or_region}{" "}
                    {selectedOrder.postal_code}
                  </p>
                </div>
              )}

              {/* Line items */}
              <div className="space-y-2">
                <p className="font-medium">Items</p>
                {selectedOrder.line_items.map((li) => {
                  const sc =
                    STATUS_CONFIG[li.status] ?? STATUS_CONFIG.new;
                  return (
                    <div
                      key={li.line_item_id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{li.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {li.brand}
                        </p>
                      </div>
                      <Badge className={sc.color}>
                        {sc.icon}
                        <span className="ml-1">{sc.label}</span>
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Fulfillments */}
              {selectedOrder.fulfillments?.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">Tracking</p>
                  {selectedOrder.fulfillments.map((f) => (
                    <div
                      key={f.fulfillment_id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      {f.tracking_number && (
                        <p>
                          <span className="text-muted-foreground">
                            Tracking:{" "}
                          </span>
                          <span className="font-medium">
                            {f.tracking_number}
                          </span>
                          {f.shipper && (
                            <span className="text-muted-foreground">
                              {" "}
                              via {f.shipper}
                            </span>
                          )}
                        </p>
                      )}
                      {f.virtual_code_link && (
                        <p className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            Redemption link:
                          </span>
                          <a
                            href={f.virtual_code_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-teal-600 hover:underline inline-flex items-center gap-1"
                          >
                            Claim
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      )}
                      {f.virtual_code_pin && (
                        <p>
                          <span className="text-muted-foreground">PIN: </span>
                          <span className="font-mono font-medium">
                            {f.virtual_code_pin}
                          </span>
                        </p>
                      )}
                      {f.fulfillment_instructions && (
                        <p className="mt-1 text-muted-foreground">
                          {f.fulfillment_instructions}
                        </p>
                      )}
                      {f.shipped_date && (
                        <p className="text-xs text-muted-foreground">
                          Shipped:{" "}
                          {new Date(f.shipped_date).toLocaleDateString()}
                        </p>
                      )}
                      {f.delivered_date && (
                        <p className="text-xs text-muted-foreground">
                          Delivered:{" "}
                          {new Date(f.delivered_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
