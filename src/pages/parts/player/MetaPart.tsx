/* eslint-disable no-inner-declarations */
/* eslint-disable no-console */
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAsync } from "react-use";
import type { AsyncReturnType } from "type-fest";

import { fetchMetadata } from "@/backend/api/metadata";
import { DetailedMeta, getMetaFromId } from "@/backend/metadata/getmeta";
import { decodeTMDBId } from "@/backend/metadata/tmdb";
import { MWMediaMeta, MWMediaType } from "@/backend/metadata/types/mw";
import { Button } from "@/components/buttons/Button";
import { Icons } from "@/components/Icon";
import { IconPill } from "@/components/layout/IconPill";
import { Loading } from "@/components/layout/Loading";
import { Paragraph } from "@/components/text/Paragraph";
import { Title } from "@/components/text/Title";
import { ErrorContainer, ErrorLayout } from "@/pages/layouts/ErrorLayout";
import { conf } from "@/setup/config";
import { useTranslation } from "react-i18next";

export interface MetaPartProps {
  onGetMeta?: (meta: DetailedMeta, episodeId?: string) => void;
  onBackdropLoaded?: (backdropUrl: string) => void;
  backdropUrl?: string | null;
  posterUrl?: string | null;
  media?: string;
  season?: string;
  episode?: string;
  initialMeta?: MWMediaMeta | null;
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
  // Optimize: If backdrop provided via props, assume loaded/cached to avoid flash/fade-in
  const [imageLoaded, setImageLoaded] = useState(!!props.backdropUrl);
  const backdropRef = useRef<HTMLImageElement>(null);
  const inflightRef = useRef<string | null>(null);

  useEffect(() => {
    if (backdropRef.current?.complete) {
      setImageLoaded(true);
    }
  }, []);

  const { error, value, loading } = useAsync(async () => {
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

    // Deduplication: If we are already fetching this ID, skip
    // This handles double-mount in Strict Mode or re-renders
    const requestId = `${data.type}:${data.id}:${params.season || ""}:${params.episode || ""}`;
    if (inflightRef.current === requestId) {
      // console.log("Skipping duplicate metadata fetch:", requestId);
      return null;
    }
    inflightRef.current = requestId;

    // Optimization: Use passed metadata if available (Movies only or complete Shows)
    if (
      props.initialMeta &&
      props.initialMeta.id === data.id &&
      props.initialMeta.type === data.type
    ) {
      if (data.type === MWMediaType.MOVIE) {
        const meta: DetailedMeta = {
          meta: props.initialMeta,
          tmdbId: data.id,
        };
        // Only load backdrop if we don't have one
        if (meta.meta.backdrop && !props.backdropUrl) {
          props.onBackdropLoaded?.(meta.meta.backdrop);
        }
        props.onGetMeta?.(meta, undefined);
        return meta;
      }
    }

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
    // Only update if we don't have one already (prevents flicker)
    if (meta.meta.backdrop && !props.backdropUrl) {
      props.onBackdropLoaded?.(meta.meta.backdrop);
    }

    props.onGetMeta?.(meta, epId);

    // Return meta to make it available for backdrop display
    return meta;
  }, []);

  if (error && error.message === "extension-no-permission") {
    function sendPage(_arg0: { page: string; redirectUrl: string }) {
      throw new Error("Function not implemented.");
    }

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
      {/* Background Images */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Poster Fallback */}
        {props.posterUrl && (
          <img
            src={props.posterUrl}
            className={classNames(
              "absolute inset-0 w-full h-full object-cover scale-110",
              // If backdrop is loaded, fade out poster
              imageLoaded
                ? "opacity-0 transition-opacity duration-500"
                : "opacity-30",
            )}
            alt=""
            key="poster"
          />
        )}

        {/* Backdrop Image */}
        {props.backdropUrl && (
          <img
            ref={backdropRef}
            src={props.backdropUrl}
            className={classNames(
              "absolute inset-0 w-full h-full object-cover scale-110",
              // If cached/loaded, show immediately. If loading, fade in.
              imageLoaded
                ? "opacity-30"
                : "opacity-0 transition-opacity duration-500",
            )}
            // Ensure we handle verify loading state ref if provided prop changes
            onLoad={() => setImageLoaded(true)}
            alt=""
            key="backdrop"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="mb-8 scale-250">
          <Loading />
        </div>
      </div>
    </div>
  );
}
