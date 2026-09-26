import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { createCheckout, mockPaymentSignature, verifyPayment } from "@/lib/checkout.functions";

type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void };

function loadRazorpay(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("load")));
    s.onerror = () => reject(new Error("load"));
    document.body.appendChild(s);
  });
}

/** Buy flow: server creates the order, payment is verified server-side only. */
export function usePurchase() {
  const navigate = useNavigate();
  const checkout = useServerFn(createCheckout);
  const verify = useServerFn(verifyPayment);
  const mockSign = useServerFn(mockPaymentSignature);
  const [busy, setBusy] = useState(false);

  async function buy(productId: string, slug: string, couponCode?: string) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.info("Sign in to continue", { description: "Create a free account to get your notes." });
      navigate({ to: "/login", search: { redirect: `/notes/${slug}` } });
      return;
    }
    setBusy(true);
    try {
      const res = await checkout({ data: { productId, couponCode } });
      if ("alreadyOwned" in res) {
        toast.success("You already own this", { description: "Find it in My Purchases." });
        navigate({ to: "/my-purchases" });
        return;
      }
      if (res.free) {
        toast.success("Added to your library");
        navigate({ to: "/order-success", search: { order: res.orderId } });
        return;
      }
      const finish = async (paymentId: string, signature: string) => {
        const v = await verify({ data: { orderId: res.orderId, razorpayPaymentId: paymentId, razorpaySignature: signature } });
        if (v.ok) {
          toast.success("Payment successful");
          navigate({ to: "/order-success", search: { order: res.orderId } });
        } else {
          toast.error("Payment could not be verified");
          navigate({ to: "/order-failed", search: { order: res.orderId } });
        }
      };
      if (res.mode === "mock") {
        const sig = await mockSign({ data: { orderId: res.orderId } });
        await finish(sig.razorpayPaymentId, sig.razorpaySignature);
        return;
      }
      const Razorpay = await loadRazorpay();
      new Razorpay({
        key: res.keyId,
        order_id: res.razorpayOrderId,
        amount: res.amount,
        currency: res.currency,
        name: "Learn With Surendra",
        description: res.productTitle,
        theme: { color: "#f0592a" },
        handler: (r: { razorpay_payment_id: string; razorpay_signature: string }) =>
          finish(r.razorpay_payment_id, r.razorpay_signature),
        modal: { ondismiss: () => toast("Payment cancelled") },
      }).open();
    } catch {
      toast.error("Something went wrong", { description: "Please try again in a moment." });
    } finally {
      setBusy(false);
    }
  }

  return { buy, busy };
}

export async function toggleWishlist(productId: string, saved: boolean) {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) {
    toast.info("Sign in to save notes to your wishlist");
    return saved;
  }
  if (saved) {
    await supabase.from("wishlist").delete().eq("user_id", uid).eq("product_id", productId);
    toast("Removed from wishlist");
    return false;
  }
  const { error } = await supabase.from("wishlist").insert({ user_id: uid, product_id: productId });
  if (error && !error.message.includes("duplicate")) {
    toast.error("Couldn't update wishlist");
    return saved;
  }
  toast.success("Saved to wishlist");
  return true;
}
