/* eslint-disable no-console */
import { ScrapeMedia } from "@/hooks/useProviderScrape";
import { MakeSlice } from "@/stores/player/slices/types";
import {
  SourceQuality,
  SourceSliceSource,
  selectQuality,
} from "@/stores/player/utils/qualities";
import { useQualityStore } from "@/stores/quality";
import { ValuesOf } from "@/utils/typeguard";

export const playerStatus = {
  IDLE: "idle",
  RESUME: "resume",
  SCRAPING: "scraping",
  PLAYING: "playing",
  SCRAPE_NOT_FOUND: "scrapeNotFound",
  PLAYBACK_ERROR: "playbackError",
} as const;

export type PlayerStatus = ValuesOf<typeof playerStatus>;

export interface PlayerMetaEpisode {
  number: number;
  tmdbId: string;
  title: string;
  air_date?: string;
}

export interface PlayerMeta {
  type: "movie" | "show";
  title: string;
  tmdbId: string;
  imdbId?: string;
  releaseYear: number;
  poster?: string;
  backdrop?: string;
  episodes?: PlayerMetaEpisode[];
  episode?: PlayerMetaEpisode;
  season?: {
    number: number;
    tmdbId: string;
    title: string;
  };
}

export interface Caption {
  id: string;
  language: string;
  url?: string;
  srtData: string;
}

export interface CaptionListItem {
  id: string;
  language: string;
  url: string;
  type?: string;
  needsProxy: boolean;
  hls?: boolean;
  opensubtitles?: boolean;
  // subtitle details from wyzie
  display?: string;
  media?: string;
  isHearingImpaired?: boolean;
  source?: string;
  encoding?: string;
}

export interface AudioTrack {
  id: string;
  label: string;
  language: string;
}

export interface SourceSlice {
  status: PlayerStatus;
  source: SourceSliceSource | null;
  sourceId: string | null;
  embedId: string | null;
  qualities: SourceQuality[];
  audioTracks: AudioTrack[];
  currentQuality: SourceQuality | null;
  currentAudioTrack: AudioTrack | null;
  captionList: CaptionListItem[];
  caption: {
    selected: Caption | null;
    asTrack: boolean;
  };
  meta: PlayerMeta | null;
  // Multi-stream support
  availableStreams: any[]; // Array of VidNinjaStream
  currentStreamIndex: number;
  // Failed providers (HLS playback errors)
  failedProviders: string[];
  // Provider switch state
  isSwitchingProvider: boolean;
  wasPlayingBeforeSwitch: boolean;
  addFailedProvider(providerId: string): void;
  clearFailedProviders(): void;
  setStatus(status: PlayerStatus): void;
  setSource(
    stream: SourceSliceSource,
    captions: CaptionListItem[],
    startAt: number,
    allStreams?: any[], // Optional array of all available streams
  ): void;
  switchQuality(quality: SourceQuality): void;
  switchStream(index: number): void; // Switch to a different stream
  setMeta(meta: PlayerMeta, status?: PlayerStatus): void;
  setCaption(caption: Caption | null): void;
  setSourceId(id: string | null): void;
  setEmbedId(id: string | null): void;
  enableAutomaticQuality(): void;
  redisplaySource(startAt: number): void;
  setCaptionAsTrack(asTrack: boolean): void;
  // Session-based scraping
  scrapeSessionId: string | null;
  sessionProviders: { index: number; name: string; status: string }[];
  setScrapeSessionId(id: string | null): void;
  setSessionProviders(
    providers: { index: number; name: string; status: string }[],
  ): void;
  // Provider switch - pause/resume current playback
  pauseCurrentPlayback(): void;
  resumeCurrentPlayback(): void;
}

export function metaToScrapeMedia(meta: PlayerMeta): ScrapeMedia {
  if (meta.type === "show") {
    if (!meta.episode || !meta.season) throw new Error("missing show data");
    return {
      title: meta.title,
      releaseYear: meta.releaseYear,
      tmdbId: meta.tmdbId,
      type: "show",
      imdbId: meta.imdbId,
      episode: meta.episode,
      season: meta.season,
      backdropPath: meta.backdrop,
    };
  }

  return {
    title: meta.title,
    releaseYear: meta.releaseYear,
    tmdbId: meta.tmdbId,
    type: "movie",
    imdbId: meta.imdbId,
    backdropPath: meta.backdrop,
  };
}

export const createSourceSlice: MakeSlice<SourceSlice> = (set, get) => ({
  source: null,
  sourceId: null,
  embedId: null,
  qualities: [],
  audioTracks: [],
  captionList: [],
  currentQuality: null,
  currentAudioTrack: null,
  status: playerStatus.IDLE,
  meta: null,
  caption: {
    selected: null,
    asTrack: false,
  },
  availableStreams: [],
  currentStreamIndex: 0,
  failedProviders: [],
  isSwitchingProvider: false,
  wasPlayingBeforeSwitch: false,
  scrapeSessionId: null,
  sessionProviders: [],
  setScrapeSessionId(id) {
    set((s) => {
      s.scrapeSessionId = id;
    });
  },
  setSessionProviders(providers) {
    set((s) => {
      s.sessionProviders = providers;
    });
  },
  addFailedProvider(providerId: string) {
    set((s) => {
      if (!s.failedProviders.includes(providerId)) {
        s.failedProviders = [...s.failedProviders, providerId];
      }
    });
  },
  clearFailedProviders() {
    set((s) => {
      s.failedProviders = [];
    });
  },
  setSourceId(id) {
    set((s) => {
      s.status = playerStatus.PLAYING;
      s.sourceId = id;
    });
  },
  setEmbedId(id) {
    set((s) => {
      s.embedId = id;
    });
  },
  setStatus(status: PlayerStatus) {
    set((s) => {
      s.status = status;
    });
  },
  setMeta(meta, newStatus) {
    set((s) => {
      s.meta = meta;
      s.embedId = null;
      s.sourceId = null;
      s.interface.hideNextEpisodeBtn = false;
      s.failedProviders = []; // Reset failed providers
      s.scrapeSessionId = null; // Reset session
      s.sessionProviders = []; // Reset session providers
      if (newStatus) s.status = newStatus;
    });
  },
  setCaption(caption) {
    const store = get();
    store.display?.setCaption(caption);
    set((s) => {
      s.caption.selected = caption;
    });
  },
  setSource(
    stream: SourceSliceSource,
    captions: CaptionListItem[],
    startAt: number,
    allStreams?: any[],
  ) {
    let qualities: string[] = [];
    if (stream.type === "file") qualities = Object.keys(stream.qualities);
    const qualityPreferences = useQualityStore.getState();
    const loadableStream = selectQuality(stream, qualityPreferences.quality);

    // Build audio tracks from available streams
    const audioTracks: AudioTrack[] = [];
    if (allStreams && allStreams.length > 1) {
      allStreams.forEach((s, index) => {
        audioTracks.push({
          id: `stream-${index}`,
          label: s.label || s.quality || `Stream ${index + 1}`,
          language: s.language || "en",
        });
      });
    }

    set((s) => {
      s.source = stream;
      s.qualities = qualities as SourceQuality[];
      s.currentQuality = loadableStream.quality;
      s.captionList = captions;
      s.interface.error = undefined;
      s.status = playerStatus.PLAYING;
      s.availableStreams = allStreams || [stream];
      s.currentStreamIndex = 0;
      s.audioTracks = audioTracks;
      s.currentAudioTrack = audioTracks.length > 0 ? audioTracks[0] : null;
    });
    const store = get();
    store.redisplaySource(startAt);
  },
  redisplaySource(startAt: number) {
    const store = get();
    const quality = store.currentQuality;
    if (!store.source) return;
    const qualityPreferences = useQualityStore.getState();
    const loadableStream = selectQuality(store.source, {
      automaticQuality: qualityPreferences.quality.automaticQuality,
      lastChosenQuality: quality,
    });
    set((s) => {
      s.interface.error = undefined;
      s.status = playerStatus.PLAYING;
    });
    store.display?.load({
      source: loadableStream.stream,
      startAt,
      automaticQuality: qualityPreferences.quality.automaticQuality,
      preferredQuality: qualityPreferences.quality.lastChosenQuality,
    });
  },
  switchQuality(quality) {
    const store = get();
    if (!store.source) return;
    if (store.source.type === "file") {
      const selectedQuality = store.source.qualities[quality];
      if (!selectedQuality) return;
      set((s) => {
        s.currentQuality = quality;
        s.status = playerStatus.PLAYING;
        s.interface.error = undefined;
      });
      store.display?.load({
        source: selectedQuality,
        startAt: store.progress.time,
        automaticQuality: false,
        preferredQuality: quality,
      });
    } else if (store.source.type === "hls") {
      store.display?.changeQuality(false, quality);
    }
  },
  switchStream(index) {
    // TODO: Multi-stream switching not implemented with new RunOutput format
    // This would require re-fetching the stream from a different server
    const store = get();
    const stream = store.availableStreams[index];
    if (!stream) return;

    // For now, just log and do nothing - multi-stream selection not supported
    // eslint-disable-next-line no-console
    console.log(
      `[Player] switchStream called for index ${index}, but not implemented`,
    );
  },
  enableAutomaticQuality() {
    const store = get();
    store.display?.changeQuality(true, null);
  },
  setCaptionAsTrack(asTrack: boolean) {
    set((s) => {
      s.caption.asTrack = asTrack;
    });
  },
  // Provider switch - pause current playback and segment fetching
  pauseCurrentPlayback() {
    const store = get();
    // Only pause if we have an active source and not already switching
    if (!store.source || store.isSwitchingProvider) return;

    console.log("[Player] Pausing current playback for provider switch");
    set((s) => {
      s.isSwitchingProvider = true;
      s.wasPlayingBeforeSwitch = s.status === playerStatus.PLAYING;
    });
    store.display?.pauseFetching();
  },
  // Provider switch - resume current playback if new provider failed
  resumeCurrentPlayback() {
    const store = get();
    // Only resume if we were switching and still have a source
    if (!store.isSwitchingProvider || !store.source) return;

    console.log("[Player] Resuming current playback - new provider failed");
    set((s) => {
      s.isSwitchingProvider = false;
    });
    // Resume only if we were playing before the switch
    if (store.wasPlayingBeforeSwitch) {
      store.display?.resumeFetching();
    }
    set((s) => {
      s.wasPlayingBeforeSwitch = false;
    });
  },
});
