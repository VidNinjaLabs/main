import { CloudIcon } from "@hugeicons/react";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Popover } from "../base/Popover";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { conf } from "@/setup/config";

interface Provider {
  codename: string;
  rank: number;
  type: string;
}

interface ProvidersResponse {
  sources: Provider[];
}

export function ServerSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    // Fetch providers from /providers endpoint
    const backendUrl = conf().VIDNINJA_API_URL;
    if (!backendUrl) {
      console.error("VIDNINJA_API_URL not configured");
      return;
    }

    fetch(`${backendUrl}/providers`)
      .then((res) => res.json())
      .then((data: ProvidersResponse) => {
        setProviders(data.sources);
        // Set first provider as default
        if (data.sources.length > 0) {
          setSelectedProvider(data.sources[0].codename);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch providers:", error);
      });
  }, []);

  const handleProviderSelect = (codename: string) => {
    setSelectedProvider(codename);
    setIsOpen(false);
    // TODO: Implement provider switching logic
    console.log("Selected provider:", codename);
  };

  return (
    <Popover
      trigger={
        <button
          className="p-2 md:p-2.5 transition-colors group"
          title={`Server: ${selectedProvider || "Select"}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <HugeiconsIcon
            icon={CloudIcon}
            size="md"
            className="text-white/70 group-hover:text-white transition-colors"
            strokeWidth={2}
          />
        </button>
      }
      content={
        <div className="w-64">
          <div className="p-4 border-b border-zinc-700">
            <h3 className="text-white font-semibold text-base">
              Select Server
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto py-2">
            {providers.length === 0 ? (
              <div className="px-5 py-3.5 text-gray-400 text-base">
                Loading servers...
              </div>
            ) : (
              providers.map((provider) => (
                <button
                  key={provider.codename}
                  onClick={() => handleProviderSelect(provider.codename)}
                  className="w-full px-5 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <span className="text-white text-lg">
                    {provider.codename}
                  </span>
                  {selectedProvider === provider.codename && (
                    <Check className="w-6 h-6 text-white" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      }
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      position="bottom"
      align="start"
    />
  );
}
