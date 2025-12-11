import { useMemo } from "react";

import { useAuthStore } from "@/stores/auth";

export function useIsAdmin() {
  const account = useAuthStore((s) => s.account);

  const isAdmin = useMemo(() => {
    if (!account || !account.role) return false;

    return account.role === "ADMIN";
  }, [account]);

  return isAdmin;
}
