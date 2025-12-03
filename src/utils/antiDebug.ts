/**
 * Anti-debugging utility to detect DevTools and protect video player
 * This module detects when developer tools are opened and pauses playback
 */

type AntiDebugCallback = (isOpen: boolean) => void;

class AntiDebug {
  private isDevToolsOpen = false;

  private checkInterval: NodeJS.Timeout | null = null;

  private callbacks: AntiDebugCallback[] = [];

  private threshold = 160; // Threshold for detecting DevTools

  private resizeHandler: (() => void) | null = null;

  /**
   * Start monitoring for DevTools
   */
  start(callback?: AntiDebugCallback) {
    if (callback) {
      this.callbacks.push(callback);
    }

    // Simple and reliable: Check window size difference
    const checkDevTools = () => {
      const widthThreshold =
        window.outerWidth - window.innerWidth > this.threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > this.threshold;

      const devToolsDetected = widthThreshold || heightThreshold;

      if (devToolsDetected !== this.isDevToolsOpen) {
        this.isDevToolsOpen = devToolsDetected;
        this.triggerCallbacks(devToolsDetected);
      }
    };

    // Check immediately on start
    checkDevTools();

    // Run checks periodically (every 1 second)
    this.checkInterval = setInterval(() => {
      checkDevTools();
    }, 1000);

    // Also check on resize events for faster detection
    this.resizeHandler = checkDevTools;
    window.addEventListener("resize", this.resizeHandler);

    // Prevent right-click context menu
    document.addEventListener("contextmenu", this.preventContextMenu);

    // Prevent common DevTools shortcuts
    document.addEventListener("keydown", this.preventDevToolsShortcuts);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }

    document.removeEventListener("contextmenu", this.preventContextMenu);
    document.removeEventListener("keydown", this.preventDevToolsShortcuts);

    this.callbacks = [];
    this.isDevToolsOpen = false;
  }

  /**
   * Prevent context menu
   */
  // eslint-disable-next-line class-methods-use-this
  private preventContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };

  /**
   * Prevent DevTools keyboard shortcuts
   */
  // eslint-disable-next-line class-methods-use-this
  private preventDevToolsShortcuts = (e: KeyboardEvent) => {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      return false;
    }
    return true;
  };

  /**
   * Add a callback to be triggered when DevTools state changes
   */
  onDetected(callback: AntiDebugCallback) {
    this.callbacks.push(callback);
  }

  /**
   * Trigger all registered callbacks
   */
  private triggerCallbacks(isOpen: boolean) {
    this.callbacks.forEach((callback) => {
      try {
        callback(isOpen);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error in anti-debug callback:", error);
      }
    });
  }

  /**
   * Check if DevTools is currently open
   */
  isOpen(): boolean {
    return this.isDevToolsOpen;
  }
}

// Export singleton instance
export const antiDebug = new AntiDebug();
