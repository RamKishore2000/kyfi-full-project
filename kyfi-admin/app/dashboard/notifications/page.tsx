"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCheck, Loader2, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { PageHeader } from "@/components/navigation/page-header";
import { fetchDealers, type AdminDealerRecord } from "@/lib/api/dealers";
import {
  fetchNotificationHistory,
  matchesDealerSearch,
  sendAdminNotification,
  formatAdminDealerCode,
  type AdminNotificationRecord,
  type NotificationRecipientType,
} from "@/lib/api/notifications";

const DEFAULT_TITLE = "";
const DEFAULT_MESSAGE = "";

function RecipientToggle({
  value,
  onChange,
}: {
  value: NotificationRecipientType;
  onChange: (next: NotificationRecipientType) => void;
}) {
  const { t } = useAdminLanguage();
  const options: Array<{ value: NotificationRecipientType; label: string; hint: string }> = [
    { value: "all", label: "notifications.allDealers", hint: "notifications.allHint" },
    { value: "individual", label: "notifications.individualDealer", hint: "notifications.individualHint" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "rounded-2xl border px-4 py-4 text-left transition",
              active
                ? "border-primary/30 bg-primary/5 shadow-sm"
                : "border-border bg-background hover:border-primary/20 hover:bg-muted/40",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={active ? "font-semibold text-foreground" : "font-medium text-foreground"}>
                  {t(option.label)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t(option.hint)}</p>
              </div>
              <span
                className={[
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  active ? "border-primary bg-primary" : "border-muted-foreground/30 bg-transparent",
                ].join(" ")}
              >
                {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: AdminNotificationRecord["status"] }) {
  const { t } = useAdminLanguage();
  const tone =
    status === "Sent"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Queued"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  const label =
    status === "Sent" ? t("notifications.sentStatus") : status === "Queued" ? t("notifications.queuedStatus") : t("notifications.failedStatus");

  return <Badge className={tone}>{label}</Badge>;
}

export default function NotificationsPage() {
  const { t } = useAdminLanguage();
  const [recipientType, setRecipientType] = useState<NotificationRecipientType>("all");
  const [dealers, setDealers] = useState<AdminDealerRecord[]>([]);
  const [notifications, setNotifications] = useState<AdminNotificationRecord[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<AdminDealerRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [loadingDealers, setLoadingDealers] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([fetchDealers(), fetchNotificationHistory()])
      .then(([dealerResponse, notificationResponse]) => {
        if (!mounted) return;

        setDealers(dealerResponse.dealers);
        setNotifications(notificationResponse.notifications);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load notifications");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingDealers(false);
        setLoadingHistory(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (recipientType === "all") {
      setSelectedDealer(null);
      setSearchTerm("");
    }
  }, [recipientType]);

  const filteredDealers = useMemo(() => {
    if (recipientType !== "individual" || !searchTerm.trim()) return [];
    return dealers.filter((dealer) => matchesDealerSearch(dealer, searchTerm));
  }, [dealers, recipientType, searchTerm]);

  const selectedDealerCode = selectedDealer ? formatAdminDealerCode(selectedDealer.id) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError(t("notifications.titleRequired"));
      return;
    }

    if (!message.trim()) {
      setError(t("notifications.messageRequired"));
      return;
    }

    if (recipientType === "individual" && !selectedDealer) {
      setError(t("notifications.selectDealer"));
      return;
    }

    setSending(true);

    try {
      const response = await sendAdminNotification({
        recipientType,
        title: title.trim(),
        message: message.trim(),
        dealerId: recipientType === "individual" ? selectedDealer?.id ?? null : null,
      });

      setNotifications((current) => [response.notification, ...current]);
      setSuccess(response.message);
      setTitle("");
      setMessage("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  const selectedDealerCard = selectedDealer ? (
        <Card className="border-primary/15 bg-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("notifications.selectedDealer")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("notifications.dealerName")}</p>
          <p className="mt-1 font-semibold text-foreground">{selectedDealer.shopName || selectedDealer.name}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("notifications.ownerName")}</p>
          <p className="mt-1 font-semibold text-foreground">{selectedDealer.name}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("notifications.dealerId")}</p>
          <p className="mt-1 font-semibold text-foreground">{selectedDealerCode}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("notifications.mobileNumber")}</p>
          <p className="mt-1 font-semibold text-foreground">{selectedDealer.mobile}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("notifications.district")}</p>
          <p className="mt-1 font-semibold text-foreground">{selectedDealer.district}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("notifications.status")}</p>
          <p className="mt-1 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {t("table.active")}
          </p>
        </div>
      </CardContent>
    </Card>
  ) : null;

  return (
    <>
      <PageHeader
        title={t("notifications.title")}
        description={t("notifications.description")}
        actions={
          <Button variant="outline" type="button" onClick={() => window.location.reload()}>
            <CheckCheck className="h-4 w-4" />
            {t("notifications.refresh")}
          </Button>
        }
      />

      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">{t("notifications.sendTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("notifications.defaultRecipient")}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div className="space-y-6">
                <RecipientToggle value={recipientType} onChange={setRecipientType} />

                {recipientType === "individual" ? (
                  <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("notifications.searchDealer")}</label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="h-11 pl-9"
                          placeholder={t("notifications.searchDealerPlaceholder")}
                          value={searchTerm}
                          onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setSelectedDealer(null);
                          }}
                        />
                      </div>
                    </div>

                    <div className="max-h-[260px] overflow-auto pr-1">
                      {loadingDealers ? (
                        <div className="rounded-2xl border border-dashed border-border/70 bg-background p-4 text-sm text-muted-foreground">
                          {t("notifications.loadingDealers")}
                        </div>
                      ) : filteredDealers.length ? (
                        <div className="grid gap-3">
                          {filteredDealers.slice(0, 8).map((dealer) => {
                            const dealerCode = formatAdminDealerCode(dealer.id);
                            const active = selectedDealer?.id === dealer.id;

                            return (
                              <button
                                key={dealer.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDealer(dealer);
                                  setSuccess("");
                                  setError("");
                                }}
                                className={[
                                  "rounded-2xl border p-4 text-left transition",
                                  active
                                    ? "border-primary/30 bg-primary/5 shadow-sm"
                                    : "border-border bg-background hover:border-primary/20 hover:bg-muted/30",
                                ].join(" ")}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="font-semibold text-foreground">
                                      {dealer.shopName || dealer.name}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">{t("notifications.dealerId")}: {dealerCode}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{t("notifications.mobileNumber")}: {dealer.mobile}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{t("notifications.district")}: {dealer.district}</p>
                                  </div>
                                  <Badge variant="muted" className="rounded-full px-3 py-1 text-xs">
                                    {dealer.status}
                                  </Badge>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : searchTerm.trim() ? (
                        <div className="rounded-2xl border border-dashed border-border/70 bg-background p-4 text-sm text-muted-foreground">
                          {t("notifications.noMatch")}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border/70 bg-background p-4 text-sm text-muted-foreground">
                          {t("notifications.startTyping")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {selectedDealerCard}
              </div>

              <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 shadow-sm">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("notifications.titleField")}</label>
                    <Input
                      className="h-11"
                      placeholder={t("notifications.titleField")}
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        setError("");
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-foreground">{t("notifications.messageField")}</label>
                      <span className="text-xs text-muted-foreground">{message.length} / 1000</span>
                    </div>
                    <textarea
                      className="min-h-52 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      maxLength={1000}
                      placeholder={t("notifications.messagePlaceholder")}
                      value={message}
                      onChange={(event) => {
                        setMessage(event.target.value);
                        setError("");
                      }}
                    />
                  </div>

                  {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
                  {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

                  <div className="flex justify-end">
                    <Button className="min-w-44" type="submit" disabled={sending}>
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("notifications.sending")}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {t("notifications.send")}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">{t("notifications.historyTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("notifications.historyDescription")}</p>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                {t("notifications.loadingHistory")}
              </div>
            ) : notifications.length ? (
              <div className="overflow-x-auto rounded-2xl border border-border/70">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="px-4 py-3">{t("notifications.titleField")}</th>
                      <th className="px-4 py-3">{t("notifications.recipient")}</th>
                      <th className="px-4 py-3">{t("notifications.mobileNumber")}</th>
                      <th className="px-4 py-3">{t("notifications.type")}</th>
                      <th className="px-4 py-3">{t("notifications.sentBy")}</th>
                      <th className="px-4 py-3">{t("notifications.date")}</th>
                      <th className="px-4 py-3">{t("notifications.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {notifications.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-4 font-medium text-foreground">{item.title}</td>
                        <td className="px-4 py-4 text-muted-foreground">{item.recipientLabel}</td>
                        <td className="px-4 py-4 text-muted-foreground">{item.recipientMobileNumber || "-"}</td>
                        <td className="px-4 py-4 text-muted-foreground">{item.notificationType}</td>
                        <td className="px-4 py-4 text-muted-foreground">{item.sentByName}</td>
                        <td className="px-4 py-4 text-muted-foreground">{item.dateLabel}</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                {t("notifications.noNotifications")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
