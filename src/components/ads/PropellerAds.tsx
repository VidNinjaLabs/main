import { useEffect, useState } from "react";

import { useIsAdmin } from "@/hooks/auth/useIsAdmin";
import { useIsPremium } from "@/hooks/auth/useIsPremium";

/**
 * Ad component for PopAds scripts
 */
export function PopAds() {
  const isPremium = useIsPremium();
  const isAdmin = useIsAdmin();
  useEffect(() => {
    if (isPremium || isAdmin) return;
    // Inject the ad script
    try {
      /* eslint-disable */
      (function () {
        const w = window as any;
        const p = "d4430464c8b1fa33b23096b133489163";
        const n = [
          ["siteId", 340 - 835 + 294 + 5259222],
          ["minBid", 0],
          ["popundersPerIP", "0"],
          ["delayBetween", 0],
          ["default", false],
          ["defaultPerDay", 10], // Increased from 0 to 10
          ["topmostLayer", false],
        ];
        const s = [
          "d3d3LmRpc3BsYXl2ZXJ0aXNpbmcuY29tL3RwbGF5bHlmZS1qcy1zZGsubWluLmNzcw==",
          "ZDNtem9rdHk5NTFjNXcuY2xvdWRmcm9udC5uZXQvT0VqTy90c2FtbXkubWluLmpz",
          "d3d3LnpkY3B2aG9kbS5jb20vZXBsYXlseWZlLWpzLXNkay5taW4uY3Nz",
          "d3d3Lmxqbnpxd2Z1anp2ay5jb20vVS9sc2FtbXkubWluLmpz",
        ];
        let j = -1;
        let c: HTMLScriptElement;
        let r: NodeJS.Timeout;

        const q = function () {
          clearTimeout(r);
          j++;
          if (s[j] && !(new Date().getTime() > 1790887377000 && j > 1)) {
            c = w.document.createElement("script");
            c.type = "text/javascript";
            c.async = true;
            const u = w.document.getElementsByTagName("script")[0];
            c.src = `https://${atob(s[j])}`;
            c.crossOrigin = "anonymous";
            c.onerror = q;
            c.onload = function () {
              clearTimeout(r);
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              if (!w[p.slice(0, 16) + p.slice(0, 16)]) {
                q();
              }
            };
            r = setTimeout(q, 5000);
            if (u && u.parentNode) {
              u.parentNode.insertBefore(c, u);
            }
          }
        };
        if (!w[p]) {
          try {
            Object.freeze((w[p] = n));
          } catch (e) {
            console.error(e);
          }
          q();
        }

        // Cleanup function to remove the script when component unmounts
        return () => {
          clearTimeout(r);
          if (c && c.parentNode) {
            c.parentNode.removeChild(c);
          }
        };
      })();
      /* eslint-enable */
    } catch (err) {
      console.error("Ad script error:", err);
    }
  }, [isPremium, isAdmin]);

  return null;
}

/**
 * Ad component for Adsterra Direct Links with custom overlay
 */
export function AdsterraAds() {
  const [showOverlay, setShowOverlay] = useState(false);
  const isPremium = useIsPremium();
  const isAdmin = useIsAdmin();

  // Adsterra Direct Links
  const links = [
    "https://eventabsorbedrichard.com/cd3ase90?key=fb127ad392630b4c9324b826fdfcf4b0", // smark link / direct-link-2566853
    "https://eventabsorbedrichard.com/vtx2rzmcq?key=d28afa6bfe284f0fcc8bce0de6d31c80", // vidninja.pro ad tags Smartlink_1
  ];

  useEffect(() => {
    if (isPremium || isAdmin) return;
    if (!showOverlay) {
      // Random interval between 5s and 10s (Faster for testing)
      const time = Math.random() * (10000 - 5000) + 5000;
      const timer = setTimeout(() => {
        console.log("Adsterra Overlay Activated!"); // Debug log
        setShowOverlay(true);
      }, time);

      return () => clearTimeout(timer);
    }
  }, [showOverlay, isPremium, isAdmin]);

  const handleInteraction = () => {
    // Pick a random link
    const link = links[Math.floor(Math.random() * links.length)];
    window.open(link, "_blank");
    setShowOverlay(false);
  };

  if (!showOverlay) return null;

  return (
    <div
      onClick={handleInteraction}
      onMouseDown={handleInteraction}
      role="presentation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2147483647, // Max z-index
        opacity: 0,
        cursor: "default",
      }}
    />
  );
}
