import { usePlayerStore } from "@/stores/player/store";
import { Spinner } from "@/components/layout/Spinner";

export function LoadingSpinner() {
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <Spinner />
    </div>
  );
}
