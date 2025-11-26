import type { VidNinjaStream } from "@/backend/api/types";
import { RULE_IDS, setDomainRule } from "@/backend/extension/messaging";

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

function extractDomainsFromStream(stream: VidNinjaStream): string[] {
  if (stream.type === "hls") {
    return [extractDomain(stream.playlist)].filter((v): v is string => !!v);
  }
  if (stream.type === "file" && stream.qualities) {
    return Object.values(stream.qualities)
      .map((v) => extractDomain(v.url))
      .filter((v): v is string => !!v);
  }
  return [];
}

function buildHeadersFromStream(
  stream: VidNinjaStream,
): Record<string, string> {
  const headers: Record<string, string> = {};
  Object.entries(stream.headers ?? {}).forEach((entry) => {
    headers[entry[0]] = entry[1];
  });
  return headers;
}

export async function prepareStream(stream: VidNinjaStream) {
  await setDomainRule({
    ruleId: RULE_IDS.PREPARE_STREAM,
    targetDomains: extractDomainsFromStream(stream),
    requestHeaders: buildHeadersFromStream(stream),
  });
}
