import { Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

import { VideoPlayerButton } from "@/components/player/internals/Button";

export function Widescreen(props: { iconSizeClass?: string }) {
  // Add widescreen status
  const [isWideScreen, setIsWideScreen] = useState(false);

  return (
    <VideoPlayerButton
      icon={isWideScreen ? Minimize2 : Maximize2}
      iconSizeClass={props.iconSizeClass}
      className="text-white"
      onClick={() => {
        const videoElement = document.getElementById("video-element");
        if (videoElement) {
          videoElement.classList.toggle("object-cover");
          setIsWideScreen(!isWideScreen);
        }
      }}
    />
  );
}
