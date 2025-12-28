/// <reference types="chromecast-caf-sender" />

const CHROMECAST_SENDER_SDK =
  "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

const callbacks: ((available: boolean) => void)[] = [];
let _available: boolean | null = null;
let _initialized = false;

function init(available: boolean) {
  _available = available;
  callbacks.forEach((cb) => cb(available));
  callbacks.length = 0;
}

export function isChromecastAvailable(cb: (available: boolean) => void) {
  if (_available !== null) {
    setTimeout(() => cb(_available!), 0);
    return;
  }
  callbacks.push(cb);
}

export function initializeChromecast() {
  if (_initialized) return;
  _initialized = true;

  if (!(window as any).__onGCastApiAvailable) {
    (window as any).__onGCastApiAvailable = (isAvailable: boolean) => {
      try {
        if (isAvailable && (window as any).cast?.framework) {
          const castFramework = (window as any).cast.framework;

          // Check if CastContext and required properties exist
          if (!castFramework.CastContext) {
            console.warn("Chromecast CastContext not available");
            init(false);
            return;
          }

          const context = castFramework.CastContext.getInstance();

          // Build options with defensive checks
          const options: any = {};

          // Set receiver application ID if available
          if (
            (window as any).chrome?.cast?.media?.DEFAULT_MEDIA_RECEIVER_APP_ID
          ) {
            options.receiverApplicationId = (
              window as any
            ).chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
          }

          // Set auto join policy if available
          if (castFramework.AutoJoinPolicy?.ORIGIN_SCOPED !== undefined) {
            options.autoJoinPolicy = castFramework.AutoJoinPolicy.ORIGIN_SCOPED;
          }

          context.setOptions(options);
          init(true);
        } else {
          init(false);
        }
      } catch (e) {
        console.warn("Chromecast initialization error:", e);
        init(false);
      }
    };
  }

  if (!document.getElementById("chromecast-script")) {
    const script = document.createElement("script");
    script.src = CHROMECAST_SENDER_SDK;
    script.id = "chromecast-script";
    script.onerror = () => console.warn("Failed to load Chromecast SDK");
    document.body.appendChild(script);
  }
}
