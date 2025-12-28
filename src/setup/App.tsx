/* eslint-disable import/no-unresolved */
import { ReactElement, Suspense, useEffect, useState } from "react";
import { lazyWithPreload } from "react-lazy-with-preload";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { convertLegacyUrl, isLegacyUrl } from "@/backend/metadata/getmeta";
import { generateQuickSearchMediaUrl } from "@/backend/metadata/tmdb";
import { AdMaven } from "@/components/ads/AdMaven";
import { AdsterraAds, PopAds } from "@/components/ads/PropellerAds";
import { DetailsModal } from "@/components/overlays/detailsModal";
import { KeyboardCommandsModal } from "@/components/overlays/KeyboardCommandsModal";
import { NotificationModal } from "@/components/overlays/notificationsModal";
import { TurnstileGate } from "@/components/TurnstileGate";
import { useAuthContext } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/auth/useIsAdmin";
import { useIsPremium } from "@/hooks/auth/useIsPremium";
import { useGlobalKeyboardEvents } from "@/hooks/useGlobalKeyboardEvents";
import { useOnlineListener } from "@/hooks/usePing";
import { AboutPage } from "@/pages/About";
import { AdminPage } from "@/pages/admin/AdminPage";
import { AllBookmarks } from "@/pages/bookmarks/AllBookmarks";
import { BrowsePage } from "@/pages/Browse";
import { DiscoverMore } from "@/pages/discover/AllMovieLists";
import { Discover } from "@/pages/discover/Discover";
import { MoreContent } from "@/pages/discover/MoreContent";
import MaintenancePage from "@/pages/errors/MaintenancePage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";
import { ForgotPasswordPage } from "@/pages/ForgotPassword";
import { LegalPage, shouldHaveLegalPage } from "@/pages/Legal";
import { LoginPage } from "@/pages/Login";
import { ResetPasswordPage } from "@/pages/ResetPassword";
import { SignupPage } from "@/pages/Signup";
import {
  StandaloneMoviePlayer,
  StandaloneTVPlayer,
} from "@/pages/StandalonePlayers";
import { SupportPage } from "@/pages/Support";
import { Layout } from "@/setup/Layout";
import { useHistoryListener } from "@/stores/history";
import { useClearModalsOnNavigation } from "@/stores/interface/overlayStack";
import { LanguageProvider } from "@/stores/language";

const PlayerView = lazyWithPreload(() => import("@/pages/PlayerView"));
const SettingsPage = lazyWithPreload(() => import("@/pages/Settings"));

PlayerView.preload();
SettingsPage.preload();

function LegacyUrlView({ children }: { children: ReactElement }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const url = location.pathname;
    if (!isLegacyUrl(url)) return;
    convertLegacyUrl(location.pathname).then((convertedUrl) => {
      navigate(convertedUrl ?? "/", { replace: true });
    });
  }, [location.pathname, navigate]);

  if (isLegacyUrl(location.pathname)) return null;
  return children;
}

function QuickSearch() {
  const { query } = useParams<{ query: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (query) {
      generateQuickSearchMediaUrl(query).then((url) => {
        navigate(url ?? "/", { replace: true });
      });
    } else {
      navigate("/", { replace: true });
    }
  }, [query, navigate]);

  return null;
}

function QueryView() {
  const { query } = useParams<{ query: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (query) {
      navigate(`/browse/${encodeURIComponent(query)}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [query, navigate]);

  return null;
}

export const maintenanceTime = "March 31th 11:00 PM - 5:00 AM EST";

function App() {
  useHistoryListener();
  useOnlineListener();
  useGlobalKeyboardEvents();
  useClearModalsOnNavigation();
  const maintenance = false; // Shows maintance page
  const [showDowntime, setShowDowntime] = useState(maintenance);

  const isAdmin = useIsAdmin();
  const isPremium = useIsPremium();
  const { loading } = useAuthContext();

  // Wait for auth to finish loading before showing ads
  const showAds = import.meta.env.PROD && !loading && !isAdmin && !isPremium;

  // Debug logging
  console.log("[Ad Display Debug]", {
    isProduction: import.meta.env.PROD,
    loading,
    isAdmin,
    isPremium,
    showAds,
  });

  const handleButtonClick = () => {
    setShowDowntime(false);
  };

  useEffect(() => {
    const sessionToken = sessionStorage.getItem("downtimeToken");
    if (!sessionToken && maintenance) {
      setShowDowntime(true);
      sessionStorage.setItem("downtimeToken", "true");
    }
  }, [setShowDowntime, maintenance]);

  return (
    <TurnstileGate>
      {/* Loading Screen - Show while authentication is loading */}
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      )}

      {/* Ads - Only show in production, when not loading, and user is not admin/premium */}
      {showAds && (
        <>
          <PopAds />
          <AdsterraAds />
          <AdMaven />
        </>
      )}

      {/* Main App - Hidden while loading */}
      <Layout>
        <LanguageProvider />
        <NotificationModal id="notifications" />
        <KeyboardCommandsModal id="keyboard-commands" />
        <DetailsModal id="details" />
        <DetailsModal id="discover-details" />
        <DetailsModal id="player-details" />
        {!showDowntime && (
          <Routes>
            {/* functional routes */}
            <Route path="/s/:query" element={<QuickSearch />} />
            <Route path="/search/:type" element={<Navigate to="/browse" />} />
            <Route path="/search/:type/:query?" element={<QueryView />} />

            {/* Standalone player routes for embedding */}
            <Route path="/movie/:tmdbId" element={<StandaloneMoviePlayer />} />
            <Route
              path="/tv/:tmdbId/:season/:episode"
              element={<StandaloneTVPlayer />}
            />

            {/* pages */}
            <Route path="/" element={<Navigate to="/discover" replace />} />
            <Route
              path="/media/:media"
              element={
                <LegacyUrlView>
                  <Suspense fallback={null}>
                    <PlayerView />
                  </Suspense>
                </LegacyUrlView>
              }
            />
            <Route
              path="/media/:media/:season/:episode"
              element={
                <LegacyUrlView>
                  <Suspense fallback={null}>
                    <PlayerView />
                  </Suspense>
                </LegacyUrlView>
              }
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/about" element={<AboutPage />} />

            {shouldHaveLegalPage() ? (
              <Route path="/legal" element={<LegalPage />} />
            ) : null}
            {/* Support page */}
            <Route path="/support" element={<SupportPage />} />
            {/* Browse/Search pages */}
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/browse/:query" element={<BrowsePage />} />
            {/* Discover pages */}
            <Route path="/discover" element={<Discover />} />
            <Route
              path="/discover/more/:contentType/:mediaType"
              element={<MoreContent />}
            />
            <Route
              path="/discover/more/:contentType/:id/:mediaType"
              element={<MoreContent />}
            />
            <Route path="/discover/more/:category" element={<MoreContent />} />
            <Route path="/discover/all" element={<DiscoverMore />} />
            {/* Bookmarks page */}
            <Route path="/bookmarks" element={<AllBookmarks />} />
            {/* Settings page */}
            <Route
              path="/settings"
              element={
                <Suspense fallback={null}>
                  <SettingsPage />
                </Suspense>
              }
            />
            {/* admin routes */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        )}
        {showDowntime && (
          <MaintenancePage onHomeButtonClick={handleButtonClick} />
        )}
      </Layout>
    </TurnstileGate>
  );
}

export default App;
