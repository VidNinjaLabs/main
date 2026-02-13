import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { useDiscoverStore } from "@/stores/discover";

export function DiscoverNavigation() {
  const { t } = useTranslation();
  const { selectedCategory, setSelectedCategory } = useDiscoverStore();

  const tabs = [
    { id: "movies", label: "discover.tabs.movies" },
    { id: "tvshows", label: "discover.tabs.tvshows" },
  ];

  return (
    <div className="pb-6 pt-2 w-full flex justify-center items-center z-40 relative">
      <div className="flex p-1 space-x-1 bg-white/10 backdrop-blur-md rounded-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as "movies" | "tvshows")}
            className={classNames(
              "px-6 py-2 rounded-full text-sm md:text-base font-semibold transition-all duration-300",
              selectedCategory === tab.id
                ? "bg-white text-black shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10",
            )}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
