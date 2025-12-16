/* eslint-disable import/no-extraneous-dependencies */
import Hls from "@rev9dev-netizen/vidply.js";
import { t } from "i18next";
import { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";

import { Menu } from "@/components/player/internals/ContextMenu";
import { SelectableLink } from "@/components/player/internals/ContextMenu/Links";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";
import {
  SourceQuality,
  allQualities,
  qualityToString,
} from "@/stores/player/utils/qualities";
import { useQualityStore } from "@/stores/quality";
import { canPlayHlsNatively } from "@/utils/detectFeatures";

function useIsIosHls() {
  const sourceType = usePlayerStore((s) => s.source?.type);
  const result = useMemo(() => {
    const videoEl = document.createElement("video");
    if (sourceType !== "hls") return false;
    if (Hls.isSupported()) return false;
    if (!canPlayHlsNatively(videoEl)) return false;
    return true;
  }, [sourceType]);
  return result;
}

export function QualityView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const isIosHls = useIsIosHls();
  const availableQualities = usePlayerStore((s) => s.qualities);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const switchQuality = usePlayerStore((s) => s.switchQuality);
  const enableAutomaticQuality = usePlayerStore(
    (s) => s.enableAutomaticQuality,
  );
  const setAutomaticQuality = useQualityStore((s) => s.setAutomaticQuality);
  const setLastChosenQuality = useQualityStore((s) => s.setLastChosenQuality);
  const autoQuality = useQualityStore((s) => s.quality.automaticQuality);

  const change = useCallback(
    (q: SourceQuality) => {
      setLastChosenQuality(q);
      setAutomaticQuality(false);
      switchQuality(q);
      router.close();
    },
    [router, switchQuality, setLastChosenQuality, setAutomaticQuality],
  );

  const selectAutomatic = useCallback(() => {
    setAutomaticQuality(true);
    enableAutomaticQuality();
    router.close();
  }, [setAutomaticQuality, enableAutomaticQuality, router]);

  const visibleQualities = allQualities.filter((quality) => {
    if (availableQualities.includes(quality)) return true;
    return false;
  });

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/")}>
        {t("player.menus.quality.title")}
      </Menu.BackLink>
      <Menu.Section className="flex flex-col pb-2 pt-2">
        <SelectableLink selected={autoQuality} onClick={selectAutomatic}>
          Auto
        </SelectableLink>
        {visibleQualities.map((v) => (
          <SelectableLink
            key={v}
            selected={!autoQuality && v === currentQuality}
            onClick={
              availableQualities.includes(v) ? () => change(v) : undefined
            }
            disabled={!availableQualities.includes(v)}
          >
            {qualityToString(v)}
          </SelectableLink>
        ))}
        <Trans
          i18nKey={
            isIosHls
              ? "player.menus.quality.iosNoQuality"
              : "player.menus.quality.hint"
          }
        >
          <Menu.Anchor onClick={() => router.navigate("/source")}>
            text
          </Menu.Anchor>
        </Trans>
      </Menu.Section>
    </>
  );
}
