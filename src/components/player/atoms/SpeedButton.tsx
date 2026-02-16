import { Gauge } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useState, useCallback, useEffect } from "react";
import classNames from "classnames";
import { LucideIcon } from "@/components/LucideIcon";
import { X } from "lucide-react";

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

export function SpeedButton() {
  const playbackRate = usePlayerStore((s) => s.mediaPlaying.playbackRate);
  const display = usePlayerStore((s) => s.display);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setHasOpenOverlay(open);
  };

  const setPlaybackRate = (rate: number) => {
    if (display) {
      display.setPlaybackRate(rate);
    }
  };

  const speedOptions = [0.25, 0.5, 1, 1.5, 2];

  return (
    <DropdownMenu.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 md:p-2 transition-colors group outline-none rounded-md focus-visible:ring-2 focus-visible:ring-white/20"
          title="Playback Speed"
        >
          <Gauge className="w-8 h-8 lg:w-10 lg:h-10 text-white transition-colors" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="center" sideOffset={10} className="w-64 p-3">
        <DropdownMenu.Arrow />
        <div className="text-white/70 text-xs uppercase tracking-wider mb-3 px-1">
          Speed
        </div>
        <SpeedButtonList
          options={speedOptions}
          selected={playbackRate}
          onClick={setPlaybackRate}
        />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
