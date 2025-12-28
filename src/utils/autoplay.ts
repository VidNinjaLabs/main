import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";

// Extension functionality removed
export function isAutoplayAllowed() {
  return Boolean(conf().ALLOW_AUTOPLAY || useAuthStore.getState().proxySet);
}
