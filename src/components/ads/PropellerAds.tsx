import { useEffect } from "react";

import { conf } from "@/utils/setup/config";

/**
 * PopAds integration component
 * Handles pop-under ads on user clicks
 */
export function PopAds() {
  const apiKey = conf().POPADS_API_KEY;

  useEffect(() => {
    // Skip if no API key configured or in development
    if (!apiKey || process.env.NODE_ENV === "development") {
      return;
    }

    // Check if script already loaded
    if (document.querySelector(`script[src*="popads.net"]`)) {
      return;
    }

    // Load PopAds script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `//www.popads.net/pop.js`;
    script.setAttribute("data-admpid", apiKey);

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src*="popads.net"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [apiKey]);

  // This is an invisible component
  return null;
}

