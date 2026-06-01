import { KYFI_API_BASE_URL } from "@/lib/config";
import type { AdminDealerRecord } from "@/lib/api/dealers";

export type NotificationRecipientType = "all" | "individual";

export type AdminNotificationRecord = {
  id: number;
  recipientType: NotificationRecipientType;
  dealerId: number | null;
  recipientLabel: string;
  recipientCompanyName: string | null;
  recipientOwnerName: string | null;
  recipientDealerCode: string | null;
  recipientMobileNumber: string | null;
  recipientDistrict: string | null;
  title: string;
  message: string;
  notificationType: "Broadcast" | "Individual";
  status: "Sent" | "Queued" | "Failed";
  sentByName: string;
  sentAt: string;
  updatedAt: string;
  dateLabel: string;
};

type NotificationsResponse = {
  notifications: AdminNotificationRecord[];
  total: number;
};

type SendNotificationInput = {
  recipientType: NotificationRecipientType;
  title: string;
  message: string;
  dealerId?: number | null;
};

async function authFetch(path: string, init: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("kyfi_admin_token") : null;

  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export async function fetchNotificationHistory() {
  return authFetch("/admin/notifications") as Promise<NotificationsResponse>;
}

export async function sendAdminNotification(input: SendNotificationInput) {
  return authFetch("/admin/notifications", {
    method: "POST",
    body: JSON.stringify({
      recipientType: input.recipientType,
      title: input.title,
      message: input.message,
      dealerId: input.dealerId,
    }),
  }) as Promise<{ message: string; notification: AdminNotificationRecord }>;
}

export function formatAdminDealerCode(dealerId: number) {
  return `DLR-${String(dealerId).padStart(4, "0")}`;
}

export function matchesDealerSearch(
  dealer: AdminDealerRecord,
  query: string,
) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return true;

  const dealerCode = formatAdminDealerCode(dealer.id);
  const fields = [
    dealer.name,
    dealer.shopName,
    dealer.mobile,
    dealerCode,
    String(dealer.id),
    dealer.district,
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  return fields.some((field) => field.includes(normalized));
}
