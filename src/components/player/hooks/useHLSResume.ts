import { useEffect, useRef } from "react";
import Hls from "@rev9dev-netizen/vidply.js";

import {
  getSafeResumeTime,
  getResumeTime,
} from "@/components/player/utils/continueWatching";
import { usePlayerStore } from "@/stores/player/store";

/**
 * HLS.js Resume Hook
 *
 * Handles segment-safe resume with auto-recovery for HLS streams.
 *
 * Features:
 * - Waits for MANIFEST_PARSED before seeking
 * - Aligns resume time to segment boundaries
 * - Auto-retries if playback stalls (3s timeout)
 * - Muted autoplay workaround for mobile
 * - Cloudflare-friendly buffering
 */
export function useHLSResume(
  hls: Hls | null,
  video: HTMLVideoElement | null,
  mediaId: string | undefined,
) {
  const hasResumed = useRef(false);
  const recoveryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hls || !video || !mediaId) return;

    // Reset flag when media changes
    hasResumed.current = false;

    // Get saved progress
    const resumeTime = getResumeTime(mediaId);
    if (resumeTime === 0) {
      console.log("[HLSResume] No saved progress");
      return;
    }

    // Calculate segment-safe time
    const safeTime = getSafeResumeTime(resumeTime);
    console.log(
      `[HLSResume] Resuming from ${resumeTime}s → ${safeTime}s (segment-safe)`,
    );

    // Wait for manifest to be parsed
    const onManifestParsed = () => {
      if (hasResumed.current) return;

      console.log("[HLSResume] Manifest parsed, seeking to", safeTime);
      video.currentTime = safeTime;
    };

    // Try to play when buffer is ready
    const onBufferAppended = () => {
      if (hasResumed.current) return;
      if (video.paused) {
        console.log("[HLSResume] Buffer ready, attempting play");
        attemptPlay();
      }
    };

    // Muted autoplay workaround
    const attemptPlay = async () => {
      if (hasResumed.current) return;
      hasResumed.current = true;

      // Mute first (mobile autoplay requirement)
      const originalMuted = video.muted;
      video.muted = true;

      try {
        await video.play();
        console.log("[HLSResume] Playback started");

        // Unmute after successful play
        setTimeout(() => {
          video.muted = originalMuted;
        }, 100);
      } catch (error) {
        console.warn("[HLSResume] Play failed:", error);
        video.muted = originalMuted;
      }
    };

    // Auto-recovery: Retry if playback stalls
    const setupRecovery = () => {
      if (recoveryTimeout.current) {
        clearTimeout(recoveryTimeout.current);
      }

      recoveryTimeout.current = setTimeout(() => {
        // Check if video is stuck loading
        if (video.readyState < 3 && !hasResumed.current) {
          console.warn("[HLSResume] Playback stalled - retrying");

          // Seek back a bit more and retry
          const fallbackTime = Math.max(safeTime - 4, 0);
          video.currentTime = fallbackTime;

          attemptPlay();
        }
      }, 3000); // 3 second timeout
    };

    // Attach event listeners
    hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
    hls.on(Hls.Events.BUFFER_APPENDED, onBufferAppended);

    // Setup recovery timeout
    setupRecovery();

    // Cleanup
    return () => {
      hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
      hls.off(Hls.Events.BUFFER_APPENDED, onBufferAppended);

      if (recoveryTimeout.current) {
        clearTimeout(recoveryTimeout.current);
      }
    };
  }, [hls, video, mediaId]);
}
