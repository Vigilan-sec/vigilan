"use client";

import Header from "@/components/layout/Header";
import EventLog from "@/components/events/EventLog";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTranslation } from "@/hooks/useTranslation";

export default function EventsPage() {
  const { status } = useWebSocket();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <Header title={t("events.title")} wsStatus={status} />
      <div className="p-6">
        <EventLog />
      </div>
    </div>
  );
}
