import { useMemo } from "react";

import { useAuthStore } from "@/stores/auth";

export function useIsPremium() {
  const account = useAuthStore((s) => s.account);

  const isPremium = useMemo(() => {
    if (!account || !account.premium_until) return false;

    const premiumUntil = new Date(account.premium_until);
    const now = new Date();

    return premiumUntil > now;
  }, [account]);

  return isPremium;
}
