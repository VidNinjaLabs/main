import { Search } from "lucide-react";

import { LucideIcon } from "@/components/LucideIcon";

export function Input(props: {
  value: string;
  onInput: (str: string) => void;
}) {
  return (
    <div className="w-full relative border border-gray-800 rounded-md">
      <LucideIcon
        icon={Search}
        className="pointer-events-none absolute top-1/2 left-3 transform -translate-y-1/2 text-video-context-inputPlaceholder text-lg"
      />
      <input
        placeholder="Search"
        className="w-full py-2 px-3 pl-10 tabbable bg-video-context-inputBg rounded placeholder:text-video-context-inputPlaceholder"
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
      />
    </div>
  );
}
