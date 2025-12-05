/* eslint-disable react/jsx-no-useless-fragment */
import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect, useState } from "react";

import { conf } from "@/utils/setup/config";

interface TurnstileGateProps {
  children: React.ReactNode;
}

export function TurnstileGate({ children }: TurnstileGateProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hostname, setHostname] = useState("CloudClash");
  const siteKey = conf().TURNSTILE_KEY;
  const isDevelopment = process.env.NODE_ENV === "development";

  // Check if already verified (from sessionStorage)
  useEffect(() => {
    // Get hostname safely
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }

    // Skip in development mode
    if (isDevelopment) {
      setIsVerified(true);
      setIsLoading(false);
      return;
    }

    const verified = sessionStorage.getItem("turnstile_verified");
    if (verified === "true") {
      setIsVerified(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [isDevelopment]);

  // If no Turnstile key configured or in dev mode, just show content
  if (!siteKey || isDevelopment) {
    return <>{children}</>;
  }

  // If already verified, show content
  if (isVerified) {
    return <>{children}</>;
  }

  // Show Cloudflare WAF-style checking page
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-8 max-w-2xl px-8">
        {/* Domain/Title */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            {hostname}
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            Checking if the site connection is secure
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-700 rounded-full animate-spin" />

        {/* Description */}
        <div className="text-center max-w-xl">
          <p className="text-gray-600 text-base">
            {hostname} needs to review the security of your connection before
            proceeding.
          </p>
        </div>

        {/* Invisible Turnstile Widget */}
        {!isLoading && (
          <div className="absolute opacity-0 pointer-events-none">
            <Turnstile
              siteKey={siteKey}
              onSuccess={(token) => {
                if (token) {
                  // Store verification in session
                  sessionStorage.setItem("turnstile_verified", "true");
                  setIsVerified(true);
                }
              }}
              onError={() => {
                // Show error or retry
                console.error("Turnstile verification failed");
                // Optional: Add retry logic here
              }}
              options={{
                theme: "light",
                size: "invisible",
                execution: "execute",
              }}
            />
          </div>
        )}

        {/* Cloudflare branding (optional) */}
        <div className="text-sm text-gray-400 text-center border-t border-gray-200 pt-6 w-full">
          <p>
            Did you know bots historically made up nearly 40% of all internet
            traffic?
          </p>
          <p className="mt-2 text-xs">
            Performance & security by{" "}
            <span className="font-semibold">Cloudflare</span>
          </p>
        </div>
      </div>
    </div>
  );
}
