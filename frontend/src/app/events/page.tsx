"use client";

import Header from "@/components/layout/Header";
import EventLog from "@/components/events/EventLog";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function EventsPage() {
  const { status } = useWebSocket();

  return (
    <div className="min-h-screen">
      <Header title="Events" wsStatus={status} />
      <div className="p-6">
        <EventLog />
      </div>
    </div>
  );
}
