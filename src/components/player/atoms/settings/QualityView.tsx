/* eslint-disable import/no-extraneous-dependencies */
import Hls from "@rev9dev-netizen/vidply.js";
import { useCallback, useMemo } from "react";

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
import { useTranslation } from "react-i18next";

export function QualityView({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
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
      </Menu.Section>
    </>
  );
}
