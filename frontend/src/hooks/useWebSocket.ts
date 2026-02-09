"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AlertRecord } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/ws/alerts";
const MAX_BUFFER = 500;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];

export type WsStatus = "connecting" | "connected" | "disconnected";

export function useWebSocket() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [status, setStatus] = useState<WsStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus("connecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "new_alert" && msg.data) {
          setAlerts((prev) => {
            const next = [msg.data as AlertRecord, ...prev];
            return next.length > MAX_BUFFER ? next.slice(0, MAX_BUFFER) : next;
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)];
      retriesRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
    };
  }, [connect]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return { alerts, status, clearAlerts };
}
