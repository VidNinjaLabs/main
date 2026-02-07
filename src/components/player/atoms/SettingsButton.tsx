import { Settings02Icon } from "@hugeicons/react";
import { usePlayerStore } from "@/stores/player/store";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import classNames from "classnames";
import { LucideIcon } from "@/components/LucideIcon";

// Speed Button List Component
function SpeedButtonList(props: {
  options: number[];
  selected: number;
  onClick: (v: number) => void;
  disabled?: boolean;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState<string>("");
  const [isCustomSpeed, setIsCustomSpeed] = useState(false);

  useEffect(() => {
    if (!props.options.includes(props.selected)) {
      setIsCustomSpeed(true);
    } else {
      setIsCustomSpeed(false);
    }
  }, [props.selected, props.options]);

  const handleButtonClick = useCallback(
    (option: number, index: number) => {
      // Prevent Dropdown closing
      if (editingIndex === index) return;
      if (isCustomSpeed && option === props.selected) {
        setEditingIndex(0);
        setCustomValue(option.toString());
        return;
      }
      props.onClick(option);
      setIsCustomSpeed(false);
    },
    [editingIndex, props, isCustomSpeed],
  );

  const handleDoubleClick = useCallback(
    (option: number, index: number) => {
      if (props.disabled) return;
      setEditingIndex(index);
      setCustomValue(option.toString());
    },
    [props.disabled],
  );

  const handleCustomValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomValue(e.target.value);
    },
    [],
  );

  const handleCustomValueKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const value = parseFloat(customValue);
        if (!Number.isNaN(value) && value > 0 && value <= 5) {
          props.onClick(value);
          setEditingIndex(null);
          setIsCustomSpeed(true);
        }
      } else if (e.key === "Escape") {
        setEditingIndex(null);
      }
    },
    [customValue, props],
  );

  const handleInputBlur = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const handleResetCustomSpeed = useCallback(() => {
    setIsCustomSpeed(false);
    props.onClick(1);
  }, [props]);

  return (
    <div
      className="flex items-center bg-white/5 p-1 rounded-lg gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      {isCustomSpeed ? (
        <button
          type="button"
          disabled={props.disabled}
          className={classNames(
            "w-full px-2 py-1.5 rounded-md text-sm relative",
            "bg-white/20 text-white",
            props.disabled ? "opacity-50 cursor-not-allowed" : null,
          )}
          onClick={() => handleButtonClick(props.selected, 0)}
          onDoubleClick={() => handleDoubleClick(props.selected, 0)}
          key="custom"
        >
          {editingIndex === 0 ? (
            <input
              type="text"
              value={customValue}
              onChange={handleCustomValueChange}
              onKeyDown={handleCustomValueKeyDown}
              onBlur={handleInputBlur}
              className="w-full bg-transparent text-center focus:outline-none"
              autoFocus
              aria-label="Custom playback speed"
            />
          ) : (
            <>
              {`${props.selected}x`}
              <button
                type="button"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                onClick={handleResetCustomSpeed}
                title="Reset to presets"
              >
                <LucideIcon icon={X} className="w-3 h-3" />
              </button>
            </>
          )}
        </button>
      ) : (
        props.options.map((option, index) => {
          const isEditing = editingIndex === index;
          return (
            <button
              type="button"
              disabled={props.disabled}
              className={classNames(
                "flex-1 px-2 py-1.5 rounded-md text-xs relative transition-colors",
                props.selected === option
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10",
                props.disabled ? "opacity-50 cursor-not-allowed" : null,
              )}
              onClick={() => handleButtonClick(option, index)}
              onDoubleClick={() => handleDoubleClick(option, index)}
              key={option}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={customValue}
                  onChange={handleCustomValueChange}
                  onKeyDown={handleCustomValueKeyDown}
                  onBlur={handleInputBlur}
                  className="w-full bg-transparent text-center focus:outline-none"
                  autoFocus
                  aria-label="Custom playback speed"
                />
              ) : (
                `${option}x`
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

type ViewType = "main" | "playback";

export function SettingsButton({ icon: CustomIcon }: { icon?: any }) {
  const qualities = usePlayerStore((s) => s.qualities);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const switchQuality = usePlayerStore((s) => s.switchQuality);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const playbackRate = usePlayerStore((s) => s.mediaPlaying.playbackRate);
  const display = usePlayerStore((s) => s.display);

  const [view, setView] = useState<ViewType>("main");

  // Reset view when closed
  const handleOpenChange = (open: boolean) => {
    setHasOpenOverlay(open);
    if (!open) {
      setTimeout(() => setView("main"), 200);
    }
  };

  const setPlaybackRate = (rate: number) => {
    if (display) {
      display.setPlaybackRate(rate);
    }
  };

  // Map quality strings to display labels
  const getQualityLabel = (quality: string) => {
    if (quality === "unknown") return "Auto";
    return quality.toUpperCase();
  };

  const getQualityDescription = (quality: string) => {
    const descriptions: Record<string, string> = {
      "1080p": "Full HD",
      "720p": "HD",
      "480p": "SD",
      "360p": "Low",
      unknown: "Adjusts automatically",
    };
    return descriptions[quality] || "";
  };

  const speedOptions = [0.25, 0.5, 1, 1.5, 2];

  return (
    <DropdownMenu.Root onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 md:p-2 transition-colors group outline-none rounded-md focus-visible:ring-2 focus-visible:ring-white/20"
          title="Settings"
        >
          {CustomIcon ? (
            <CustomIcon
              className="w-5 h-5 md:w-[25px] md:h-[25px] text-white transition-colors"
              strokeWidth={2}
            />
          ) : (
            <Settings02Icon
              className="w-5 h-5 md:w-[25px] md:h-[25px] text-white transition-colors"
              strokeWidth={2}
            />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="center" sideOffset={10} className="w-64">
        <DropdownMenu.Arrow />
        {view === "main" && (
          <>
            <DropdownMenu.Group>
              {/* Quality Selection - Directly in main menu */}
              <DropdownMenu.Label>Quality</DropdownMenu.Label>
              <DropdownMenu.RadioGroup
                value={currentQuality || "unknown"}
                onValueChange={(val) => switchQuality(val as any)}
              >
                {qualities.map((quality) => (
                  <DropdownMenu.RadioItem
                    key={quality}
                    value={quality}
                    className="py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white font-medium text-sm leading-none">
                        {getQualityLabel(quality)}
                      </span>
                      <span className="text-white/50 text-xs">
                        {getQualityDescription(quality)}
                      </span>
                    </div>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>

              <DropdownMenu.Separator />

              {/* Playback Speed Link */}
              <DropdownMenu.Item
                className="flex items-center justify-between py-3 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setView("playback");
                }}
              >
                <span className="text-white font-medium text-sm">
                  Playback Speed
                </span>
                <div className="flex items-center gap-1 text-white/50 text-xs">
                  <span>
                    {playbackRate === 1 ? "Normal" : `${playbackRate}x`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </DropdownMenu.Item>
            </DropdownMenu.Group>
          </>
        )}

        {view === "playback" && (
          <>
            <div className="flex items-center px-2 py-2 mb-1 border-b border-white/10">
              <button
                onClick={() => setView("main")}
                className="p-1 -ml-1 hover:bg-white/10 rounded mr-2"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <span className="text-base text-white font-medium">
                Playback Speed
              </span>
            </div>

            <div className="p-2 pt-3">
              <div className="text-white/70 text-xs uppercase tracking-wider mb-3 px-1">
                Speed
              </div>
              <SpeedButtonList
                options={speedOptions}
                selected={playbackRate}
                onClick={setPlaybackRate}
              />
            </div>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
