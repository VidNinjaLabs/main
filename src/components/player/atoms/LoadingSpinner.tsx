import { Spinner } from "@/components/layout/Spinner";
import { usePlayerStore } from "@/stores/player/store";

export function LoadingSpinner() {
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);

  if (!isLoading) return null;

  // Use consistent 72px size to match all other loading spinners in app
  return <Spinner size={96} />;
}
