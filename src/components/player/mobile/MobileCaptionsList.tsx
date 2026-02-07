import { Check, Settings } from "lucide-react";
import React, { useState } from "react";
import { usePlayerStore } from "@/stores/player/store";
import { useCaptions } from "@/components/player/hooks/useCaptions";
import { getLanguageName } from "@/utils/languageNames";
import { useSubtitleStore } from "@/stores/subtitles";
import { MobileOverlay } from "./MobileOverlay";

interface MobileCaptionsListProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function MobileCaptionsList({
  isOpen,
  onClose,
  onOpenSettings,
}: MobileCaptionsListProps) {
  const captionList = usePlayerStore((s) => s.captionList);
  const selectedCaption = usePlayerStore((s) => s.caption.selected);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const { selectCaptionById } = useCaptions();

  // Audio tracks
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const display = usePlayerStore((s) => s.display);

  const handleCaptionSelect = async (captionId: string | null) => {
    if (!captionId) {
      setCaption(null);
      return;
    }
    try {
      await selectCaptionById(captionId);
      onClose(); // Auto-close on selection? user said "can get rid of it if not needed", but usually selection closes menu
    } catch (error) {
      console.error("Failed to load caption:", error);
    }
  };

  const handleAudioSelect = (trackId: string) => {
    if (display) {
      display.setAudioTrack(trackId);
      onClose();
    }
  };

  return (
    <MobileOverlay isOpen={isOpen} onClose={onClose} title="Captions & Audio">
      <div className="space-y-6 pb-4">
        {/* Subtitles Section */}
        <div>
          <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 px-2">
            Subtitles
          </h4>
          <div className="space-y-1">
            <button
              onClick={() => handleCaptionSelect(null)}
              className="w-full px-3 py-3 rounded-lg flex items-center gap-3 bg-white/5 hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full border border-white/20 flex items-center justify-center ${
                  !selectedCaption ? "bg-white border-white" : ""
                }`}
              >
                {!selectedCaption && <Check className="w-3 h-3 text-black" />}
              </div>
              <span className="text-white text-base">Off</span>
            </button>

            {captionList.map((caption, index) => {
              let displayName =
                caption.display || getLanguageName(caption.language);
              if (
                !caption.display &&
                (!caption.language || caption.language === "en")
              ) {
                displayName = `Subtitle ${index + 1}`;
              }
              const isSelected = selectedCaption?.id === caption.id;
              return (
                <button
                  key={caption.id}
                  onClick={() => handleCaptionSelect(caption.id)}
                  className="w-full px-3 py-3 rounded-lg flex items-center gap-3 bg-white/5 hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded-full border border-white/20 flex items-center justify-center ${
                      isSelected ? "bg-white border-white" : ""
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <span className="text-white text-base truncate">
                    {displayName} {caption.isHearingImpaired && "(CC)"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Section */}
        {audioTracks.length > 0 && (
          <div>
            <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 px-2">
              Audio
            </h4>
            <div className="space-y-1">
              {audioTracks.map((track) => {
                const isSelected = currentAudioTrack?.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleAudioSelect(track.id)}
                    className="w-full px-3 py-3 rounded-lg flex items-center gap-3 bg-white/5 hover:bg-white/10 active:bg-white/20 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border border-white/20 flex items-center justify-center ${
                        isSelected ? "bg-white border-white" : ""
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <span className="text-white text-base truncate">
                      {track.label ||
                        getLanguageName(track.language) ||
                        `Track ${track.id}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings Button */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => {
              onClose(); // Close this overlay
              onOpenSettings(); // Open settings overlay
            }}
            className="w-full px-3 py-3 rounded-lg flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            <Settings className="w-5 h-5" />
            Subtitle Settings
          </button>
        </div>
      </div>
    </MobileOverlay>
  );
}
