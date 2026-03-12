"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Trash2,
  ShoppingCart,
  Loader2,
  Package,
  Smartphone,
  MapPin,
} from "lucide-react";
import type { CatalogCart, CatalogCartLineItem } from "@/lib/types";

export default function CartPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [cart, setCart] = useState<CatalogCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Address form
  const [showAddress, setShowAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    given_name: "",
    surname: "",
    email: "",
    address_1: "",
    address_2: "",
    city: "",
    state_or_region: "",
    postal_code: "",
    country: "US",
    phone_number: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/catalog/cart");
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setCart(data);
      // Pre-fill address form from cart
      if (data) {
        setAddressForm((prev) => ({
          ...prev,
          given_name: data.given_name || prev.given_name,
          surname: data.surname || prev.surname,
          email: data.email || prev.email,
          address_1: data.address_1 || prev.address_1,
          address_2: data.address_2 || prev.address_2,
          city: data.city || prev.city,
          state_or_region: data.state_or_region || prev.state_or_region,
          postal_code: data.postal_code || prev.postal_code,
          country: data.country || prev.country || "US",
          phone_number: data.phone_number || prev.phone_number,
        }));
      }
    } catch {
      toast.error("Failed to load cart");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (profile?.company_id) {
      fetchCart();
    }
  }, [profile, fetchCart]);

  // Pre-fill from profile if cart address is empty
  useEffect(() => {
    if (profile && cart && !cart.given_name) {
      const nameParts = (profile.full_name || "").split(" ");
      setAddressForm((prev) => ({
        ...prev,
        given_name: prev.given_name || nameParts[0] || "",
        surname: prev.surname || nameParts.slice(1).join(" ") || "",
        email: prev.email || profile.email || "",
        address_1: prev.address_1 || profile.address || "",
        city: prev.city || profile.city || "",
        state_or_region: prev.state_or_region || profile.state || "",
        postal_code: prev.postal_code || profile.zip || "",
      }));
    }
  }, [profile, cart]);

  async function handleRemove(lineItemId: string) {
    setRemoving(lineItemId);
    try {
      const res = await fetch(
        `/api/customer/catalog/cart?line_item_id=${lineItemId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setCart(data);
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
    setRemoving(null);
  }

  async function handleSaveAddress() {
    setSavingAddress(true);
    try {
      const res = await fetch("/api/customer/catalog/cart/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to save address");
      } else {
        const { data } = await res.json();
        setCart(data);
        setShowAddress(false);
        toast.success("Address saved");
      }
    } catch {
      toast.error("Failed to save address");
    }
    setSavingAddress(false);
  }

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/customer/catalog/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Checkout failed");
        setCheckingOut(false);
        setConfirmDialog(false);
        return;
      }

      toast.success(
        `Order placed! Order #${json.data.order_number}. ${json.data.points_spent.toLocaleString()} pts deducted.`
      );

      // Confetti
      import("canvas-confetti").then((mod) => {
        mod.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#14b8a6", "#f59e0b", "#8b5cf6"],
        });
      });

      router.push("/dashboard/store/orders");
    } catch {
      toast.error("Checkout failed");
      setCheckingOut(false);
      setConfirmDialog(false);
    }
  }

  const totalPoints = cart?.line_items?.reduce(
    (sum, li) => sum + (li.points ?? 0),
    0
  ) ?? 0;

  const hasPhysical = cart?.line_items?.some(
    (li) => li.fulfillment_type === "physical"
  );

  const needsAddress =
    hasPhysical && (!cart?.address_1 || !cart?.city || !cart?.postal_code);

  const canCheckout =
    cart &&
    cart.line_items.length > 0 &&
    (profile?.total_points ?? 0) >= totalPoints &&
    !needsAddress;

  function getItemImage(li: CatalogCartLineItem): string | null {
    const imgs = li.images;
    return imgs?.image_150_1_1 || imgs?.image_75_1_1 || null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const lineItems = cart?.line_items ?? [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/store" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">Your Cart</h1>

      {lineItems.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Your cart is empty.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard/store">Browse Store</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Line Items */}
          <div className="space-y-3 lg:col-span-2">
            {lineItems.map((li) => {
              const img = getItemImage(li);
              return (
                <Card key={li.line_item_id}>
                  <CardContent className="flex gap-4 p-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {img ? (
                        <img
                          src={img}
                          alt={li.name}
                          className="h-full w-full object-contain"
                        />
                      ) : li.fulfillment_type === "digital" ? (
                        <div className="flex h-full items-center justify-center">
                          <Smartphone className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="text-xs text-muted-foreground">{li.brand}</p>
                      <p className="font-semibold line-clamp-1">{li.name}</p>
                      <p className="mt-auto text-lg font-bold text-amber-600">
                        {(li.points ?? 0).toLocaleString()} pts
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={removing === li.line_item_id}
                      onClick={() => handleRemove(li.line_item_id)}
                    >
                      {removing === li.line_item_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Sidebar: Address + Summary */}
          <div className="space-y-4">
            {/* Address */}
            {hasPhysical && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddress(!showAddress)}
                    >
                      {showAddress ? "Cancel" : cart?.address_1 ? "Edit" : "Add"}
                    </Button>
                  </div>

                  {!showAddress && cart?.address_1 ? (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>
                        {cart.given_name} {cart.surname}
                      </p>
                      <p>{cart.address_1}</p>
                      {cart.address_2 && <p>{cart.address_2}</p>}
                      <p>
                        {cart.city}, {cart.state_or_region} {cart.postal_code}
                      </p>
                      <p>{cart.country}</p>
                    </div>
                  ) : !showAddress && needsAddress ? (
                    <p className="mt-2 text-sm text-destructive">
                      Shipping address required for physical items.
                    </p>
                  ) : null}

                  {showAddress && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">First Name</Label>
                          <Input
                            value={addressForm.given_name}
                            onChange={(e) =>
                              setAddressForm((p) => ({
                                ...p,
                                given_name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Last Name</Label>
                          <Input
                            value={addressForm.surname}
                            onChange={(e) =>
                              setAddressForm((p) => ({
                                ...p,
                                surname: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          value={addressForm.email}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              email: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Address</Label>
                        <Input
                          value={addressForm.address_1}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              address_1: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Address 2</Label>
                        <Input
                          value={addressForm.address_2}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              address_2: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">City</Label>
                          <Input
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm((p) => ({
                                ...p,
                                city: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">State</Label>
                          <Input
                            value={addressForm.state_or_region}
                            onChange={(e) =>
                              setAddressForm((p) => ({
                                ...p,
                                state_or_region: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Zip Code</Label>
                          <Input
                            value={addressForm.postal_code}
                            onChange={(e) =>
                              setAddressForm((p) => ({
                                ...p,
                                postal_code: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Country</Label>
                          <Input
                            value={addressForm.country}
                            onChange={(e) =>
                              setAddressForm((p) => ({
                                ...p,
                                country: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <Input
                          value={addressForm.phone_number}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              phone_number: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        className="w-full"
                        disabled={savingAddress}
                        onClick={handleSaveAddress}
                      >
                        {savingAddress ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save Address"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold">Order Summary</h3>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Items ({lineItems.length})
                    </span>
                    <span className="font-medium">
                      {totalPoints.toLocaleString()} pts
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span className="text-amber-600">
                      {totalPoints.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Your balance</span>
                    <span>
                      {(profile?.total_points ?? 0).toLocaleString()} pts
                    </span>
                  </div>
                  {(profile?.total_points ?? 0) < totalPoints && (
                    <p className="text-xs text-destructive">
                      You need{" "}
                      {(totalPoints - (profile?.total_points ?? 0)).toLocaleString()}{" "}
                      more points.
                    </p>
                  )}
                </div>
                <Button
                  className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={!canCheckout}
                  onClick={() => setConfirmDialog(true)}
                >
                  Checkout
                </Button>
                {needsAddress && (
                  <p className="mt-2 text-center text-xs text-destructive">
                    Add a shipping address first
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Checkout confirmation */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              You are about to redeem{" "}
              <span className="font-semibold">
                {totalPoints.toLocaleString()} points
              </span>{" "}
              for {lineItems.length} item{lineItems.length !== 1 ? "s" : ""}.
              Your balance will go from{" "}
              <span className="font-semibold">
                {(profile?.total_points ?? 0).toLocaleString()}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {((profile?.total_points ?? 0) - totalPoints).toLocaleString()}
              </span>{" "}
              points.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={checkingOut}
              onClick={handleCheckout}
            >
              {checkingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Confirm Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
