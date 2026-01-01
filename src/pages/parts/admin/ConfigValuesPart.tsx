import { ReactNode } from "react";

import { Divider } from "@/components/utils/Divider";
import { Heading2 } from "@/components/utils/Text";
import { conf } from "@/setup/config";

function ConfigValue(props: { name: string; children?: ReactNode }) {
  return (
    <>
      <div className="flex">
        <p className="flex-1 font-bold text-white pr-5">{props.name}</p>
        <p className="break-all text-right text-sm">{props.children}</p>
      </div>
      <Divider marginClass="my-3" />
    </>
  );
}

export function ConfigValuesPart() {
  const config = conf();

  return (
    <>
      <Heading2 className="mb-8 mt-12">Site Constants</Heading2>
      <ConfigValue name="Routing mode">
        {config.NORMAL_ROUTER ? "Normal routing" : "Hash based routing"}
      </ConfigValue>
      <ConfigValue name="Application version">
        v{config.APP_VERSION}
      </ConfigValue>
      <ConfigValue name="Supabase URL">
        {import.meta.env.VITE_SUPABASE_URL || "Not configured"}
      </ConfigValue>
      <ConfigValue name="VidNinja API">
        {import.meta.env.VITE_VIDNINJA_API_URL || "Not configured"}
      </ConfigValue>
      <ConfigValue name="TMDB Proxy">
        {import.meta.env.VITE_TMDB_PROXY_URL || "Not configured"}
      </ConfigValue>
      <ConfigValue name="Worker Proxy">
        {config.PROXY_URLS?.join(", ") || "None configured"}
      </ConfigValue>
    </>
  );
}
