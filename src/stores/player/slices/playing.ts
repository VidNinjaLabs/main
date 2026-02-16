import { MakeSlice } from "@/stores/player/slices/types";

export interface PlayingSlice {
  mediaPlaying: {
    isPlaying: boolean;
    isPaused: boolean;
    isSeeking: boolean; // seeking with progress bar
    isDragSeeking: boolean; // is seeking for our custom progress bar
    isLoading: boolean; // buffering or not
    hasPlayedOnce: boolean; // has the video played at all?
    hasResumed: boolean; // has auto-resumed to saved progress?
    volume: number;
    playbackRate: number;
  };
  play(): void;
  pause(): void;
  setIsLoading(loading: boolean): void;
  setHasResumed(resumed: boolean): void;
}

export const createPlayingSlice: MakeSlice<PlayingSlice> = (set, get) => ({
  mediaPlaying: {
    isPlaying: false,
    isPaused: true,
    isLoading: false,
    isSeeking: false,
    isDragSeeking: false,
    hasPlayedOnce: false,
    hasResumed: false,
    volume: 1,
    playbackRate: 1,
  },
  play() {
    const display = get().display;
    display?.play();
  },
  pause() {
    const display = get().display;
    display?.pause();
  },
  setIsLoading(loading: boolean) {
    set((state) => {
      state.mediaPlaying.isLoading = loading;
    });
  },
  setHasResumed(resumed: boolean) {
    set((state) => {
      state.mediaPlaying.hasResumed = resumed;
    });
  },
});
