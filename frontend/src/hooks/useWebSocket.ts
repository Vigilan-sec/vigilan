"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AlertRecord } from "@/lib/types";

const MAX_BUFFER = 500;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];

export type WsStatus = "connecting" | "connected" | "disconnected";

function resolveWsUrl(): string | null {
  if (typeof window === "undefined") return null;
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws/alerts`;
}

export function useWebSocket() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [status, setStatus] = useState<WsStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    if (!user) {
      const resetTimeout = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setAlerts([]);
        setStatus("disconnected");
      }, 0);
      return () => {
        window.clearTimeout(resetTimeout);
        mountedRef.current = false;
        if (reconnectTimeoutRef.current !== null) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        wsRef.current?.close();
      };
    }

    const wsUrl = resolveWsUrl();
    if (!wsUrl) {
      return () => {
        mountedRef.current = false;
      };
    }

    const connectingTimeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setStatus("connecting");
      }
    }, 0);

    const ws = new WebSocket(wsUrl);
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
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        wsRef.current?.close();
        const retrySocket = new WebSocket(wsUrl);
        wsRef.current = retrySocket;
        setStatus("connecting");

        retrySocket.onopen = ws.onopen;
        retrySocket.onmessage = ws.onmessage;
        retrySocket.onclose = ws.onclose;
        retrySocket.onerror = ws.onerror;
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

    return () => {
      window.clearTimeout(connectingTimeout);
      mountedRef.current = false;
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [user]);

  const clearAlerts = () => setAlerts([]);

  return { alerts, status, clearAlerts };
}
