import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAsync } from "react-use";

import { fetchMetadata } from "@/backend/api/metadata";
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

  return (
    <div className="space-y-6">
      <Heading1 border>{t("settings.providers.title")}</Heading1>
      <Paragraph className="mb-6">
        {t(
          "settings.providers.description",
          "Manage your media providers, check their status, and customize their display names.",
        )}
      </Paragraph>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Provider List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {t("settings.providers.providerList", "Provider List")}
          </h2>
          <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {sources.map((source) => {
              const status = statusData ? statusData[source.id] : null;
              const displayName = providerNames[source.id] || source.name;
              const isEnabled = !props.disabledSources.includes(source.id);

              return (
                <div
                  key={source.id}
                  className="bg-video-context-background rounded-lg p-4 border border-video-context-border flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        onClick={() => handleToggle(source.id)}
                        className="cursor-pointer"
                        title={
                          isEnabled
                            ? t("global.disable", "Disable")
                            : t("global.enable", "Enable")
                        }
                      >
                        <Toggle enabled={isEnabled} />
                      </div>
                      {editingId === source.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="py-1 px-2 h-8 w-48"
                            autoFocus
                          />
                          <Button
                            theme="purple"
                            className="!py-1 !px-3 h-8 text-xs"
                            onClick={() => handleSave(source.id)}
                          >
                            {t("global.save", "Save")}
                          </Button>
                          <Button
                            theme="secondary"
                            className="!py-1 !px-3 h-8 text-xs"
                            onClick={handleCancel}
                          >
                            {t("global.cancel", "Cancel")}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-lg font-bold ${
                              isEnabled ? "text-white" : "text-type-dimmed"
                            }`}
                          >
                            {displayName}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleEdit(source.id, source.name)}
                            title={t("global.rename", "Rename")}
                            className="p-1 text-type-dimmed hover:text-white transition-colors"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded bg-video-context-border text-type-dimmed">
                        {source.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-type-dimmed pl-14">
                      ID: <span className="font-mono">{source.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pl-14 md:pl-0">
                    <div className="text-center">
                      <div className="text-xs text-type-dimmed uppercase tracking-wider mb-1">
                        {t("settings.providers.uptime", "Uptime")}
                      </div>
                      <div className="font-mono font-medium">
                        {status?.uptime != null
                          ? `${status.uptime.toFixed(1)}%`
                          : "-"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-type-dimmed uppercase tracking-wider mb-1">
                        {t("settings.providers.latency", "Latency")}
                      </div>
                      <div className="font-mono font-medium">
                        {status?.responseTime != null
                          ? `${status.responseTime}ms`
                          : "-"}
                      </div>
                    </div>
                    <div className="text-center min-w-[100px]">
                      <div className="text-xs text-type-dimmed uppercase tracking-wider mb-1">
                        {t("settings.providers.status", "Status")}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {status ? (
                          <>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                status.status === "operational"
                                  ? "bg-green-500"
                                  : status.status === "degraded"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            />
                            <span
                              className={`font-medium ${
                                status.status === "operational"
                                  ? "text-green-400"
                                  : status.status === "degraded"
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {status.status}
                            </span>
                          </>
                        ) : (
                          <span className="text-type-dimmed">
                            {statusLoading ? "Loading..." : "Unknown"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {sources.length === 0 && (
              <div className="text-center py-12 text-type-dimmed">
                {t("settings.providers.noSources", "No providers available.")}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Reserved for Future Panels */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {t("settings.providers.additionalSettings", "Additional Settings")}
          </h2>
          <div className="bg-video-context-background/30 rounded-lg p-6 border border-video-context-border border-dashed">
            <p className="text-center text-type-dimmed">
              {t(
                "settings.providers.placeholder",
                "Additional provider settings and controls will appear here.",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
