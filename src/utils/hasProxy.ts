import { useAuthStore } from "@/stores/auth";

// Extension functionality removed - only check for configured proxy
export async function hasProxyCheck(): Promise<boolean> {
  const hasProxy = Boolean(useAuthStore.getState().proxySet);
  return hasProxy;
}
