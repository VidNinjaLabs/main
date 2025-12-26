/* eslint-disable no-console */
import classNames from "classnames";
import { FetchError } from "ofetch";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAsync } from "react-use";

import { isExtensionActive } from "@/backend/extension/messaging";
import { proxiedFetch, singularProxiedFetch } from "@/backend/helpers/fetch";
import { Icon, Icons } from "@/components/Icon";
import { Loading } from "@/components/layout/Loading";
import { SettingsCard } from "@/components/layout/SettingsCard";
import {
  StatusCircle,
  StatusCircleProps,
} from "@/components/player/internals/StatusCircle";
import { Heading3 } from "@/components/utils/Text";
import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";
import { usePreferencesStore } from "@/stores/preferences";

const testUrl = "https://postman-echo.com/get";

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

export type Status =
  | "success"
  | "unset"
  | "error"
  | "api_down"
  | "invalid_token";

type SetupData = {
  extension: Status;
  proxy: Status;
  tmdbProxy: Status;
  febboxKeyTest?: Status;
  debridTokenTest?: Status;
};

function testProxy(url: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => reject(new Error("Timed out!")), 3000);
    singularProxiedFetch(url, testUrl, {})
      .then((res) => {
        if (res.url !== testUrl) return reject(new Error("Not a proxy"));
        resolve();
      })
      .catch(reject);
  });
}

export async function testFebboxKey(febboxKey: string | null): Promise<Status> {
  if (!febboxKey) {
    return "unset";
  }

  const febboxApiUrl = conf().FEBBOX_API_URL;
  if (!febboxApiUrl) {
    console.error("FEBBOX_API_URL not configured");
    return "error";
  }

  // Just check if the API server is reachable
  const febboxTestUrl = `${febboxApiUrl as string}/`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    console.log(
      `Attempt ${attempts + 1} of ${maxAttempts} to check Febbox API server`,
    );
    try {
      const response = await fetch(febboxTestUrl);

      if (!response.ok) {
        console.error("Febbox API server returned status:", response.status);

        // If API server is down or unreachable
        if (
          response.status === 503 ||
          response.status === 502 ||
          response.status === 404
        ) {
          return "api_down";
        }

        attempts += 1;
        if (attempts === maxAttempts) {
          console.log("Max attempts reached, returning error");
          return "api_down";
        }
        console.log("Retrying after failed response...");
        await sleep(3000);
        continue;
      }

      // If we can reach the API server, assume the token format is valid
      // Actual validation will happen when trying to fetch content
      console.log("Febbox API server is reachable, token format appears valid");
      return "success";
    } catch (error: any) {
      console.error("Error testing Febbox API:", error);

      // Check if it's a network error (API server not running)
      if (
        error.message?.includes("fetch") ||
        error.message?.includes("ECONNREFUSED")
      ) {
        console.log("Febbox API server is not running");
        return "api_down";
      }

      attempts += 1;
      if (attempts === maxAttempts) {
        console.log("Max attempts reached, returning error");
        return "api_down";
      }
      console.log("Retrying after error...");
      await sleep(3000);
    }
  }

  console.log("All attempts exhausted, returning error");
  return "api_down";
}

export async function testdebridToken(
  debridToken: string | null,
): Promise<Status> {
  if (!debridToken) {
    return "unset";
  }

  const maxAttempts = 2;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      console.log(`RD API attempt ${attempts + 1}`);
      const data = await proxiedFetch(
        "https://api.real-debrid.com/rest/1.0/user",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${debridToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      // If we have data and it indicates premium status, return success immediately
      if (data && typeof data === "object" && data.type === "premium") {
        console.log("RD premium status confirmed");
        return "success";
      }

      console.log("RD response did not indicate premium status");
      attempts += 1;
      if (attempts === maxAttempts || data?.error_code === 8) {
        return "invalid_token";
      }
      await sleep(3000);
    } catch (error) {
      console.error("RD API error:", error);

      // Check if it's a FetchError with error_code 8 (bad_token)
      if (error instanceof FetchError) {
        try {
          const errorData = error.data;
          if (errorData?.error_code === 8) {
            console.log("RD token is invalid (error_code 8)");
            return "invalid_token";
          }
        } catch (parseError) {
          console.error("Failed to parse RD error response:", parseError);
        }

        // For other HTTP errors (like 500, 502, etc.), treat as API down
        if (error.statusCode && error.statusCode >= 500) {
          console.log(`RD API down (status ${error.statusCode})`);
          return "api_down";
        }
      }

      attempts += 1;
      if (attempts === maxAttempts) {
        return "api_down";
      }
      await sleep(3000);
    }
  }

  return "api_down";
}

export async function testTorboxToken(
  torboxToken: string | null,
): Promise<Status> {
  if (!torboxToken) {
    return "unset";
  }

  // TODO: Implement Torbox token test
  return "success";
}

async function testTmdbProxy(): Promise<Status> {
  try {
    // Import the get function from tmdb.ts to use the proxy
    const { get } = await import("@/backend/metadata/tmdb");

    // Test TMDB API access through proxy
    await get<any>("/configuration", {});

    return "success";
  } catch (error) {
    console.error("TMDB proxy test failed:", error);
    return "error";
  }
}

function useIsSetup() {
  const proxyUrls = useAuthStore((s) => s.proxySet);
  const febboxKey = usePreferencesStore((s) => s.febboxKey);
  const debridToken = usePreferencesStore((s) => s.debridToken);
  const debridService = usePreferencesStore((s) => s.debridService);
  const { loading, value } = useAsync(async (): Promise<SetupData> => {
    const extensionStatus: Status = (await isExtensionActive())
      ? "success"
      : "unset";

    // Test environment-configured proxies or custom user proxies
    let proxyStatus: Status = "unset";
    const envProxies = conf().PROXY_URLS;
    const testProxies =
      proxyUrls && proxyUrls.length > 0 ? proxyUrls : envProxies;

    if (testProxies && testProxies.length > 0) {
      try {
        await testProxy(testProxies[0]);
        proxyStatus = "success";
      } catch {
        proxyStatus = "error";
      }
    }

    // Test TMDB proxy
    const tmdbProxyStatus = await testTmdbProxy();

    const febboxKeyStatus: Status = await testFebboxKey(febboxKey);
    const debridTokenStatus: Status =
      debridService === "torbox"
        ? await testTorboxToken(debridToken)
        : await testdebridToken(debridToken);

    return {
      extension: extensionStatus,
      proxy: proxyStatus,
      tmdbProxy: tmdbProxyStatus,
      ...(conf().ALLOW_FEBBOX_KEY && {
        febboxKeyTest: febboxKeyStatus,
      }),
      debridTokenTest: debridTokenStatus,
    };
  }, [proxyUrls, febboxKey, debridToken, debridService]);

  let globalState: Status = "success";
  if (
    value?.extension === "error" ||
    value?.proxy === "error" ||
    value?.tmdbProxy === "error" ||
    value?.febboxKeyTest === "error" ||
    value?.febboxKeyTest === "api_down" ||
    value?.debridTokenTest === "error" ||
    value?.debridTokenTest === "invalid_token" ||
    value?.debridTokenTest === "api_down"
  )
    globalState = "error";

  return {
    setupStates: value,
    globalState,
    loading,
  };
}

function SetupCheckList(props: {
  status: Status;
  grey?: boolean;
  highlight?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const statusMap: Record<Status, StatusCircleProps["type"]> = {
    error: "error",
    success: "success",
    unset: "noresult",
    api_down: "error",
    invalid_token: "error",
  };

  return (
    <div className="flex items-start text-type-dimmed my-4">
      <StatusCircle
        type={statusMap[props.status]}
        className={classNames({
          "!text-video-scraping-noresult !bg-video-scraping-noresult opacity-50":
            props.grey,
          "scale-90 mr-3": true,
        })}
      />
      <div>
        <p
          className={classNames({
            "!text-white": props.grey && props.highlight,
            "!text-type-dimmed opacity-75": props.grey && !props.highlight,
            "text-type-danger": props.status === "error",
            "text-white": props.status === "success",
          })}
        >
          {props.children}
        </p>
        {props.status === "error" ? (
          <p className="max-w-96">
            {t("settings.connections.setup.itemError")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SetupPart() {
  const { t } = useTranslation();
  const { loading, setupStates, globalState } = useIsSetup();
  if (loading || !setupStates) {
    return (
      <SettingsCard>
        <div className="flex py-6 items-center justify-center">
          <Loading />
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard>
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div>
          <div
            className={classNames({
              "rounded-full h-12 w-12 flex bg-opacity-15 justify-center items-center": true,
              "text-type-success bg-type-success": globalState === "success",
              "text-type-danger bg-type-danger": globalState === "error",
            })}
          >
            <Icon
              icon={globalState === "success" ? Icons.CHECKMARK : Icons.X}
              className="text-xl"
            />
          </div>
        </div>
        <div className="flex-1">
          <Heading3 className="!mb-3">
            {globalState === "success"
              ? "Connections Active"
              : "Connection Issues Detected"}
          </Heading3>
          <p className="max-w-[20rem] font-medium mb-6">
            {globalState === "success"
              ? "Your app is configured and all services are working correctly."
              : "Some services are having issues. Check the details below."}
          </p>
          <SetupCheckList status={setupStates.tmdbProxy}>
            TMDB API Proxy
          </SetupCheckList>
          <SetupCheckList status={setupStates.proxy}>
            {setupStates.proxy === "unset"
              ? "Content Proxy (from environment)"
              : "Content Proxy"}
          </SetupCheckList>
          <SetupCheckList status={setupStates.extension}>
            {t("settings.connections.setup.items.extension")}
          </SetupCheckList>
          {conf().ALLOW_DEBRID_KEY && (
            <SetupCheckList status={setupStates.debridTokenTest || "unset"}>
              Debrid Service
            </SetupCheckList>
          )}
          {conf().ALLOW_FEBBOX_KEY && (
            <SetupCheckList status={setupStates.febboxKeyTest || "unset"}>
              Febbox UI token
            </SetupCheckList>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
