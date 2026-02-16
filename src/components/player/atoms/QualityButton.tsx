import { Settings2 } from "lucide-react";
import { usePlayerStore } from "@/stores/player/store";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useState } from "react";

export function QualityButton() {
  const qualities = usePlayerStore((s) => s.qualities);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const switchQuality = usePlayerStore((s) => s.switchQuality);
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setHasOpenOverlay(open);
  };

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

  if (qualities.length === 0) return null;

  return (
    <DropdownMenu.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 md:p-2 transition-colors group outline-none rounded-md focus-visible:ring-2 focus-visible:ring-white/20"
          title="Quality"
        >
          <Settings2 className="w-8 h-8 lg:w-10 lg:h-10 text-white transition-colors" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="center" sideOffset={10} className="w-48">
        <DropdownMenu.Arrow />
        <DropdownMenu.Label>Quality</DropdownMenu.Label>
        <DropdownMenu.RadioGroup
          value={currentQuality || "unknown"}
          onValueChange={(val) => switchQuality(val as any)}
        >
          {qualities.map((quality) => (
            <DropdownMenu.RadioItem
              key={quality}
              value={quality}
              className="py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-white font-medium text-sm leading-none">
                  {getQualityLabel(quality)}
                </span>
                {getQualityDescription(quality) && (
                  <span className="text-white/50 text-[10px]">
                    {getQualityDescription(quality)}
                  </span>
                )}
              </div>
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
