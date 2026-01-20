import { usePlayerStore } from "@/stores/player/store";

export function LoadingSpinner() {
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Simple spinning circle */}
      <div className="w-32 h-32 border-8 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}
