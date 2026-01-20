/* eslint-disable no-case-declarations */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import Hls, { Level } from "@rev9dev-netizen/vidply.js";

import {
  getResumeTime,
  getSafeResumeTime,
} from "@/components/player/utils/continueWatching";
import { usePlayerStore } from "@/stores/player/store";
import fscreen from "fscreen";

// Extension imports removed
import {
  DisplayInterface,
  DisplayInterfaceEvents,
} from "@/components/player/display/displayInterface";
import { handleBuffered } from "@/components/player/utils/handleBuffered";
import { getMediaErrorDetails } from "@/components/player/utils/mediaErrorDetails";
import {
  createM3U8ProxyUrl,
  createMP4ProxyUrl,
  isUrlAlreadyProxied,
} from "@/components/player/utils/proxy";
import { useAuthStore } from "@/stores/auth";
import { useLanguageStore } from "@/stores/language";
import {
  LoadableSource,
  SourceQuality,
  getPreferredQuality,
} from "@/stores/player/utils/qualities";
import { processCdnLink } from "@/utils/cdn";
import {
  canChangeVolume,
  canFullscreen,
  canFullscreenAnyElement,
  canPictureInPicture,
  canPlayHlsNatively,
  canWebkitFullscreen,
  canWebkitPictureInPicture,
} from "@/utils/detectFeatures";
import { makeEmitter } from "@/utils/events";

const levelConversionMap: Record<number, SourceQuality> = {
  360: "360",
  1080: "1080",
  720: "720",
  480: "480",
  2160: "4k",
};

// Define quality thresholds for mapping non-standard resolutions
const qualityThresholds = [
  { minHeight: 1800, quality: "4k" as SourceQuality },
  { minHeight: 800, quality: "1080" as SourceQuality },
  { minHeight: 600, quality: "720" as SourceQuality },
  { minHeight: 420, quality: "480" as SourceQuality },
  { minHeight: 0, quality: "360" as SourceQuality },
];

function hlsLevelToQuality(level?: Level): SourceQuality | null {
  if (!level?.height) return null;

  // First check for exact matches
  const exactMatch = levelConversionMap[level.height];
  if (exactMatch) return exactMatch;

  // For non-standard resolutions, map to closest standard quality
  for (const threshold of qualityThresholds) {
    if (level.height >= threshold.minHeight) {
      return threshold.quality;
    }
  }

  return "unknown"; // fallback to unknown quality
}

function hlsLevelsToQualities(levels: Level[]): SourceQuality[] {
  return levels
    .map((v) => hlsLevelToQuality(v))
    .filter((v): v is SourceQuality => !!v);
}

// Sort levels by quality (height) to ensure we can select the best one
function sortLevelsByQuality(levels: Level[]): Level[] {
  return [...levels].sort((a, b) => (b.height || 0) - (a.height || 0));
}

export function makeVideoElementDisplayInterface(): DisplayInterface {
  const { emit, on, off } = makeEmitter<DisplayInterfaceEvents>();
  let source: LoadableSource | null = null;
  let hls: Hls | null = null;
  let videoElement: HTMLVideoElement | null = null;
  let containerElement: HTMLElement | null = null;
  let isFullscreen = false;
  let isPictureInPicture = false;
  let isPausedBeforeSeeking = false;
  let isSeeking = false;
  let startAt = 0;
  let automaticQuality = false;
  let preferenceQuality: SourceQuality | null = null;
  let lastVolume = 1;
  let lastValidDuration = 0; // Store the last valid duration to prevent reset during source switches
  let lastValidTime = 0; // Store the last valid time to prevent reset during source switches
  let shouldAutoplayAfterLoad = false; // Flag to track if we should autoplay after loading completes
  let loadingTimeout: NodeJS.Timeout | null = null; // Timeout to auto-clear stuck loading states

  const languagePromises = new Map<
    string,
    (value: void | PromiseLike<void>) => void
  >();

  function reportLevels() {
    if (!hls) return;
    const levels = hls.levels;
    const { account } = useAuthStore.getState();
    const isPremium =
      (account?.premium_until &&
        new Date(account.premium_until) > new Date()) ||
      import.meta.env.VITE_ENABLE_PREMIUM !== "true";

    const convertedLevels = levels
      .map((v) => hlsLevelToQuality(v))
      .filter((v): v is SourceQuality => !!v)
      .filter((q) => {
        if (isPremium) return true;
        // Filter out 1080p and 4k for non-premium
        if (q === "1080" || q === "4k") return false;
        return true;
      });
    emit("qualities", convertedLevels);
  }

  function reportAudioTracks() {
    if (!hls) return;
    const currentLanguage = useLanguageStore.getState().language;
    const audioTracks = hls.audioTracks;
    const languageTrack = audioTracks.find((v) => v.lang === currentLanguage);
    if (languageTrack) {
      hls.audioTrack = audioTracks.indexOf(languageTrack);
    }
    const currentTrack = audioTracks?.[hls.audioTrack ?? 0];
    if (!currentTrack) return;
    emit("changedaudiotrack", {
      id: currentTrack.id.toString(),
      label: currentTrack.name,
      language: currentTrack.lang ?? "unknown",
    });
    emit(
      "audiotracks",
      hls.audioTracks.map((v) => ({
        id: v.id.toString(),
        label: v.name,
        language: v.lang ?? "unknown",
      })),
    );
  }

  function setupQualityForHls() {
    if (videoElement && canPlayHlsNatively(videoElement)) {
      return; // nothing to change
    }

    if (!hls) return;
    if (!automaticQuality) {
      const sortedLevels = sortLevelsByQuality(hls.levels);
      const qualities = hlsLevelsToQualities(sortedLevels);
      const availableQuality = getPreferredQuality(qualities, {
        lastChosenQuality: preferenceQuality,
        automaticQuality,
      });
      if (availableQuality) {
        // Find the best level that matches our preferred quality
        const matchingLevels = hls.levels.filter(
          (level) => hlsLevelToQuality(level) === availableQuality,
        );
        if (matchingLevels.length > 0) {
          // Pick the highest resolution level for this quality
          const bestLevel = sortLevelsByQuality(matchingLevels)[0];
          const levelIndex = hls.levels.indexOf(bestLevel);
          if (levelIndex !== -1) {
            hls.nextLevel = levelIndex;
          }
        }
      }
    } else {
      hls.nextLevel = -1;
    }
  }

  function setupSource(vid: HTMLVideoElement, src: LoadableSource) {
    hls = null;
    if (src.type === "hls") {
      if (canPlayHlsNatively(vid)) {
        vid.src = processCdnLink(src.url);
        vid.currentTime = startAt;
        return;
      }

      if (!Hls.isSupported())
        throw new Error("HLS not supported. Update your browser. 🤦‍♂️");
      if (!hls) {
        hls = new Hls({
          autoStartLoad: true,

          // YouTube-Style Aggressive Buffering Strategy
          // ============================================

          // 1. FAST STARTUP - Start with LOWEST quality for instant playback
          startLevel: 0, // Force lowest quality (360p/480p) for fast start
          capLevelToPlayerSize: true, // Don't load 4K for small player
          maxBufferLength: 90, // Buffer up to 90 seconds ahead (YouTube-like)
          maxMaxBufferLength: 180, // Max 3 minutes buffer (aggressive)
          backBufferLength: 30, // Keep 30s back buffer for seeking

          // 2. AGGRESSIVE PREFETCHING - Load next segments in parallel
          enableFragmentPrefetch: true, // Enable parallel fragment downloads
          prefetchBufferThreshold: 1, // Start prefetch after just 1s (very aggressive)
          maxParallelFragmentLoads: 4, // 4 parallel downloads (balanced - was 8, too aggressive)

          // 3. SMART BUFFER MANAGEMENT
          maxBufferHole: 0.5, // Tolerate 0.5s gaps (smooth playback)
          highBufferWatchdogPeriod: 2, // Check buffer health every 2s
          nudgeOffset: 0.1, // Fine-tune playback position
          nudgeMaxRetry: 5, // Retry nudging if needed

          // 4. FAST LOADING - Reduce timeouts for quicker failures
          fragLoadPolicy: {
            default: {
              maxLoadTimeMs: 20 * 1000, // 20s timeout (faster than before)
              maxTimeToFirstByteMs: 10 * 1000, // 10s for first byte
              errorRetry: {
                maxNumRetry: 3, // Retry 3 times quickly
                retryDelayMs: 500, // 500ms between retries
                maxRetryDelayMs: 2000, // Max 2s delay
              },
              timeoutRetry: {
                maxNumRetry: 2,
                retryDelayMs: 0,
                maxRetryDelayMs: 0,
              },
            },
          },

          // 5. PERFORMANCE OPTIMIZATIONS
          enableWorker: true, // Use web worker (smoother UI)
          lowLatencyMode: false, // Standard mode for VOD
          progressive: true, // Progressive download

          // 6. ADAPTIVE QUALITY SWITCHING (YouTube-style)
          // Start conservative, upgrade aggressively when buffer is healthy
          abrEwmaDefaultEstimate: 500000, // Start with 500kbps estimate (conservative)
          abrBandWidthFactor: 0.7, // Use 70% of bandwidth (conservative, prevents buffering)
          abrBandWidthUpFactor: 0.9, // Upgrade at 90% (aggressive quality increase when buffer is good)
          abrEwmaFastLive: 3.0, // Fast adaptation for live (3 segments)
          abrEwmaSlowLive: 9.0, // Slow adaptation for VOD (9 segments)

          renderTextTracksNatively: false,
        });
        const exceptions = [
          "Failed to execute 'appendBuffer' on 'SourceBuffer': This SourceBuffer has been removed from the parent media source.",
        ];
        hls?.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error", data);

          // Extract detailed HLS error information
          const hlsErrorInfo = {
            details: data.details,
            fatal: data.fatal,
            level: data.level,
            levelDetails: (data as any).levelDetails
              ? {
                  url: (data as any).levelDetails.url,
                  width: (data as any).levelDetails.width,
                  height: (data as any).levelDetails.height,
                  bitrate: (data as any).levelDetails.bitrate,
                }
              : undefined,
            frag: data.frag
              ? {
                  url: data.frag.url,
                  baseurl: data.frag.baseurl,
                  duration: data.frag.duration,
                  start: data.frag.start,
                  sn: data.frag.sn,
                }
              : undefined,
            type: data.type,
            url: (data as any).url,
          };

          // Try to recover from network errors (expired URLs, 404s)
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Check if this is a 403/404 error - don't try to recover, skip to next source
                const errorStatus = (data as any).response?.code || 0;
                if (errorStatus === 403 || errorStatus === 404) {
                  emit("tryNextSource", {
                    reason: `Stream returned ${errorStatus}`,
                  });
                  return;
                }
                // For other network errors, try to recover
                hls?.startLoad();
                // Set a timeout - if still failing after 5s, skip to next source
                setTimeout(() => {
                  if (
                    hls &&
                    !videoElement?.paused &&
                    videoElement?.readyState === 0
                  ) {
                    emit("tryNextSource", {
                      reason: "Network recovery failed",
                    });
                  }
                }, 5000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("[HLS] Media error, attempting recovery...");
                hls?.recoverMediaError();
                break;
              default:
                // Cannot recover, emit error and try next source
                emit("tryNextSource", {
                  reason: data.error?.message || "HLS Error",
                });
                if (
                  src?.url === data.frag?.baseurl &&
                  !exceptions.includes(data.error?.message || "")
                ) {
                  emit("error", {
                    message: data.error?.message || "HLS Error",
                    stackTrace: data.error?.stack,
                    errorName: data.error?.name,
                    type: "hls",
                    hls: hlsErrorInfo,
                  });
                }
                break;
            }
          } else {
            // Non-fatal errors - handle gracefully
            if (data.details === "manifestLoadError") {
              // Handle manifest load errors specifically - skip to next source
              emit("tryNextSource", {
                reason: "Failed to load HLS manifest",
              });
              emit("error", {
                message: "Failed to load HLS manifest",
                stackTrace: data.error?.stack || "",
                errorName: data.error?.name || "ManifestLoadError",
                type: "hls",
                hls: hlsErrorInfo,
              });
            } else if (data.details === "fragParsingError") {
              // Fragment parsing errors - try to continue playback
              console.warn(
                "[HLS] Fragment parsing error, continuing playback...",
              );
              // Don't emit error, just log and continue
            }
          }
        });
        hls.on(Hls.Events.MANIFEST_LOADED, () => {
          if (!hls) return;
          reportLevels();
          setupQualityForHls();
          reportAudioTracks();

          // Extension event listeners removed
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, () => {
          if (!hls) return;
          const quality = hlsLevelToQuality(hls.levels[hls.currentLevel]);
          emit("changedquality", quality);
        });
        hls.on(Hls.Events.SUBTITLE_TRACK_LOADED, () => {
          for (const [lang, resolve] of languagePromises) {
            const track = hls?.subtitleTracks.find((t) => t.lang === lang);
            if (track) {
              resolve();
              languagePromises.delete(lang);
              break;
            }
          }
        });

        // VidPly.js Prefetch Events (for debugging)
        if (import.meta.env.DEV) {
          hls.on("hlsFragPrefetched" as any, (_: any) => {});
          hls.on("hlsFragPrefetchPromoted" as any, (_: any) => {});
          hls.on("hlsFragPrefetchAborted" as any, (_: any) => {});
        }
      }

      hls.attachMedia(vid);

      // YouTube-Level Resume: Calculate safe resume position
      const meta = usePlayerStore.getState().meta;
      let resumePosition = startAt;
      let hasResumeData = false;

      if (meta) {
        const mediaId =
          meta.type === "show" && meta.episode
            ? `${meta.tmdbId}-${meta.episode.tmdbId}`
            : meta.tmdbId;

        if (mediaId) {
          const resumeTime = getResumeTime(mediaId);
          if (resumeTime > 0) {
            const safeTime = getSafeResumeTime(resumeTime);
            console.log(
              `[Resume] ${resumeTime}s → ${safeTime}s (segment-safe)`,
            );
            resumePosition = safeTime;
            hasResumeData = true;
          }
        }
      }

      // Step 1: Load manifest first
      hls.loadSource(processCdnLink(src.url));

      // Step 2: Wait for MANIFEST_PARSED, then apply safe seek
      let hasAppliedSeek = false;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hasAppliedSeek || !vid) return;
        hasAppliedSeek = true;

        if (resumePosition > 0) {
          console.log(
            `[Resume] Seeking to ${resumePosition}s after manifest parsed`,
          );
          vid.currentTime = resumePosition;
        }
      });

      // Step 3: Auto-play when buffer is ready (YouTube model)
      let hasAttemptedPlay = false;
      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        if (hasAttemptedPlay || !vid) return;
        if (vid.paused && vid.readyState >= 2) {
          hasAttemptedPlay = true;

          // Muted autoplay for mobile compatibility
          const wasMuted = vid.muted;
          vid.muted = true;
          vid
            .play()
            .then(() => {
              console.log("[Resume] Playback started");
              setTimeout(() => {
                vid.muted = wasMuted;
              }, 100);
            })
            .catch((err) => {
              console.warn("[Resume] Play failed:", err);
              vid.muted = wasMuted;
            });
        }
      });

      // Step 4: Stall detection & silent recovery (YouTube model)
      if (hasResumeData) {
        setTimeout(() => {
          if (!vid) return;

          // Check if playback is stalled
          if (vid.readyState < 3 && vid.paused) {
            console.warn("[Resume] Stalled - retrying 4s earlier");

            // Seek back 4s and retry
            const fallbackTime = Math.max(resumePosition - 4, 0);
            vid.currentTime = fallbackTime;

            setTimeout(() => {
              vid.play().catch(() => {
                console.warn("[Resume] Retry failed - starting from beginning");
                vid.currentTime = 0;
                vid.play().catch(() => {});
              });
            }, 500);
          }
        }, 3000); // 3s stall detection window
      }

      return;
    }

    vid.src = processCdnLink(src.url);
    vid.currentTime = startAt;
  }

  function webkitPresentationModeChange() {
    if (!videoElement) return;
    const webkitPlayer = videoElement as any;
    const isInWebkitPip =
      webkitPlayer.webkitPresentationMode === "picture-in-picture";
    isPictureInPicture = isInWebkitPip;
    // Use native tracks in WebKit PiP mode for iOS compatibility
    emit("needstrack", isInWebkitPip);

    // On iOS, entering PiP may allow autoplay that was previously blocked
    if (isInWebkitPip && videoElement.paused && shouldAutoplayAfterLoad) {
      shouldAutoplayAfterLoad = false;
      videoElement.play().catch(() => {
        // If still blocked, emit pause to show play button
        emit("pause", undefined);
      });
    }
  }

  function setSource() {
    if (!videoElement || !source) return;
    setupSource(videoElement, source);

    videoElement.addEventListener("play", () => {
      emit("play", undefined);
    });
    videoElement.addEventListener("error", () => {
      const err = videoElement?.error ?? null;
      const errorDetails = getMediaErrorDetails(err);
      emit("error", {
        errorName: errorDetails.name,
        key: errorDetails.key,
        type: "htmlvideo",
      });
    });
    videoElement.addEventListener("playing", () => {
      emit("play", undefined);
      emit("loading", false); // Always clear loading when actually playing
      if (loadingTimeout) clearTimeout(loadingTimeout); // Clear timeout
    });
    videoElement.addEventListener("pause", () => emit("pause", undefined));
    videoElement.addEventListener("canplay", () => {
      emit("loading", false);
      if (loadingTimeout) clearTimeout(loadingTimeout); // Clear timeout
      // Attempt autoplay if this was an autoplay transition (startAt = 0)
      if (shouldAutoplayAfterLoad && startAt === 0 && videoElement) {
        shouldAutoplayAfterLoad = false; // Reset the flag
        // Try to play - this will work on most platforms, but iOS may block it
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Play was blocked (likely iOS), emit that we're not playing
            // The AutoPlayStart component will show a play button
            emit("pause", undefined);
          });
        }
      }
    });
    // Clear loading as soon as we have enough data loaded
    videoElement.addEventListener("loadeddata", () => {
      if (videoElement && videoElement.readyState >= 2) {
        emit("loading", false);
        if (loadingTimeout) clearTimeout(loadingTimeout); // Clear timeout
      }
    });
    videoElement.addEventListener("waiting", () => {
      emit("loading", true);

      // Auto-clear loading after 3 seconds if still waiting
      // This prevents spinner from sticking when HLS.js is aggressively buffering
      if (loadingTimeout) clearTimeout(loadingTimeout);
      loadingTimeout = setTimeout(() => {
        if (videoElement && videoElement.readyState >= 2) {
          emit("loading", false);
        }
      }, 1000); // Reduced from 3s to 1s for faster clearing
    });
    videoElement.addEventListener("volumechange", () =>
      emit(
        "volumechange",
        videoElement?.muted ? 0 : (videoElement?.volume ?? 0),
      ),
    );
    videoElement.addEventListener("timeupdate", () => {
      const currentTime = videoElement?.currentTime ?? 0;
      // Always emit time updates when seeking to prevent subtitle freezing
      // Also emit when progressing forward or when time changes significantly
      // This prevents time from resetting to 0 during source switches
      if (
        currentTime >= lastValidTime ||
        isSeeking ||
        Math.abs(currentTime - lastValidTime) > 0.1
      ) {
        lastValidTime = currentTime;
        emit("time", currentTime);
      }
    });
    videoElement.addEventListener("loadedmetadata", () => {
      if (
        source?.type === "hls" &&
        videoElement &&
        canPlayHlsNatively(videoElement)
      ) {
        emit("qualities", ["unknown"]);
        emit("changedquality", "unknown");
      }
      // Only emit duration if it's a valid value (> 0) to prevent progress reset during source switches
      const duration = videoElement?.duration ?? 0;
      if (duration > 0) {
        lastValidDuration = duration;
        emit("duration", duration);
      } else if (lastValidDuration > 0) {
        // Keep the last valid duration if the new one is invalid
        emit("duration", lastValidDuration);
      }
    });
    videoElement.addEventListener("progress", () => {
      if (videoElement) {
        const buffered = handleBuffered(
          videoElement.currentTime,
          videoElement.buffered,
        );
        emit("buffered", buffered);

        // Aggressive loading clear: Hide spinner with minimal buffer
        const currentTime = videoElement.currentTime;
        const hasMinimalBuffer = buffered > currentTime + 0.5; // Just 0.5s
        const isReadyToPlay = videoElement.readyState >= 3; // HAVE_FUTURE_DATA

        // Clear loading if we have buffer OR video is ready
        // Don't check paused state - we want to clear loading even if paused
        if (hasMinimalBuffer || isReadyToPlay) {
          emit("loading", false);
        }
      }
    });
    videoElement.addEventListener("webkitendfullscreen", () => {
      isFullscreen = false;
      emit("fullscreen", isFullscreen);
      if (!isFullscreen) emit("needstrack", false);
    });
    videoElement.addEventListener(
      "webkitplaybacktargetavailabilitychanged",
      (e: any) => {
        if (e.availability === "available") {
          emit("canairplay", true);
        }
      },
    );
    videoElement.addEventListener(
      "webkitpresentationmodechanged",
      webkitPresentationModeChange,
    );
    videoElement.addEventListener("ratechange", () => {
      if (videoElement) emit("playbackrate", videoElement.playbackRate);
    });

    videoElement.addEventListener("durationchange", () => {
      // Only emit duration if it's a valid value (> 0) to prevent progress reset during source switches
      const duration = videoElement?.duration ?? 0;
      if (duration > 0) {
        lastValidDuration = duration;
        emit("duration", duration);
      } else if (lastValidDuration > 0) {
        // Keep the last valid duration if the new one is invalid
        emit("duration", lastValidDuration);
      }
    });
  }

  function unloadSource() {
    if (videoElement) {
      videoElement.removeAttribute("src");
      videoElement.load();
    }
    if (hls) {
      hls.destroy();
      hls = null;
    }
    // Reset the last valid duration and time when unloading source
    lastValidDuration = 0;
    lastValidTime = 0;
  }

  function destroyVideoElement() {
    unloadSource();
    if (videoElement) {
      videoElement = null;
    }
  }

  function fullscreenChange() {
    isFullscreen =
      !!document.fullscreenElement || // other browsers
      !!(document as any).webkitFullscreenElement; // safari
    emit("fullscreen", isFullscreen);
    if (!isFullscreen) emit("needstrack", false);

    // On iOS, entering fullscreen may allow autoplay that was previously blocked
    if (
      isFullscreen &&
      videoElement &&
      videoElement.paused &&
      shouldAutoplayAfterLoad
    ) {
      shouldAutoplayAfterLoad = false;
      videoElement.play().catch(() => {
        // If still blocked, emit pause to show play button
        emit("pause", undefined);
      });
    }
  }
  fscreen.addEventListener("fullscreenchange", fullscreenChange);

  function pictureInPictureChange() {
    isPictureInPicture = !!document.pictureInPictureElement;
    // Use native tracks in PiP mode for better compatibility with iOS and other platforms
    emit("needstrack", isPictureInPicture);

    // Entering PiP may allow autoplay that was previously blocked
    if (
      isPictureInPicture &&
      videoElement &&
      videoElement.paused &&
      shouldAutoplayAfterLoad
    ) {
      shouldAutoplayAfterLoad = false;
      videoElement.play().catch(() => {
        // If still blocked, emit pause to show play button
        emit("pause", undefined);
      });
    }
  }

  document.addEventListener("enterpictureinpicture", pictureInPictureChange);
  document.addEventListener("leavepictureinpicture", pictureInPictureChange);

  return {
    on,
    off,
    getType() {
      return "web";
    },
    destroy: () => {
      destroyVideoElement();
      fscreen.removeEventListener("fullscreenchange", fullscreenChange);
      document.removeEventListener(
        "enterpictureinpicture",
        pictureInPictureChange,
      );
      document.removeEventListener(
        "leavepictureinpicture",
        pictureInPictureChange,
      );
    },
    load(ops: {
      source: LoadableSource | null;
      automaticQuality: boolean;
      preferredQuality: string | null;
      startAt: number;
    }) {
      if (!ops.source) unloadSource();
      automaticQuality = ops.automaticQuality;
      preferenceQuality = ops.preferredQuality;
      source = ops.source;
      emit("loading", true);
      startAt = ops.startAt;
      // Set autoplay flag if starting from beginning (indicates autoplay transition)
      shouldAutoplayAfterLoad = ops.startAt === 0;
      setSource();
    },
    changeQuality(
      newAutomaticQuality: boolean,
      newPreferredQuality: string | null,
    ) {
      if (source?.type !== "hls") return;
      automaticQuality = newAutomaticQuality;
      preferenceQuality = newPreferredQuality;
      setupQualityForHls();
    },

    processVideoElement(video: HTMLVideoElement | null) {
      destroyVideoElement();
      videoElement = video;
      setSource();
      this.setVolume(lastVolume);
    },
    processContainerElement(container: HTMLElement | null) {
      containerElement = container;
    },
    setMeta() {},
    setCaption() {},

    pause() {
      videoElement?.pause();
    },
    play() {
      videoElement?.play();
    },
    setSeeking(active: boolean) {
      if (active === isSeeking) return;
      isSeeking = active;

      // if it was playing when starting to seek, play again
      if (!active) {
        if (!isPausedBeforeSeeking) this.play();
        return;
      }

      isPausedBeforeSeeking = videoElement?.paused ?? true;
      this.pause();
    },
    setTime(t: number) {
      if (!videoElement) return;
      // clamp time between 0 and max duration
      let time = Math.min(t, videoElement.duration);
      time = Math.max(0, time);

      if (Number.isNaN(time)) return;
      emit("time", time);
      videoElement.currentTime = time;
    },
    async setVolume(v: number) {
      // clamp time between 0 and 1
      let volume = Math.min(v, 1);
      volume = Math.max(0, volume);

      // actually set
      lastVolume = v;
      if (!videoElement) return;
      videoElement.muted = volume === 0; // Muted attribute is always supported

      // update state
      const isChangeable = await canChangeVolume();
      if (isChangeable) {
        videoElement.volume = volume;
      } else {
        // For browsers where it can't be changed
        emit("volumechange", volume === 0 ? 0 : 1);
      }
    },
    toggleFullscreen() {
      if (isFullscreen) {
        isFullscreen = false;
        emit("fullscreen", isFullscreen);
        emit("needstrack", false);
        if (!fscreen.fullscreenElement) return;
        fscreen.exitFullscreen();
        return;
      }

      // enter fullscreen
      isFullscreen = true;
      emit("fullscreen", isFullscreen);
      if (!canFullscreen() || fscreen.fullscreenElement) return;
      if (canFullscreenAnyElement()) {
        if (containerElement) fscreen.requestFullscreen(containerElement);
        return;
      }
      if (canWebkitFullscreen()) {
        if (videoElement) {
          emit("needstrack", true);
          (videoElement as any).webkitEnterFullscreen();
        }
      }
    },
    togglePictureInPicture() {
      if (!videoElement) return;
      if (canWebkitPictureInPicture()) {
        const webkitPlayer = videoElement as any;
        webkitPlayer.webkitSetPresentationMode(
          webkitPlayer.webkitPresentationMode === "picture-in-picture"
            ? "inline"
            : "picture-in-picture",
        );
      }
      if (canPictureInPicture()) {
        if (videoElement !== document.pictureInPictureElement) {
          videoElement.requestPictureInPicture();
        } else {
          document.exitPictureInPicture();
        }
      }
    },
    startAirplay() {
      const videoPlayer = videoElement as any;
      if (!videoPlayer || !videoPlayer.webkitShowPlaybackTargetPicker) return;

      if (!source) {
        // No source loaded, just trigger Airplay
        videoPlayer.webkitShowPlaybackTargetPicker();
        return;
      }

      // Store the original URL to restore later
      const originalUrl =
        source?.type === "hls" ? hls?.url || source.url : videoPlayer.src;

      let proxiedUrl: string | null = null;

      if (source?.type === "hls") {
        // Only proxy HLS streams if they need it:
        // 1. Not already proxied AND
        // 2. Has headers (either preferredHeaders or headers)
        const allHeaders = {
          ...source.preferredHeaders,
          ...source.headers,
        };
        const hasHeaders = Object.keys(allHeaders).length > 0;

        // Don't create proxy URL if it's already using the proxy
        if (!isUrlAlreadyProxied(source.url) && hasHeaders) {
          proxiedUrl = createM3U8ProxyUrl(source.url, allHeaders);
        } else {
          proxiedUrl = source.url; // Already proxied or no headers needed
        }
      } else if (source?.type === "mp4") {
        // TODO: Implement MP4 proxy for protected streams
        const hasHeaders =
          source.headers && Object.keys(source.headers).length > 0;
        if (hasHeaders) {
          // Use MP4 proxy for streams with headers
          proxiedUrl = createMP4ProxyUrl(source.url, source.headers || {});
        } else {
          proxiedUrl = source.url;
        }
      }

      if (proxiedUrl && proxiedUrl !== originalUrl) {
        // Temporarily set the proxied URL for Airplay
        if (source?.type === "hls") {
          if (hls) {
            hls.loadSource(proxiedUrl);
          }
        } else {
          videoPlayer.src = proxiedUrl;
        }

        // Small delay to ensure the URL is set before triggering Airplay
        setTimeout(() => {
          videoPlayer.webkitShowPlaybackTargetPicker();

          // Restore original URL after a short delay
          setTimeout(() => {
            if (source?.type === "hls") {
              if (hls && originalUrl) {
                hls.loadSource(originalUrl);
              }
            } else if (originalUrl) {
              videoPlayer.src = originalUrl;
            }
          }, 1000);
        }, 100);
      } else {
        // No proxying needed, just trigger Airplay
        videoPlayer.webkitShowPlaybackTargetPicker();
      }
    },
    setPlaybackRate(rate: number) {
      if (videoElement) videoElement.playbackRate = rate;
    },
    getCaptionList() {
      return (
        hls?.subtitleTracks.map((track) => {
          return {
            id: track.id.toString(),
            language: track.lang ?? "unknown",
            url: track.url,
            type: "vtt", // HLS captions are typically VTT format
            needsProxy: false,
            hls: true,
          };
        }) ?? []
      );
    },
    getSubtitleTracks() {
      return hls?.subtitleTracks ?? [];
    },
    async setSubtitlePreference(lang: string | undefined) {
      // default subtitles are already loaded by hls.js
      const track = hls?.subtitleTracks.find((t) => t.lang === lang);
      if (track?.details !== undefined) return Promise.resolve();

      // need to wait a moment before hls loads the subtitles
      const promise = new Promise<void>((resolve, reject) => {
        languagePromises.set(lang, resolve);

        // reject after some time, if hls.js fails to load the subtitles
        // for any reason
        setTimeout(() => {
          reject();
          languagePromises.delete(lang);
        }, 5000);
      });
      hls?.setSubtitleOption({ lang });
      return promise;
    },
    changeAudioTrack(track: { id: string }) {
      if (!hls) return;
      const audioTrack = hls?.audioTracks.find(
        (t) => t.id.toString() === track.id,
      );
      if (!audioTrack) return;
      hls.audioTrack = hls.audioTracks.indexOf(audioTrack);
      emit("changedaudiotrack", {
        id: audioTrack.id.toString(),
        label: audioTrack.name,
        language: audioTrack.lang ?? "unknown",
      });
    },
    // Provider switch - fully disconnect and abort all in-flight requests
    pauseFetching() {
      // Save current time before disconnecting
      if (videoElement && videoElement.currentTime > 0) {
        lastValidTime = videoElement.currentTime;
      }
      // Emit loading state to show spinner
      emit("loading", true);
      if (hls) {
        // stopLoad cancels pending requests
        hls.stopLoad();
        // detachMedia aborts any in-flight segment downloads and clears video
        hls.detachMedia();
      }
      // Clear video src to show black background immediately
      if (videoElement) {
        videoElement.pause();
        // Remove src to show black bg
        videoElement.removeAttribute("src");
        videoElement.load(); // Reset to blank state
      }
    },
    // Provider switch - resume segment fetching if provider switch fails
    resumeFetching() {
      if (hls && videoElement && source) {
        // Reattach and reload the source
        hls.attachMedia(videoElement);
        hls.loadSource(processCdnLink(source.url));
        // Resume at saved position
        videoElement.currentTime = lastValidTime > 0 ? lastValidTime : startAt;
      } else if (videoElement && source) {
        // Native playback - reload the source
        videoElement.src = processCdnLink(source.url);
        videoElement.currentTime = lastValidTime > 0 ? lastValidTime : startAt;
      }
      // Attempt to resume playback
      if (videoElement) {
        videoElement.play().catch(() => {
          emit("pause", undefined);
        });
      }
      emit("loading", false);
    },
  };
}
