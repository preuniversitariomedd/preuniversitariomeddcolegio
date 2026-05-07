import { useEffect, useState } from "react";

/** Boolean state synced with localStorage ("1"/"0"). */
export function usePersistedToggle(key: string, defaultValue = true) {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : raw === "1";
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
