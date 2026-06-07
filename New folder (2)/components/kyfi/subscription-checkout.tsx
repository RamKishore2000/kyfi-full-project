"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createSubscriptionOrder,
  fetchSubscriptionSettings,
  verifySubscriptionPayment,
  type SubscriptionRecord,
} from "@/lib/api/subscription";

type DealerInfo = {
  id?: number;
  name?: string;
  mobile?: string;
};

type SubscriptionCheckoutProps = {
  dealer?: DealerInfo | null;
  variant?: "page" | "embedded";
  onSuccess?: () => void;
};

const RAZORPAY_SCRIPT_ID = "kyfi-razorpay-js";
const KYFI_GREEN = "rgb(4,120,87)";

function formatCurrency(amount?: number | null, currency = "INR") {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as Window & { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.getElementById(
      RAZORPAY_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function useDealerFromStorage(providedDealer?: DealerInfo | null) {
  const [dealer, setDealer] = useState<DealerInfo | null>(
    providedDealer ?? null,
  );

  useEffect(() => {
    if (providedDealer) {
      setDealer(providedDealer);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const pending = window.localStorage.getItem("kyfi_pending_dealer");
    const active = window.localStorage.getItem("kyfi_dealer");
    const source = pending || active;
    if (!source) {
      return;
    }

    try {
      const parsed = JSON.parse(source) as DealerInfo;
      setDealer({
        id: Number(parsed.id || 0) || undefined,
        name: parsed.name,
        mobile: parsed.mobile,
      });
    } catch {
      setDealer(null);
    }
  }, [providedDealer]);

  return dealer;
}

export function SubscriptionCheckout({
  dealer: providedDealer,
  variant = "page",
  onSuccess,
}: SubscriptionCheckoutProps) {
  const router = useRouter();
  const dealer = useDealerFromStorage(providedDealer);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchSubscriptionSettings()
      .then((response) => {
        if (!active) return;
        setSubscription(response.subscription);
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load subscription",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const planTitle = subscription?.planName || "One Year Plan";
  const yearlyPrice = subscription?.yearlyPrice ?? null;
  const durationLabel = subscription?.durationLabel || "1 Year";
  const priceLabel =
    yearlyPrice !== null
      ? formatCurrency(yearlyPrice, subscription?.currency || "INR")
      : "Loading...";

  const canPay = Boolean(
    dealer?.id && dealer.mobile && subscription && yearlyPrice !== null,
  );

  const handleSuccess = () => {
    setMessage("Subscription activated successfully.");
    setError("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("kyfi_pending_dealer");
      window.localStorage.setItem("kyfi_subscription_success", "1");
      window.dispatchEvent(new Event("kyfi-auth-changed"));
    }
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push("/login");
  };

  const handleSubscribe = async () => {
    if (!dealer?.id || !dealer.mobile) {
      setError("Dealer details are missing. Please register again.");
      return;
    }

    if (!subscription || yearlyPrice === null) {
      setError("Subscription pricing is not available yet.");
      return;
    }

    setPaying(true);
    setMessage("");
    setError("");

    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const orderResponse = await createSubscriptionOrder({
        dealerId: dealer.id,
        mobile: dealer.mobile,
      });

      const options = {
        key: orderResponse.order.keyId,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: "KYFI",
        description: `${orderResponse.order.planName} subscription`,
        order_id: orderResponse.order.orderId,
        prefill: {
          name: dealer.name || "Dealer",
          contact: dealer.mobile,
        },
        theme: {
          color: "#047857",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifySubscriptionPayment({
              dealerId: dealer.id as number,
              mobile: dealer.mobile as string,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            handleSuccess();
          } catch (verificationError) {
            setError(
              verificationError instanceof Error
                ? verificationError.message
                : "Payment verification failed",
            );
          } finally {
            setPaying(false);
          }
        },
      } as const;

      const RazorpayCtor = (
        window as Window & {
          Razorpay?: new (options: any) => {
            on: (event: string, cb: (payload: unknown) => void) => void;
            open: () => void;
          };
        }
      ).Razorpay;

      if (!RazorpayCtor) {
        throw new Error("Razorpay checkout is unavailable.");
      }

      const razorpay = new RazorpayCtor(options);
      razorpay.on("payment.failed", (payload: unknown) => {
        const reason = (payload as { error?: { description?: string } })?.error
          ?.description;
        setError(reason || "Payment failed. Please try again.");
        setPaying(false);
      });
      razorpay.open();
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start payment",
      );
      setPaying(false);
    }
  };

  const card = (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="h-2 bg-[rgb(4,120,87)]" />

      <div className="p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.26em] text-[rgb(4,120,87)]">
            Subscription
          </p>
          <h2 className="font-manrope text-[1.15rem] font-extrabold tracking-[-0.05em] text-slate-950 sm:text-[1.4rem]">
            Activate your yearly plan
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {planTitle}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {durationLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-900">
              {priceLabel}
            </span>
          </div>
        </div>

        {message ? (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3.5">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.26em] text-slate-500">
              Key points
            </p>
            <ul className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                <span>Access to KYFI dealer dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                <span>Farmer search with mobile-first lookup</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                <span>Status updates and record tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                <span>Subscription validity for one full year</span>
              </li>
            </ul>
          </div>
          <Button
            type="button"
            onClick={handleSubscribe}
            disabled={!canPay || paying}
            className="h-11 w-full rounded-full border px-6 text-white shadow-none transition-colors hover:brightness-105 active:brightness-95 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
            style={{
              backgroundColor: KYFI_GREEN,
              borderColor: KYFI_GREEN,
              color: "#fff",
              "--tw-ring-color": KYFI_GREEN,
            } as CSSProperties}
          >
            {paying ? "Processing..." : "Subscribe Now"}
          </Button>
        </div>
      </div>
    </div>
  );
  if (variant === "embedded") {
    return (
      <div className="w-full">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading subscription plan...
          </div>
        ) : (
          card
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center justify-center">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            Loading subscription plan...
          </div>
        ) : (
          card
        )}
      </section>
    </main>
  );
}
