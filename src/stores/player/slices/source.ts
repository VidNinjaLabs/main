/* eslint-disable no-console */
import { convertProviderCaption } from "@/components/player/utils/captions";
import { convertRunoutputToSource } from "@/components/player/utils/convertRunoutputToSource";
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
  isLoadingExternalSubtitles: boolean;
  caption: {
    selected: Caption | null;
    asTrack: boolean;
  };
  meta: PlayerMeta | null;
  // Multi-stream support
  availableStreams: any[]; // Array of VidNinjaStream
  currentStreamIndex: number;
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
  addExternalSubtitles(): Promise<void>;
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
  isLoadingExternalSubtitles: false,
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

    // Trigger external subtitle scraping after stream is loaded
    // This runs asynchronously so it doesn't block the stream loading
    setTimeout(() => {
      store.addExternalSubtitles();
    }, 100);
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
    const store = get();
    const stream = store.availableStreams[index];
    if (!stream) return;

    const source = convertRunoutputToSource({ stream });
    const captions = convertProviderCaption(stream.captions);

    let qualities: string[] = [];
    if (source.type === "file") qualities = Object.keys(source.qualities);
    const qualityPreferences = useQualityStore.getState();
    const loadableStream = selectQuality(source, qualityPreferences.quality);

    set((s) => {
      s.source = source;
      s.qualities = qualities as SourceQuality[];
      s.currentQuality = loadableStream.quality;
      s.captionList = captions;
      s.interface.error = undefined;
      s.status = playerStatus.PLAYING;
      s.currentStreamIndex = index;
      s.currentAudioTrack = s.audioTracks[index] || null;
    });

    get().redisplaySource(store.progress.time);
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
  async addExternalSubtitles() {
    const store = get();
    if (!store.meta) return;

    set((s) => {
      s.isLoadingExternalSubtitles = true;
    });

    try {
      const { scrapeExternalSubtitles } =
        await import("@/utils/externalSubtitles");
      const externalCaptions = await scrapeExternalSubtitles(store.meta);

      if (externalCaptions.length > 0) {
        set((s) => {
          // Add external captions to the existing list, avoiding duplicates
          const existingIds = new Set(s.captionList.map((c) => c.id));
          const newCaptions = externalCaptions.filter(
            (c) => !existingIds.has(c.id),
          );
          s.captionList = [...s.captionList, ...newCaptions];
        });
        console.log(`Added ${externalCaptions.length} external captions`);
      }
    } catch (error) {
      console.error("Failed to scrape external subtitles:", error);
    } finally {
      set((s) => {
        s.isLoadingExternalSubtitles = false;
      });
    }
  },
});
