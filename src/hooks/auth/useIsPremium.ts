import { useAuthContext } from "@/contexts/AuthContext";

export function useIsPremium() {
  const { isPremium } = useAuthContext();

  return isPremium;
}
