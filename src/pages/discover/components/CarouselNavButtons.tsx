import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Flare } from "@/components/utils/Flare";

interface CarouselNavButtonsProps {
  categorySlug: string;
  carouselRefs: React.MutableRefObject<{
    [key: string]: HTMLDivElement | null;
  }>;
}

interface NavButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  visible?: boolean;
}

function NavButton({ direction, onClick, visible = true }: NavButtonProps) {
  return (
    <button
      type="button"
      className={`absolute ${direction === "left" ? "left-12" : "right-12"} top-1/2 transform -translate-y-3/4 z-10 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClick}
    >
      <Flare.Base className="group -m-[0.705em] rounded-full bg-search-hoverBackground transition-transform duration-300 focus:relative focus:z-10 hover:bg-mediaCard-hoverBackground tabbable hover:scale-110">
        <Flare.Light
          flareSize={90}
          cssColorVar="--colors-mediaCard-hoverAccent"
          backgroundClass="bg-mediaCard-hoverBackground duration-100"
          className="rounded-full group-hover:opacity-100 z-20"
        />
        <Flare.Child className="cursor-pointer text-white flex justify-center items-center h-10 w-10 rounded-full active:scale-110 transition-[transform,background-color] duration-200 z-30">
          {direction === "left" ? (
            <ChevronLeft className="text-white" />
          ) : (
            <ChevronRight className="text-white" />
          )}
        </Flare.Child>
      </Flare.Base>
    </button>
  );
}

export function CarouselNavButtons({
  categorySlug,
  carouselRefs,
}: CarouselNavButtonsProps) {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  useEffect(() => {
    const carousel = carouselRefs.current[categorySlug];
    if (!carousel) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = carousel;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 10); // buffer
    };

    carousel.addEventListener("scroll", checkScroll);
    // Initial check
    checkScroll();
    
    // Check after a delay to ensure content is loaded
    setTimeout(checkScroll, 500);

    return () => {
      carousel.removeEventListener("scroll", checkScroll);
    };
  }, [categorySlug, carouselRefs]);

  const handleScroll = (direction: "left" | "right") => {
    const carousel = carouselRefs.current[categorySlug];
    if (!carousel) return;

    const movieElements = carousel.getElementsByTagName("block");
    // Fallback if no block elements, try div with specific class or just calculate based on known width
    // Just use a simpler scroll amount if needed, but keeping existing logic if possible.
    // The previous logic looked for 'a' tags, but we might be using divs now.
    // Let's stick to a safe scroll amount relative to screen if elements aren't found.
    const scrollAmount = carousel.clientWidth * 0.75;
    
    // Original logic tried to find 'a' tags, let's keep it robust
    const newScrollPosition =
        carousel.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);

      carousel.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
  };

  return (
    <>
      <NavButton direction="left" onClick={() => handleScroll("left")} visible={showLeft} />
      <NavButton direction="right" onClick={() => handleScroll("right")} visible={showRight} />
    </>
  );
}
