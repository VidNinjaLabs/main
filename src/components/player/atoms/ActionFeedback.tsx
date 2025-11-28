import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Transition } from "@/components/utils/Transition";

type FeedbackAction = "play" | "pause" | "forward" | "backward" | null;

interface ActionFeedbackProps {
  action: FeedbackAction;
  onComplete?: () => void;
}

export function ActionFeedback({ action, onComplete }: ActionFeedbackProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (action) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [action, onComplete]);

  if (!action) return null;

  const getIcon = () => {
    switch (action) {
      case "play":
        return <Play size={80} fill="white" strokeWidth={0} />;
      case "pause":
        return <Pause size={80} fill="white" strokeWidth={0} />;
      case "forward":
        return (
          <div className="flex flex-col items-center">
            <RotateCw size={60} strokeWidth={2.5} />
            <span className="text-2xl font-bold mt-1">10</span>
          </div>
        );
      case "backward":
        return (
          <div className="flex flex-col items-center">
            <RotateCcw size={60} strokeWidth={2.5} />
            <span className="text-2xl font-bold mt-1">10</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getPosition = () => {
    switch (action) {
      case "forward":
        return "right-[20%]";
      case "backward":
        return "left-[20%]";
      default:
        return "left-1/2 -translate-x-1/2";
    }
  };

  return (
    <Transition
      animation="fade"
      show={show}
      className="pointer-events-none absolute inset-0 z-50"
    >
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${getPosition()} bg-black/60 backdrop-blur-sm rounded-full p-6 text-white`}
      >
        {getIcon()}
      </div>
    </Transition>
  );
}
