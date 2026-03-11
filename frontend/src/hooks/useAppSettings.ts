"use client";

import { useEffect, useState } from "react";

interface AppSettingsState {
  kimiApiKey: string;
}

const STORAGE_KEY = "vigilan.settings";

const DEFAULT_SETTINGS: AppSettingsState = {
  kimiApiKey: "",
};

function loadStoredSettings(): AppSettingsState {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AppSettingsState>;
    return {
      kimiApiKey:
        typeof parsed.kimiApiKey === "string" ? parsed.kimiApiKey : "",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettingsState>(loadStoredSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage failures and keep the in-memory settings.
    }
  }, [settings]);

  return {
    settings,
    kimiApiKey: settings.kimiApiKey,
    setKimiApiKey: (kimiApiKey: string) =>
      setSettings((current) => ({ ...current, kimiApiKey })),
  };
}
