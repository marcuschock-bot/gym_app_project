import { useEffect, useState } from "react";

const readStored = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) {
      return fallback;
    }

    // Guard array fallbacks: if fallback is an array, stored value must be an array
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }

    // Guard primitive fallbacks
    if (typeof fallback === "boolean" && typeof parsed !== "boolean") {
      return fallback;
    }
    if (typeof fallback === "string" && typeof parsed !== "string") {
      return fallback;
    }
    if (typeof fallback === "number" && (typeof parsed !== "number" || !Number.isFinite(parsed))) {
      return fallback;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
};

export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStored(key, fallback));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable (private mode, quota); state still works in-memory.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
