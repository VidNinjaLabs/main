/* eslint-disable react/no-unused-prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useAsyncFn } from "react-use";

import {
  base64ToBuffer,
  decryptData,
  encryptData,
} from "@/backend/accounts/crypto";
import { getSessions, updateSession } from "@/backend/accounts/sessions";
import { getSettings, updateSettings } from "@/backend/accounts/settings";
import { editUser } from "@/backend/accounts/user";
import { getAllProviders } from "@/backend/providers/providers";
import { Button } from "@/components/buttons/Button";
import { SolidSettingsCard } from "@/components/layout/SettingsCard";
import { UserIcons } from "@/components/UserIcon";
import { Divider } from "@/components/utils/Divider";
import { Heading1 } from "@/components/utils/Text";
import { Transition } from "@/components/utils/Transition";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { useSettingsState } from "@/hooks/useSettingsState";
import { AccountActionsPart } from "@/pages/parts/settings/AccountActionsPart";
import { AccountEditPart } from "@/pages/parts/settings/AccountEditPart";
import { AppearancePart } from "@/pages/parts/settings/AppearancePart";
import { CaptionsPart } from "@/pages/parts/settings/CaptionsPart";
import { ConnectionsPart } from "@/pages/parts/settings/ConnectionsPart";
import { DeviceListPart } from "@/pages/parts/settings/DeviceListPart";
import { PreferencesPart } from "@/pages/parts/settings/PreferencesPart";
import { ProvidersPart } from "@/pages/parts/settings/ProvidersPart";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import { SettingsHeader } from "@/pages/settings/layout/SettingsHeader";
import { SettingsSidebar } from "@/pages/settings/layout/SettingsSidebar";
import { AccountWithToken, useAuthStore } from "@/stores/auth";
import { useLanguageStore } from "@/stores/language";
import { usePreferencesStore } from "@/stores/preferences";
import { useSubtitleStore } from "@/stores/subtitles";
import { usePreviewThemeStore, useThemeStore } from "@/stores/theme";
import { scrollToHash } from "@/utils/scroll";

function SettingsLayout(props: {
  className?: string;
  children: React.ReactNode;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}) {
  const { className } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route/hash changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on mobile, static on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto">
          <SettingsSidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header - Sticky */}
        <SettingsHeader onMobileMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            <div className={className}>{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccountSettings(props: {
  account: AccountWithToken;
  deviceName: string;
  setDeviceName: (s: string) => void;
  nickname: string;
  setNickname: (s: string) => void;
  colorA: string;
  setColorA: (s: string) => void;
  colorB: string;
  setColorB: (s: string) => void;
  userIcon: UserIcons;
  setUserIcon: (s: UserIcons) => void;
}) {
  const url = useBackendUrl();
  const { account } = props;
  const [sessionsResult, execSessions] = useAsyncFn(() => {
    if (!url) return Promise.resolve([]);
    return getSessions(url, account);
  }, [account, url]);
  useEffect(() => {
    execSessions();
  }, [execSessions]);

  return (
    <>
      <AccountEditPart
        deviceName={props.deviceName}
        setDeviceName={props.setDeviceName}
        nickname={props.nickname}
        setNickname={props.setNickname}
        colorA={props.colorA}
        setColorA={props.setColorA}
        colorB={props.colorB}
        setColorB={props.setColorB}
        userIcon={props.userIcon}
        setUserIcon={props.setUserIcon}
      />
      <DeviceListPart
        error={!!sessionsResult.error}
        loading={sessionsResult.loading}
        sessions={sessionsResult.value ?? []}
        onChange={execSessions}
      />
      <AccountActionsPart />
    </>
  );
}

export function SettingsPage() {
  const [searchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    "settings-account",
  );
  const { logout } = useAuth();
  const { user: authUser } = useAuthContext();
  const prevCategoryRef = useRef<string | null>(null);
  const location = useLocation();

  // Watch for hash changes from React Router
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const hashId = hash.substring(1);
      const validCategories = [
        "settings-account",
        "settings-preferences",
        "settings-appearance",
        "settings-captions",
        "settings-connection",
        "settings-providers",
      ];

      if (validCategories.includes(hashId)) {
        setSelectedCategory(hashId);
      }
    }
  }, [location.hash]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const hashId = hash.substring(1); // Remove the # symbol
      // Check if it's a valid settings category
      const validCategories = [
        "settings-account",
        "settings-preferences",
        "settings-appearance",
        "settings-captions",
        "settings-connection",
        "settings-providers",
      ];

      // Map sub-section hashes to their parent categories
      const subSectionToCategory: Record<string, string> = {
        "source-order": "settings-preferences",
      };

      // Check if it's a sub-section hash
      if (subSectionToCategory[hashId]) {
        const categoryId = subSectionToCategory[hashId];
        setSelectedCategory(categoryId);
        // Wait for the section to render, then scroll
        scrollToHash(hash, { delay: 100 });
      } else if (validCategories.includes(hashId)) {
        // It's a category hash
        setSelectedCategory(hashId);
        scrollToHash(hash);
      } else {
        // Try to find the element anyway (might be a sub-section)
        const element = document.querySelector(hash);
        if (element) {
          // Find which category this element belongs to
          const parentSection = element.closest('[id^="settings-"]');
          if (parentSection) {
            const categoryId = parentSection.id;
            if (validCategories.includes(categoryId)) {
              setSelectedCategory(categoryId);
              scrollToHash(hash, { delay: 100 });
            }
          } else {
            scrollToHash(hash);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle hash changes after initial load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const hashId = hash.substring(1);
        const validCategories = [
          "settings-account",
          "settings-preferences",
          "settings-appearance",
          "settings-captions",
          "settings-connection",
          "settings-providers",
        ];
        const subSectionToCategory: Record<string, string> = {
          "source-order": "settings-preferences",
        };

        if (subSectionToCategory[hashId]) {
          const categoryId = subSectionToCategory[hashId];
          setSelectedCategory(categoryId);
          scrollToHash(hash, { delay: 100 });
        } else if (validCategories.includes(hashId)) {
          setSelectedCategory(hashId);
          scrollToHash(hash, { delay: 100 });
        } else {
          const element = document.querySelector(hash);
          if (element) {
            const parentSection = element.closest('[id^="settings-"]');
            if (parentSection) {
              const categoryId = parentSection.id;
              if (validCategories.includes(categoryId)) {
                setSelectedCategory(categoryId);
                scrollToHash(hash, { delay: 100 });
              }
            } else {
              scrollToHash(hash);
            }
          }
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Scroll to top when category changes (but not on initial load or when searching)
  useEffect(() => {
    if (
      prevCategoryRef.current !== null &&
      prevCategoryRef.current !== selectedCategory &&
      !searchQuery.trim()
    ) {
      // Only scroll to top if we're actually switching categories (not initial load)
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    prevCategoryRef.current = selectedCategory;
  }, [selectedCategory, searchQuery]);

  const { t } = useTranslation();
  const workerUrl = usePreferencesStore((s) => s.workerUrl);
  const setWorkerUrl = usePreferencesStore((s) => s.setWorkerUrl);
  const streamingProxyUrl = usePreferencesStore((s) => s.streamingProxyUrl);
  const setStreamingProxyUrl = usePreferencesStore(
    (s) => s.setStreamingProxyUrl,
  );
  const cdnUrl = usePreferencesStore((s) => s.cdnUrl);
  const setCdnUrl = usePreferencesStore((s) => s.setCdnUrl);
  const febboxUrl = usePreferencesStore((s) => s.febboxUrl);
  const setFebboxUrl = usePreferencesStore((s) => s.setFebboxUrl);

  const activeTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const previewTheme = usePreviewThemeStore((s) => s.previewTheme);
  const setPreviewTheme = usePreviewThemeStore((s) => s.setPreviewTheme);

  // Simple text search with highlighting
  const appLanguage = useLanguageStore((s) => s.language);
  const setAppLanguage = useLanguageStore((s) => s.setLanguage);

  const subStyling = useSubtitleStore((s) => s.styling);
  const setSubStyling = useSubtitleStore((s) => s.updateStyling);

  const proxySet = useAuthStore((s) => s.proxySet);
  const setProxySet = useAuthStore((s) => s.setProxySet);

  const backendUrlSetting = useAuthStore((s) => s.backendUrl);
  const setBackendUrl = useAuthStore((s) => s.setBackendUrl);

  const febboxKey = usePreferencesStore((s) => s.febboxKey);
  const setFebboxKey = usePreferencesStore((s) => s.setFebboxKey);

  const debridToken = usePreferencesStore((s) => s.debridToken);
  const setdebridToken = usePreferencesStore((s) => s.setdebridToken);
  const debridService = usePreferencesStore((s) => s.debridService);
  const setdebridService = usePreferencesStore((s) => s.setdebridService);

  const enableThumbnails = usePreferencesStore((s) => s.enableThumbnails);
  const setEnableThumbnails = usePreferencesStore((s) => s.setEnableThumbnails);

  const enableAutoplay = usePreferencesStore((s) => s.enableAutoplay);
  const setEnableAutoplay = usePreferencesStore((s) => s.setEnableAutoplay);

  const enableSkipCredits = usePreferencesStore((s) => s.enableSkipCredits);
  const setEnableSkipCredits = usePreferencesStore(
    (s) => s.setEnableSkipCredits,
  );

  const sourceOrder = usePreferencesStore((s) => s.sourceOrder);
  const setSourceOrder = usePreferencesStore((s) => s.setSourceOrder);

  const enableSourceOrder = usePreferencesStore((s) => s.enableSourceOrder);
  const setEnableSourceOrder = usePreferencesStore(
    (s) => s.setEnableSourceOrder,
  );

  const lastSuccessfulSource = usePreferencesStore(
    (s) => s.lastSuccessfulSource,
  );
  const setLastSuccessfulSource = usePreferencesStore(
    (s) => s.setLastSuccessfulSource,
  );

  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );
  const setEnableLastSuccessfulSource = usePreferencesStore(
    (s) => s.setEnableLastSuccessfulSource,
  );

  const disabledSources = usePreferencesStore((s) => s.disabledSources);
  const setDisabledSources = usePreferencesStore((s) => s.setDisabledSources);

  // These are commented because the EmbedOrderPart is on the admin page and not on the settings page.
  const embedOrder = usePreferencesStore((s) => s.embedOrder);
  // const setEmbedOrder = usePreferencesStore((s) => s.setEmbedOrder);

  const enableEmbedOrder = usePreferencesStore((s) => s.enableEmbedOrder);
  // const setEnableEmbedOrder = usePreferencesStore((s) => s.setEnableEmbedOrder);

  const disabledEmbeds = usePreferencesStore((s) => s.disabledEmbeds);
  // const setDisabledEmbeds = usePreferencesStore((s) => s.setDisabledEmbeds);

  const enableDiscover = usePreferencesStore((s) => s.enableDiscover);
  const setEnableDiscover = usePreferencesStore((s) => s.setEnableDiscover);

  const enableFeatured = usePreferencesStore((s) => s.enableFeatured);
  const setEnableFeatured = usePreferencesStore((s) => s.setEnableFeatured);

  const enableDetailsModal = usePreferencesStore((s) => s.enableDetailsModal);
  const setEnableDetailsModal = usePreferencesStore(
    (s) => s.setEnableDetailsModal,
  );

  const enableImageLogos = usePreferencesStore((s) => s.enableImageLogos);
  const setEnableImageLogos = usePreferencesStore((s) => s.setEnableImageLogos);

  const proxyTmdb = usePreferencesStore((s) => s.proxyTmdb);
  const setProxyTmdb = usePreferencesStore((s) => s.setProxyTmdb);

  const enableCarouselView = usePreferencesStore((s) => s.enableCarouselView);
  const setEnableCarouselView = usePreferencesStore(
    (s) => s.setEnableCarouselView,
  );

  const forceCompactEpisodeView = usePreferencesStore(
    (s) => s.forceCompactEpisodeView,
  );
  const setForceCompactEpisodeView = usePreferencesStore(
    (s) => s.setForceCompactEpisodeView,
  );

  const enableLowPerformanceMode = usePreferencesStore(
    (s) => s.enableLowPerformanceMode,
  );
  const setEnableLowPerformanceMode = usePreferencesStore(
    (s) => s.setEnableLowPerformanceMode,
  );

  // These are commented because the NativeSubtitlesPart is accessable though the atoms caption style menu and not on the settings page.
  const enableNativeSubtitles = usePreferencesStore(
    (s) => s.enableNativeSubtitles,
  );
  // const setEnableNativeSubtitles = usePreferencesStore(
  //   (s) => s.setEnableNativeSubtitles,
  // );

  const enableHoldToBoost = usePreferencesStore((s) => s.enableHoldToBoost);
  const setEnableHoldToBoost = usePreferencesStore(
    (s) => s.setEnableHoldToBoost,
  );

  const homeSectionOrder = usePreferencesStore((s) => s.homeSectionOrder);
  const setHomeSectionOrder = usePreferencesStore((s) => s.setHomeSectionOrder);

  const manualSourceSelection = usePreferencesStore(
    (s) => s.manualSourceSelection,
  );
  const setManualSourceSelection = usePreferencesStore(
    (s) => s.setManualSourceSelection,
  );

  const enableDoubleClickToSeek = usePreferencesStore(
    (s) => s.enableDoubleClickToSeek,
  );
  const setEnableDoubleClickToSeek = usePreferencesStore(
    (s) => s.setEnableDoubleClickToSeek,
  );

  const account = useAuthStore((s) => s.account);
  const updateProfile = useAuthStore((s) => s.setAccountProfile);
  const updateDeviceName = useAuthStore((s) => s.updateDeviceName);
  const updateNickname = useAuthStore((s) => s.setAccountNickname);
  const decryptedName = useMemo(() => {
    if (!account) return "";
    try {
      return decryptData(account.deviceName, base64ToBuffer(account.seed));
    } catch (error) {
      console.warn("Failed to decrypt device name, using fallback:", error);
      // Return a fallback device name if decryption fails
      return t("settings.account.devices.unknownDevice");
    }
  }, [account, t]);

  const backendUrl = useBackendUrl();
  const user = useAuthStore();

  useEffect(() => {
    const loadSettings = async () => {
      if (account && backendUrl) {
        const settings = await getSettings(backendUrl, account);
        if (settings.febboxKey) {
          setFebboxKey(settings.febboxKey);
        }
        if (settings.debridToken) {
          setdebridToken(settings.debridToken);
        }
      }
    };
    loadSettings();
  }, [account, backendUrl, setFebboxKey, setdebridToken, setdebridService]);

  const state = useSettingsState(
    activeTheme,
    appLanguage,
    subStyling,
    decryptedName,
    account?.nickname || "",
    proxySet,
    backendUrlSetting,
    febboxKey,
    debridToken,
    debridService,
    account ? account.profile : undefined,
    enableThumbnails,
    enableAutoplay,
    enableDiscover,
    enableFeatured,
    enableDetailsModal,
    sourceOrder,
    enableSourceOrder,
    lastSuccessfulSource,
    enableLastSuccessfulSource,
    disabledSources,
    embedOrder,
    enableEmbedOrder,
    disabledEmbeds,
    proxyTmdb,
    enableSkipCredits,
    enableImageLogos,
    enableCarouselView,
    forceCompactEpisodeView,
    enableLowPerformanceMode,
    enableNativeSubtitles,
    enableHoldToBoost,
    homeSectionOrder,
    manualSourceSelection,
    enableDoubleClickToSeek,
    workerUrl,
    streamingProxyUrl,
    cdnUrl,
    febboxUrl,
  );

  const availableSources = useMemo(() => {
    const sources = getAllProviders().listSources();
    const sourceIDs = sources.map((s: any) => s.id);
    const stateSources = state.sourceOrder.state;

    // Filter out sources that are not in `stateSources` and are in `sources`
    const updatedSources = stateSources.filter((ss) => sourceIDs.includes(ss));

    // Add sources from `sources` that are not in `stateSources`
    const missingSources = sources
      .filter((s: any) => !stateSources.includes(s.id))
      .map((s: any) => s.id);

    return [...updatedSources, ...missingSources];
  }, [state.sourceOrder.state]);

  useEffect(() => {
    setPreviewTheme(activeTheme ?? "default");
  }, [setPreviewTheme, activeTheme]);

  useEffect(() => {
    // Clear preview theme on unmount
    return () => {
      setPreviewTheme(null);
    };
  }, [setPreviewTheme]);

  const setThemeWithPreview = useCallback(
    (theme: string) => {
      state.theme.set(theme === "default" ? null : theme);
      setPreviewTheme(theme);
    },
    [state.theme, setPreviewTheme],
  );

  const saveChanges = useCallback(async () => {
    if (account && backendUrl) {
      if (
        state.appLanguage.changed ||
        state.theme.changed ||
        state.proxyUrls.changed ||
        state.febboxKey.changed ||
        state.debridToken.changed ||
        state.debridService.changed ||
        state.enableThumbnails.changed ||
        state.enableAutoplay.changed ||
        state.enableSkipCredits.changed ||
        state.enableDiscover.changed ||
        state.enableFeatured.changed ||
        state.enableDetailsModal.changed ||
        state.enableImageLogos.changed ||
        state.sourceOrder.changed ||
        state.enableSourceOrder.changed ||
        state.lastSuccessfulSource.changed ||
        state.enableLastSuccessfulSource.changed ||
        state.disabledSources.changed ||
        state.proxyTmdb.changed ||
        state.enableCarouselView.changed ||
        state.forceCompactEpisodeView.changed ||
        state.enableLowPerformanceMode.changed ||
        state.enableHoldToBoost.changed ||
        state.homeSectionOrder.changed ||
        state.manualSourceSelection.changed ||
        state.enableDoubleClickToSeek ||
        state.workerUrl.changed ||
        state.streamingProxyUrl.changed ||
        state.cdnUrl.changed ||
        state.febboxUrl.changed
      ) {
        await updateSettings(backendUrl, account, {
          applicationLanguage: state.appLanguage.state,
          applicationTheme: state.theme.state,
          proxyUrls: state.proxyUrls.state?.filter((v) => v !== "") ?? null,
          febboxKey: state.febboxKey.state,
          debridToken: state.debridToken.state,
          debridService: state.debridService.state,
          enableThumbnails: state.enableThumbnails.state,
          enableAutoplay: state.enableAutoplay.state,
          enableSkipCredits: state.enableSkipCredits.state,
          enableDiscover: state.enableDiscover.state,
          enableFeatured: state.enableFeatured.state,
          enableDetailsModal: state.enableDetailsModal.state,
          enableImageLogos: state.enableImageLogos.state,
          sourceOrder: state.sourceOrder.state,
          enableSourceOrder: state.enableSourceOrder.state,
          lastSuccessfulSource: state.lastSuccessfulSource.state,
          enableLastSuccessfulSource: state.enableLastSuccessfulSource.state,
          disabledSources: state.disabledSources.state,
          proxyTmdb: state.proxyTmdb.state,
          enableCarouselView: state.enableCarouselView.state,
          forceCompactEpisodeView: state.forceCompactEpisodeView.state,
          enableLowPerformanceMode: state.enableLowPerformanceMode.state,
          enableHoldToBoost: state.enableHoldToBoost.state,
          homeSectionOrder: state.homeSectionOrder.state,
          manualSourceSelection: state.manualSourceSelection.state,
          enableDoubleClickToSeek: state.enableDoubleClickToSeek.state,
        });
      }
      if (state.deviceName.changed) {
        const newDeviceName = await encryptData(
          state.deviceName.state,
          base64ToBuffer(account.seed),
        );
        await updateSession(backendUrl, account, {
          deviceName: newDeviceName,
        });
        updateDeviceName(newDeviceName);
      }
      if (state.nickname.changed) {
        await editUser(backendUrl, account, {
          nickname: state.nickname.state,
        });
        updateNickname(state.nickname.state);
      }
      if (state.profile.changed && state.profile.state) {
        await editUser(backendUrl, account, {
          profile: state.profile.state,
        });
        updateProfile(state.profile.state);
      }
    }

    setEnableThumbnails(state.enableThumbnails.state);
    setEnableAutoplay(state.enableAutoplay.state);
    setEnableSkipCredits(state.enableSkipCredits.state);
    setEnableDiscover(state.enableDiscover.state);
    setEnableFeatured(state.enableFeatured.state);
    setEnableDetailsModal(state.enableDetailsModal.state);
    setEnableImageLogos(state.enableImageLogos.state);
    setSourceOrder(state.sourceOrder.state);
    setEnableSourceOrder(state.enableSourceOrder.state);
    setLastSuccessfulSource(state.lastSuccessfulSource.state);
    setEnableLastSuccessfulSource(state.enableLastSuccessfulSource.state);
    setDisabledSources(state.disabledSources.state);
    setAppLanguage(state.appLanguage.state);
    setTheme(state.theme.state);
    setSubStyling(state.subtitleStyling.state);
    setProxySet(state.proxyUrls.state?.filter((v) => v !== "") ?? null);
    setEnableSourceOrder(state.enableSourceOrder.state);
    setFebboxKey(state.febboxKey.state);
    setdebridToken(state.debridToken.state);
    setdebridService(state.debridService.state);
    setProxyTmdb(state.proxyTmdb.state);
    setEnableCarouselView(state.enableCarouselView.state);
    setForceCompactEpisodeView(state.forceCompactEpisodeView.state);
    setEnableLowPerformanceMode(state.enableLowPerformanceMode.state);
    setEnableHoldToBoost(state.enableHoldToBoost.state);
    setHomeSectionOrder(state.homeSectionOrder.state);
    setManualSourceSelection(state.manualSourceSelection.state);
    setEnableDoubleClickToSeek(state.enableDoubleClickToSeek.state);
    setWorkerUrl(state.workerUrl.state);
    setStreamingProxyUrl(state.streamingProxyUrl.state);
    setCdnUrl(state.cdnUrl.state);
    setFebboxUrl(state.febboxUrl.state);

    if (state.profile.state) {
      updateProfile(state.profile.state);
    }

    // when backend url gets changed, log the user out first
    if (state.backendUrl.changed) {
      await logout();

      let url = state.backendUrl.state;
      if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }

      setBackendUrl(url);
    }
  }, [
    account,
    backendUrl,
    setEnableThumbnails,
    setFebboxKey,
    setdebridToken,
    setdebridService,
    state,
    setEnableAutoplay,
    setEnableSkipCredits,
    setEnableDiscover,
    setEnableFeatured,
    setEnableDetailsModal,
    setEnableImageLogos,
    setSourceOrder,
    setEnableSourceOrder,
    setLastSuccessfulSource,
    setEnableLastSuccessfulSource,
    setDisabledSources,
    setAppLanguage,
    setTheme,
    setSubStyling,
    setProxySet,
    updateDeviceName,
    updateProfile,
    updateNickname,
    logout,
    setBackendUrl,
    setProxyTmdb,
    setEnableCarouselView,
    setForceCompactEpisodeView,
    setEnableLowPerformanceMode,
    setEnableHoldToBoost,
    setHomeSectionOrder,
    setManualSourceSelection,
    setEnableDoubleClickToSeek,
    setWorkerUrl,
    setStreamingProxyUrl,
    setCdnUrl,
    setFebboxUrl,
  ]);
  return (
    <>
      <PageTitle subpage k="global.pages.settings" />
      <SettingsLayout
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        className="space-y-28"
      >
        {(searchQuery.trim() ||
          !selectedCategory ||
          selectedCategory === "settings-account") && (
          <div id="settings-account">
            <Heading1 border className="!mb-0">
              {t("settings.account.title")}
            </Heading1>

            {/* Account Information */}
            <SolidSettingsCard paddingClass="px-6 py-6" className="mt-5">
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <p className="text-sm text-type-secondary mb-1">Email</p>
                  <p className="text-white font-medium">
                    {authUser?.email || "Not logged in"}
                  </p>
                </div>

                {/* Premium Status */}
                <div>
                  <p className="text-sm text-type-secondary mb-1">
                    Account Status
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${authUser?.isPremium ? "bg-green-500" : "bg-gray-500"}`}
                    />
                    <p className="text-white font-medium">
                      {authUser?.isPremium ? "Premium" : "Free"}
                    </p>
                  </div>
                </div>

                {/* Account Created */}
                <div>
                  <p className="text-sm text-type-secondary mb-1">
                    Member Since
                  </p>
                  <p className="text-white font-medium">
                    {authUser?.createdAt
                      ? new Date(authUser.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )
                      : "Unknown"}
                  </p>
                </div>

                <Divider marginClass="my-4" />

                {/* Logout Button */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">Sign Out</p>
                    <p className="text-sm text-type-secondary">
                      Log out of your account
                    </p>
                  </div>
                  <Button
                    theme="danger"
                    onClick={async () => {
                      await logout();
                      window.location.href = "/login";
                    }}
                  >
                    Log out
                  </Button>
                </div>
              </div>
            </SolidSettingsCard>
          </div>
        )}
        {(searchQuery.trim() ||
          !selectedCategory ||
          selectedCategory === "settings-preferences") && (
          <div id="settings-preferences">
            <PreferencesPart
              language={state.appLanguage.state}
              setLanguage={state.appLanguage.set}
              enableThumbnails={state.enableThumbnails.state}
              setEnableThumbnails={state.enableThumbnails.set}
              enableAutoplay={state.enableAutoplay.state}
              setEnableAutoplay={state.enableAutoplay.set}
              enableSkipCredits={state.enableSkipCredits.state}
              setEnableSkipCredits={state.enableSkipCredits.set}
              sourceOrder={availableSources}
              setSourceOrder={state.sourceOrder.set}
              enableSourceOrder={state.enableSourceOrder.state}
              setenableSourceOrder={state.enableSourceOrder.set}
              enableLastSuccessfulSource={
                state.enableLastSuccessfulSource.state
              }
              setEnableLastSuccessfulSource={
                state.enableLastSuccessfulSource.set
              }
              disabledSources={state.disabledSources.state}
              setDisabledSources={state.disabledSources.set}
              enableLowPerformanceMode={state.enableLowPerformanceMode.state}
              setEnableLowPerformanceMode={state.enableLowPerformanceMode.set}
              enableHoldToBoost={state.enableHoldToBoost.state}
              setEnableHoldToBoost={state.enableHoldToBoost.set}
              manualSourceSelection={state.manualSourceSelection.state}
              setManualSourceSelection={state.manualSourceSelection.set}
              enableDoubleClickToSeek={state.enableDoubleClickToSeek.state}
              setEnableDoubleClickToSeek={state.enableDoubleClickToSeek.set}
            />
          </div>
        )}
        {(searchQuery.trim() ||
          !selectedCategory ||
          selectedCategory === "settings-appearance") && (
          <div id="settings-appearance">
            <AppearancePart
              active={previewTheme ?? "default"}
              inUse={activeTheme ?? "default"}
              setTheme={setThemeWithPreview}
              enableDiscover={state.enableDiscover.state}
              setEnableDiscover={state.enableDiscover.set}
              enableFeatured={state.enableFeatured.state}
              setEnableFeatured={state.enableFeatured.set}
              enableDetailsModal={state.enableDetailsModal.state}
              setEnableDetailsModal={state.enableDetailsModal.set}
              enableImageLogos={state.enableImageLogos.state}
              setEnableImageLogos={state.enableImageLogos.set}
              enableCarouselView={state.enableCarouselView.state}
              setEnableCarouselView={state.enableCarouselView.set}
              forceCompactEpisodeView={state.forceCompactEpisodeView.state}
              setForceCompactEpisodeView={state.forceCompactEpisodeView.set}
              homeSectionOrder={state.homeSectionOrder.state}
              setHomeSectionOrder={state.homeSectionOrder.set}
              enableLowPerformanceMode={state.enableLowPerformanceMode.state}
            />
          </div>
        )}
        {(searchQuery.trim() ||
          !selectedCategory ||
          selectedCategory === "settings-captions") && (
          <div id="settings-captions">
            <CaptionsPart
              styling={state.subtitleStyling.state}
              setStyling={state.subtitleStyling.set}
            />
          </div>
        )}
        {(searchQuery.trim() ||
          !selectedCategory ||
          selectedCategory === "settings-connection") && (
          <div id="settings-connection">
            <ConnectionsPart
              workerUrl={state.workerUrl.state}
              setWorkerUrl={state.workerUrl.set}
              streamingProxyUrl={state.streamingProxyUrl.state}
              setStreamingProxyUrl={state.streamingProxyUrl.set}
              cdnUrl={state.cdnUrl.state}
              setCdnUrl={state.cdnUrl.set}
              febboxUrl={state.febboxUrl.state}
              setFebboxUrl={state.febboxUrl.set}
              febboxKey={state.febboxKey.state}
              setFebboxKey={state.febboxKey.set}
              debridToken={state.debridToken.state}
              setdebridToken={state.debridToken.set}
              debridService={state.debridService.state}
              setdebridService={state.debridService.set}
            />
          </div>
        )}
        {(searchQuery.trim() ||
          !selectedCategory ||
          selectedCategory === "settings-providers") && (
          <div id="settings-providers">
            <ProvidersPart
              disabledSources={state.disabledSources.state}
              setDisabledSources={state.disabledSources.set}
            />
          </div>
        )}
      </SettingsLayout>
      <Transition
        animation="fade"
        show={state.changed}
        className="bg-settings-saveBar-background border-t border-settings-card-border/50 py-4 transition-opacity w-full fixed bottom-0 flex justify-between flex-col md:flex-row px-8 items-start md:items-center gap-3 z-[999]"
      >
        <p className="text-type-danger">{t("settings.unsaved")}</p>
        <div className="space-x-3 w-full md:w-auto flex">
          <Button
            className="w-full md:w-auto"
            theme="secondary"
            onClick={state.reset}
          >
            {t("settings.reset")}
          </Button>
          <Button
            className="w-full md:w-auto"
            theme="purple"
            onClick={saveChanges}
          >
            {t("settings.save")}
          </Button>
        </div>
      </Transition>
    </>
  );
}

export default SettingsPage;
