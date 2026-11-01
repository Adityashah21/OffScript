import { useEffect, useState } from "react";

/**
 * Hook that returns false during SSR and initial client hydration,
 * and true immediately after mounting on the browser client.
 * Guarantees zero React 19 hydration mismatches for local storage and client-only state.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
