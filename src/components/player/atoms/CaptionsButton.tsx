import { ClosedCaptionIcon } from "@hugeicons/react";
import { useState } from "react";
import { Check } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { Popover } from "../base/Popover";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";

export function CaptionsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const captionList = usePlayerStore((s) => s.captionList);
  const selectedCaption = usePlayerStore((s) => s.caption.selected);
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const setCaption = usePlayerStore((s) => s.setCaption);

  const handleCaptionSelect = async (captionItem: any) => {
    if (!captionItem) {
      // Turn off captions
      setCaption(null);
      return;
    }

    // Fetch and set the caption
    try {
      const response = await fetch(captionItem.url);
      const srtData = await response.text();
      setCaption({
        id: captionItem.id,
        language: captionItem.language,
        url: captionItem.url,
        srtData,
      });
    } catch (error) {
      console.error("Failed to load caption:", error);
    }
  };

  const handleAudioSelect = (track: any) => {
    // TODO: Implement audio track switching
    console.log("Audio track selected:", track);
  };

  return (
    <Popover
      trigger={
        <button
          className="p-2 md:p-2.5 transition-colors group"
          title="Captions & Audio"
          onClick={() => setIsOpen(!isOpen)}
        >
          <HugeiconsIcon
            icon={ClosedCaptionIcon}
            size="md"
            className="text-white/70 group-hover:text-white transition-colors"
            strokeWidth={2}
          />
        </button>
      }
      content={
        <div className="w-[600px] flex">
          {/* Subtitles Column */}
          <div className="flex-1 border-r border-zinc-700">
            <div className="p-4 border-b border-zinc-700">
              <h3 className="text-white font-semibold text-base">Subtitles</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {/* Off Option */}
              <button
                onClick={() => {
                  handleCaptionSelect(null);
                }}
                className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center gap-4"
              >
                {!selectedCaption && (
                  <Check className="w-6 h-6 text-white flex-shrink-0" />
                )}
                {!selectedCaption || <div className="w-6 h-6 flex-shrink-0" />}
                <span className="text-white text-lg">Off</span>
              </button>

              {/* Caption List */}
              {captionList.map((caption) => (
                <button
                  key={caption.id}
                  onClick={() => handleCaptionSelect(caption)}
                  className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center gap-4"
                >
                  {selectedCaption?.id === caption.id && (
                    <Check className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                  {selectedCaption?.id !== caption.id && (
                    <div className="w-6 h-6 flex-shrink-0" />
                  )}
                  <span className="text-gray-300 text-lg">
                    {caption.language}
                    {caption.isHearingImpaired && " (CC)"}
                  </span>
                </button>
              ))}
            </div>

            {/* Subtitles Settings Link */}
            <div className="p-4 border-t border-zinc-700">
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                Subtitles Settings
              </button>
            </div>
          </div>

          {/* Audio Column */}
          <div className="flex-1">
            <div className="p-4 border-b border-zinc-700">
              <h3 className="text-white font-semibold text-base">Audio</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {audioTracks.length === 0 && (
                <div className="px-4 py-3 text-gray-400 text-base">
                  No audio tracks available
                </div>
              )}
              {audioTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleAudioSelect(track)}
                  className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center gap-4"
                >
                  {currentAudioTrack?.id === track.id && (
                    <Check className="w-6 h-6 text-white flex-shrink-0" />
                  )}
                  {currentAudioTrack?.id !== track.id && (
                    <div className="w-6 h-6 flex-shrink-0" />
                  )}
                  <span className="text-gray-300 text-lg">{track.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      position="bottom"
      align="center"
    />
  );
}
