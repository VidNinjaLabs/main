import { useAuthContext } from "@/contexts/AuthContext";

export function useIsAdmin() {
  const { isAdmin } = useAuthContext();

  return isAdmin;
}
