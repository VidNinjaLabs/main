/* eslint-disable no-console */
import classNames from "classnames";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useAsync } from "react-use";
import type { AsyncReturnType } from "type-fest";

import { fetchMetadata } from "@/backend/api/metadata";
import { isAllowedExtensionVersion } from "@/backend/extension/compatibility";
import { extensionInfo, sendPage } from "@/backend/extension/messaging";
import { DetailedMeta, getMetaFromId } from "@/backend/metadata/getmeta";
import { decodeTMDBId } from "@/backend/metadata/tmdb";
import { MWMediaType } from "@/backend/metadata/types/mw";
import { Button } from "@/components/buttons/Button";
import { Icons } from "@/components/Icon";
import { IconPill } from "@/components/layout/IconPill";
import { Loading } from "@/components/layout/Loading";
import { Paragraph } from "@/components/text/Paragraph";
import { Title } from "@/components/text/Title";
import { ErrorContainer, ErrorLayout } from "@/pages/layouts/ErrorLayout";
import { conf } from "@/setup/config";

export interface MetaPartProps {
  onGetMeta?: (meta: DetailedMeta, episodeId?: string) => void;
  onBackdropLoaded?: (backdropUrl: string) => void;
  backdropUrl?: string | null;
  media?: string;
  season?: string;
  episode?: string;
}

function isDisallowedMedia(id: string, type: MWMediaType): boolean {
  const disallowedEntries = conf().DISALLOWED_IDS.map((v) => v.split("-"));
  if (disallowedEntries.find((entry) => id === entry[1] && type === entry[0]))
    return true;
  return false;
}

export function MetaPart(props: MetaPartProps) {
  const { t } = useTranslation();
  const routeParams = useParams<{
    media: string;
    episode?: string;
    season?: string;
  }>();
  const params = {
    media: props.media ?? routeParams.media,
    season: props.season ?? routeParams.season,
    episode: props.episode ?? routeParams.episode,
  };
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  const { error, value, loading } = useAsync(async () => {
    const info = await extensionInfo();
    const isValidExtension =
      info?.success && isAllowedExtensionVersion(info.version) && info.allowed;

    if (isValidExtension) {
      if (!info.hasPermission) throw new Error("extension-no-permission");
    }

    // Fetch VidNinja API metadata
    try {
      await fetchMetadata();
    } catch (err) {
      console.error("Failed to fetch VidNinja metadata:", err);
      // Continue anyway - metadata is cached after first fetch
    }

    // get media meta data
    let data: ReturnType<typeof decodeTMDBId> = null;
    try {
      if (!params.media) throw new Error("no media params");
      data = decodeTMDBId(params.media);
    } catch {
      // error dont matter, itll just be a 404
    }
    if (!data) return null;

    if (isDisallowedMedia(data.id, data.type)) throw new Error("legal");

    let meta: AsyncReturnType<typeof getMetaFromId> = null;
    try {
      meta = await getMetaFromId(data.type, data.id, params.season);
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
    if (!meta) return null;

    // Preload backdrop image to make the transition to scraping screen smoother
    if (meta.meta.backdrop) {
      const img = new Image();
      img.src = meta.meta.backdrop;
    }

    // replace link with new link if youre not already on the right link
    let epId = params.episode;
    if (meta.meta.type === MWMediaType.SERIES) {
      let ep = meta.meta.seasonData.episodes.find(
        (v) => v.id === params.episode,
      );
      if (!ep) ep = meta.meta.seasonData.episodes[0];
      epId = ep.id;
      if (
        params.season !== meta.meta.seasonData.id ||
        params.episode !== ep.id
      ) {
        navigate(`/media/${params.media}/${meta.meta.seasonData.id}/${ep.id}`, {
          replace: true,
        });
      }
    }

    // Pass backdrop to parent immediately - BEFORE changing status
    if (meta.meta.backdrop) {
      props.onBackdropLoaded?.(meta.meta.backdrop);
    }

    props.onGetMeta?.(meta, epId);

    // Return meta to make it available for backdrop display
    return meta;
  }, []);

  if (error && error.message === "extension-no-permission") {
    return (
      <ErrorLayout>
        <ErrorContainer>
          <IconPill icon={Icons.WAND}>
            {t("player.metadata.extensionPermission.badge")}
          </IconPill>
          <Title>{t("player.metadata.extensionPermission.title")}</Title>
          <Paragraph>{t("player.metadata.extensionPermission.text")}</Paragraph>
          <Button
            onClick={() => {
              sendPage({
                page: "PermissionGrant",
                redirectUrl: window.location.href,
              });
            }}
            theme="purple"
            padding="md:px-12 p-2.5"
            className="mt-6"
          >
            {t("player.metadata.extensionPermission.button")}
          </Button>
        </ErrorContainer>
      </ErrorLayout>
    );
  }

  if (error && error.message === "legal") {
    return (
      <ErrorLayout>
        <ErrorContainer>
          <IconPill icon={Icons.DRAGON}>
            {t("player.metadata.legal.badge")}
          </IconPill>
          <Title>{t("player.metadata.legal.title")}</Title>
          <Paragraph>{t("player.metadata.legal.text")}</Paragraph>
          <Button
            href="/"
            theme="purple"
            padding="md:px-12 p-2.5"
            className="mt-6"
          >
            {t("player.metadata.failed.homeButton")}
          </Button>
        </ErrorContainer>
      </ErrorLayout>
    );
  }

  if (error && error.message === "failed-api-metadata") {
    return (
      <ErrorLayout>
        <ErrorContainer>
          <IconPill icon={Icons.WAND}>
            {t("player.metadata.failed.badge")}
          </IconPill>
          <Title>{t("player.metadata.api.text")}</Title>
          <Paragraph>{t("player.metadata.api.title")}</Paragraph>
          <Button
            href="/"
            theme="purple"
            padding="md:px-12 p-2.5"
            className="mt-6"
          >
            {t("player.metadata.failed.homeButton")}
          </Button>
        </ErrorContainer>
      </ErrorLayout>
    );
  }

  if (error) {
    return (
      <ErrorLayout>
        <ErrorContainer>
          <IconPill icon={Icons.WAND}>
            {t("player.metadata.failed.badge")}
          </IconPill>
          <Title>{t("player.metadata.failed.title")}</Title>
          <Paragraph>{t("player.metadata.failed.text")}</Paragraph>
          <Button
            href="/"
            theme="purple"
            padding="md:px-12 p-2.5"
            className="mt-6"
          >
            {t("player.metadata.failed.homeButton")}
          </Button>
        </ErrorContainer>
      </ErrorLayout>
    );
  }

  if (!value && !loading) {
    return (
      <ErrorLayout>
        <ErrorContainer>
          <IconPill icon={Icons.WAND}>
            {t("player.metadata.notFound.badge")}
          </IconPill>
          <Title>{t("player.metadata.notFound.title")}</Title>
          <Paragraph>{t("player.metadata.notFound.text")}</Paragraph>
          <Button
            href="/"
            theme="purple"
            padding="md:px-12 p-2.5"
            className="mt-6"
          >
            {t("player.metadata.notFound.homeButton")}
          </Button>
        </ErrorContainer>
      </ErrorLayout>
    );
  }

  return (
    <div className="h-full w-full relative flex items-center justify-center">
      {/* Backdrop Image */}
      {props.backdropUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={props.backdropUrl}
            className={classNames(
              "absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-opacity duration-300",
              imageLoaded ? "opacity-30" : "opacity-0",
            )}
            onLoad={() => setImageLoaded(true)}
            alt=""
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="mb-8 scale-150">
          <Loading />
        </div>
      </div>
    </div>
  );
}
