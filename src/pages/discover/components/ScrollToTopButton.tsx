import { ChevronUp, Heart, Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Icon, Icons } from "@/components/Icon";
import { conf } from "@/setup/config";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleVisibility = () => {
    const scrolled = window.scrollY > 300;
    setIsVisible(scrolled);
  };

  useEffect(() => {
    const handleScroll = () => {
      const timeout = setTimeout(toggleVisibility, 100);
      return () => clearTimeout(timeout);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".floating-menu-container")) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);

  const menuItems = [
    {
      href: "https://rentry.co/h5mypdfs",
      icon: <Heart className="w-5 h-5 text-pink-400" />,
      label: "Support Us",
    },
    {
      href: conf().DISCORD_LINK,
      icon: <Icon icon={Icons.DISCORD} className="w-5 h-5 text-indigo-400" />,
      label: "Discord",
    },
    {
      href: conf().GITHUB_LINK,
      icon: <Icon icon={Icons.GITHUB} className="w-5 h-5 text-white" />,
      label: "GitHub",
      hidden: !conf().GITHUB_LINK,
    },
  ];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 transition-opacity duration-300 floating-menu-container ${
        isVisible ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      {/* Expandable menu items */}
      <div
        className={`flex items-center gap-2 transition-all duration-300 ${
          isMenuOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-4 pointer-events-none"
        }`}
      >
        {menuItems
          .filter((item) => !item.hidden)
          .map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="backdrop-blur-sm flex items-center justify-center rounded-full p-3 bg-pill-background bg-opacity-80 hover:bg-pill-backgroundHover transition-all hover:scale-110 duration-300"
              aria-label={item.label}
              title={item.label}
            >
              {item.icon}
            </a>
          ))}
      </div>

      {/* More button - toggle menu */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`backdrop-blur-sm flex items-center justify-center rounded-full p-3 text-white bg-pill-background bg-opacity-80 hover:bg-pill-backgroundHover transition-all hover:scale-110 duration-300 ${
          isMenuOpen ? "rotate-90" : ""
        }`}
        aria-label="More options"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Scroll to top button */}
      <button
        type="button"
        onClick={scrollToTop}
        className="backdrop-blur-sm flex items-center justify-center rounded-full p-4 text-white bg-pill-background bg-opacity-80 hover:bg-pill-backgroundHover transition-all hover:scale-110 duration-300"
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}
