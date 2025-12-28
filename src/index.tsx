import "core-js/stable";
import "./stores/__old/imports";
import "@/assets/css/index.css";

import { CircleAlert } from "lucide-react";
import { Suspense, useCallback } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { useAsyncFn } from "react-use";

import { Button } from "@/components/buttons/Button";
import { Loading } from "@/components/layout/Loading";
import { LucideIcon } from "@/components/LucideIcon";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAuthRestore } from "@/hooks/auth/useAuthRestore";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { LargeTextPart } from "@/pages/parts/util/LargeTextPart";
import App from "@/setup/App";
import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";
import { BookmarkSyncer } from "@/stores/bookmarks/BookmarkSyncer";
import { GroupSyncer } from "@/stores/groupOrder/GroupSyncer";
import { ProgressSyncer } from "@/stores/progress/ProgressSyncer";
import { SettingsSyncer } from "@/stores/subtitles/SettingsSyncer";
import { ThemeProvider } from "@/stores/theme";
import { useTranslation } from "react-i18next";

import { initializeFebbox, initializeVidNinja } from "./backend/api/init";
import { ErrorBoundary } from "./pages/errors/ErrorBoundary";
import { initializeChromecast } from "./setup/chromecast";
import { initializeImageFadeIn } from "./setup/imageFadeIn";

// initialize
initializeChromecast();
initializeImageFadeIn();
initializeVidNinja();
initializeFebbox();

function LoadingScreen(props: { type: "user" | "lazy" }) {
  const mapping = {
    user: "screens.loadingUser",
    lazy: "screens.loadingApp",
  };
  const { t } = useTranslation();
  return (
    <LargeTextPart iconSlot={<Loading />}>
      {t(mapping[props.type] ?? "unknown.translation")}
    </LargeTextPart>
  );
}

function ErrorScreen(props: {
  children: ReactNode;
  showResetButton?: boolean;
  showLogoutButton?: boolean;
  showReloadButton?: boolean;
}) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const setBackendUrl = useAuthStore((s) => s.setBackendUrl);
  const resetBackend = useCallback(() => {
    setBackendUrl(null);
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  }, [setBackendUrl]);
  const logoutFromBackend = useCallback(() => {
    logout().then(() => {
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    });
  }, [logout]);

  return (
    <LargeTextPart
      iconSlot={
        <LucideIcon className="text-type-danger text-2xl" icon={CircleAlert} />
      }
    >
      {props.children}
      {props.showResetButton ? (
        <div className="mt-6">
          <Button theme="secondary" onClick={resetBackend}>
            {t("screens.loadingUserError.reset")}
          </Button>
        </div>
      ) : null}
      {props.showLogoutButton ? (
        <div className="mt-6">
          <Button theme="secondary" onClick={logoutFromBackend}>
            {t("screens.loadingUserError.logout")}
          </Button>
        </div>
      ) : null}
      {props.showReloadButton ? (
        <div className="mt-6">
          <Button theme="secondary" onClick={() => window.location.reload()}>
            {t("screens.loadingUserError.reload")}
          </Button>
        </div>
      ) : null}
    </LargeTextPart>
  );
}

function AuthWrapper() {
  const status = useAuthRestore();
  const backendUrl = conf().BACKEND_URL;
  const userBackendUrl = useBackendUrl();
  const { t } = useTranslation();

  const isCustomUrl = backendUrl !== userBackendUrl;

  if (status.loading) return <LoadingScreen type="user" />;
  if (status.error)
    return (
      <ErrorScreen
        showResetButton={isCustomUrl}
        showLogoutButton={!isCustomUrl}
        showReloadButton={!isCustomUrl}
      >
        {t(
          isCustomUrl
            ? "screens.loadingUserError.textWithReset"
            : "screens.loadingUserError.text",
        )}
      </ErrorScreen>
    );
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

function TheRouter(props: { children: ReactNode }) {
  const normalRouter = conf().NORMAL_ROUTER;

  if (normalRouter) return <BrowserRouter>{props.children}</BrowserRouter>;
  return <HashRouter>{props.children}</HashRouter>;
}

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <ErrorBoundary>
    <HelmetProvider>
      <Suspense fallback={<LoadingScreen type="lazy" />}>
        <ThemeProvider applyGlobal>
          <ProgressSyncer />
          <BookmarkSyncer />
          <GroupSyncer />
          <SettingsSyncer />
          <TheRouter>
            <AuthWrapper />
          </TheRouter>
        </ThemeProvider>
      </Suspense>
    </HelmetProvider>
  </ErrorBoundary>,
);
