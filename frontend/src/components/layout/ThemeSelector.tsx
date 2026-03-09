"use client";

import { useEffect, useState } from "react";

const themes = [
  { value: "mocha", label: "Catppuccin Mocha" },
  { value: "macchiato", label: "Catppuccin Macchiato" },
  { value: "frappe", label: "Catppuccin Frappe" },
  { value: "latte", label: "Catppuccin Latte" },
];

const storageKey = "vigilan-theme";

export default function ThemeSelector() {
  const [theme, setTheme] = useState("mocha");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    const initial = saved && themes.some((t) => t.value === saved) ? saved : "mocha";
    window.setTimeout(() => setTheme(initial), 0);
    document.documentElement.dataset.theme = initial;
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTheme = event.target.value;
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  };

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      Theme
      <select
        value={theme}
        onChange={handleChange}
        className="rounded-md border px-2 py-1 text-xs input-base"
      >
        {themes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
