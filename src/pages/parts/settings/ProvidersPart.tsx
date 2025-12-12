import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAsync } from "react-use";

import { clearMetadataCache, fetchMetadata } from "@/backend/api/metadata";
import { vidNinjaClient } from "@/backend/api/vidninja";
import { getAllProviders } from "@/backend/providers/providers";
import { Button } from "@/components/buttons/Button";
import { Toggle } from "@/components/buttons/Toggle";
import { Input } from "@/components/form/Input";
import { Heading1, Paragraph } from "@/components/utils/Text";
import { usePreferencesStore } from "@/stores/preferences";

export function ProvidersPart(props: {
  disabledSources: string[];
  setDisabledSources: (v: string[]) => void;
}) {
  const { t } = useTranslation();
  const providerNames = usePreferencesStore((s) => s.providerNames);
  const setProviderName = usePreferencesStore((s) => s.setProviderName);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [sources, setSources] = useState(getAllProviders().listSources());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      if (sources.length === 0) {
        await fetchMetadata();
        setSources(getAllProviders().listSources());
      }
    };
    loadMetadata();
  }, [sources.length]);

  const { value: statusData, loading: statusLoading } = useAsync(async () => {
    try {
      return await vidNinjaClient.getStatus();
    } catch (e) {
      console.error("Failed to fetch provider status", e);
      return null;
    }
  }, []);

  const handleEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(providerNames[id] || currentName);
  };

  const handleSave = (id: string) => {
    setProviderName(id, editName);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleToggle = (id: string) => {
    const isDisabled = props.disabledSources.includes(id);
    if (isDisabled) {
      props.setDisabledSources(props.disabledSources.filter((s) => s !== id));
    } else {
      props.setDisabledSources([...props.disabledSources, id]);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      clearMetadataCache();
      await fetchMetadata();
      setSources(getAllProviders().listSources());
    } catch (error) {
      console.error("Failed to refresh providers:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Heading1 border>{t("settings.providers.title")}</Heading1>
      <Paragraph className="mb-6">
        {t(
          "settings.providers.description",
          "Manage your media providers, check their status, and customize their display names.",
        )}
      </Paragraph>

      <div className="space-y-8">
        {/* Provider List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">
                {t("settings.providers.providerList", "Provider List")}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-medium text-white/60">
                {sources.length}
              </span>
            </div>
            <Button
              theme="purple"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="!py-2 !px-4"
            >
              {isRefreshing
                ? t("settings.providers.refreshing", "Refreshing...")
                : t("settings.providers.refresh", "Refresh Providers")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sources.map((source) => {
              const status = statusData ? statusData[source.id] : null;
              const displayName = providerNames[source.id] || source.name;
              const isEnabled = !props.disabledSources.includes(source.id);

              return (
                <div
                  key={source.id}
                  className={`relative group bg-video-context-background hover:bg-video-context-hoverBackground rounded-xl p-3 border transition-all duration-200 ${
                    isEnabled
                      ? "border-video-context-border"
                      : "border-video-context-border/50 opacity-75"
                  }`}
                >
                  {/* Header: Name and Toggle */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {editingId === source.id ? (
                          // Edit Mode
                          <div className="flex items-center gap-2 w-full">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="py-0.5 px-2 h-6 text-sm w-full"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave(source.id);
                                if (e.key === "Escape") handleCancel();
                              }}
                            />
                            <Button
                              theme="purple"
                              className="!p-1 h-6 w-6 flex items-center justify-center shrink-0"
                              onClick={() => handleSave(source.id)}
                            >
                              <SquarePen className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          // Display Mode
                          <>
                            <h3
                              className={`text-base font-bold truncate ${
                                isEnabled ? "text-white" : "text-type-dimmed"
                              }`}
                              title={displayName}
                            >
                              {displayName}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleEdit(source.id, source.name)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-type-dimmed hover:text-white transition-all"
                            >
                              <SquarePen className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={() => handleToggle(source.id)}
                      className="cursor-pointer shrink-0"
                      title={isEnabled ? "Disable" : "Enable"}
                    >
                      <Toggle enabled={isEnabled} />
                    </div>
                  </div>

                  {/* Stats Grid - Single Row Compact */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-3 border-t border-white/5">
                    {/* Status */}
                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-black/20">
                      <span className="text-type-dimmed mb-1 text-[10px] uppercase tracking-wider font-semibold">
                        Status
                      </span>
                      <div className="flex items-center gap-1.5 h-5">
                        {status ? (
                          <div className="relative flex h-2.5 w-2.5">
                            {status.status === "operational" && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            )}
                            <span
                              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                status.status === "operational"
                                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                  : status.status === "degraded"
                                    ? "bg-yellow-500"
                                    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                              }`}
                            />
                          </div>
                        ) : (
                          <span className="text-type-dimmed">
                            {statusLoading ? "..." : "?"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Uptime */}
                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-black/20">
                      <span className="text-type-dimmed mb-0.5 text-[10px] uppercase tracking-wider font-semibold">
                        Uptime
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${parseFloat(status?.uptime?.toFixed(1) || "0") >= 98 ? "text-green-400" : "text-white/90"}`}
                      >
                        {status?.uptime != null
                          ? `${status.uptime.toFixed(0)}%`
                          : "-"}
                      </span>
                    </div>

                    {/* Latency */}
                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-black/20">
                      <span className="text-type-dimmed mb-0.5 text-[10px] uppercase tracking-wider font-semibold">
                        Ping
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${status?.latency && status.latency < 500 ? "text-green-400" : "text-white/90"}`}
                      >
                        {status?.latency != null ? `${status.latency}ms` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {sources.length === 0 && (
              <div className="col-span-full text-center py-12 text-type-dimmed bg-video-context-background rounded-xl border border-video-context-border border-dashed">
                {t("settings.providers.noSources", "No providers available.")}
              </div>
            )}
          </div>
        </div>

        {/* Additional Settings Section - Full width at bottom */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h2 className="text-lg font-semibold text-white">
            {t("settings.providers.additionalSettings", "Additional Settings")}
          </h2>
          <div className="bg-video-context-background/30 rounded-lg p-8 border border-video-context-border border-dashed flex flex-col items-center justifying-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <SquarePen className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-type-dimmed max-w-md">
              {t(
                "settings.providers.placeholder",
                "Advanced provider configurations, proxy settings, and custom source URLs will appear here in future updates.",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
