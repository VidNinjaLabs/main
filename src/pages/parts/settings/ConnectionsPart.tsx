import { useEffect, useState } from "react";

import { Button } from "@/components/buttons/Button";
import { Toggle } from "@/components/buttons/Toggle";
import { Dropdown } from "@/components/form/Dropdown";
import { Icon, Icons } from "@/components/Icon";
import { SettingsCard } from "@/components/layout/SettingsCard";
import { Modal, ModalCard, useModal } from "@/components/overlays/Modal";
import {
  StatusCircle,
  StatusCircleProps,
} from "@/components/player/internals/StatusCircle";
import { MwLink } from "@/components/text/Link";
import { AuthInputBox } from "@/components/text-inputs/AuthInputBox";
import { Divider } from "@/components/utils/Divider";
import { Heading1, Heading2, Paragraph } from "@/components/utils/Text";
import { RegionSelectorPart } from "@/pages/parts/settings/RegionSelectorPart";
import {
  Status,
  testFebboxKey,
  testTorboxToken,
  testdebridToken,
} from "@/pages/parts/settings/SetupPart";
import { Trans, useTranslation } from "react-i18next";

const StatusMap: Record<Status, StatusCircleProps["type"]> = {
  error: "error",
  success: "success",
  unset: "noresult",
  api_down: "error",
  invalid_token: "error",
};

async function getFebboxKeyStatus(febboxKey: string | null) {
  if (febboxKey) {
    const status: Status = await testFebboxKey(febboxKey);
    return status;
  }
  return "unset";
}

export function FebboxSetup(props: {
  febboxKey: string | null;
  setFebboxKey: (value: string | null) => void;
}) {
  const { t } = useTranslation();
  const [showInstructions, setShowInstructions] = useState(false);
  const exampleModal = useModal("febbox-example");
  // Always visible/expanded for now as requested
  const isFebboxVisible = true;
  const isFebboxExpanded = true;

  const [status, setStatus] = useState<Status>("unset");

  useEffect(() => {
    const checkTokenStatus = async () => {
      const result = await getFebboxKeyStatus(props.febboxKey);
      setStatus(result);
    };
    checkTokenStatus();
  }, [props.febboxKey]);

  return (
    <>
      <SettingsCard>
        <div className="flex justify-between items-center gap-4">
          <div className="my-3">
            <p className="text-white font-bold mb-3">
              {t("fedapi.onboarding.title")}
            </p>
            <p className="max-w-[30rem] font-medium">
              <Trans i18nKey="fedapi.onboarding.description" />
            </p>
          </div>
          <div>
            <Toggle
              onClick={() => {}} // No-op, always enabled as per image/request context
              enabled={isFebboxExpanded}
            />
          </div>
        </div>
        {isFebboxVisible ? (
          <>
            <Divider marginClass="my-6 px-8 box-content -mx-8" />
            <div className="my-3">
              <div
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <p className="max-w-[30rem] font-medium text-white">
                  {t("fedapi.setup.title")}
                </p>
                {showInstructions ? (
                  <Icon icon={Icons.CHEVRON_UP} />
                ) : (
                  <Icon icon={Icons.CHEVRON_DOWN} />
                )}
              </div>

              {showInstructions && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="relative pt-[56.25%] mb-4">
                    <iframe
                      src="https://player.vimeo.com/video/1059834885?h=c3ab398d42&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                      className="absolute top-0 left-0 w-full h-full border border-type-secondary rounded-lg bg-black"
                      title="VidNinja FED API Setup Tutorial"
                    />
                  </div>
                  <p className="max-w-[30rem] font-medium space-y-2">
                    <Trans i18nKey="fedapi.setup.step.1">
                      <MwLink url="https://febbox.com" />
                    </Trans>
                    <br />
                    <Trans i18nKey="fedapi.setup.step.2" />
                    <br />
                    <Trans i18nKey="fedapi.setup.step.3" />
                    <br />
                    <Trans i18nKey="fedapi.setup.step.4" />{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        exampleModal.show();
                      }}
                      className="text-type-link hover:text-type-linkHover"
                    >
                      <Trans i18nKey="fedapi.setup.tokenExample.button" />
                    </button>
                    <br />
                    <Trans i18nKey="fedapi.setup.step.5" />
                  </p>
                  <p className="text-type-danger mt-2">
                    <Trans i18nKey="fedapi.setup.step.warning" />
                  </p>
                </div>
              )}
            </div>
            <Divider marginClass="my-6 px-8 box-content -mx-8" />
            <p className="text-white font-bold mb-3">
              {t("fedapi.setup.tokenLabel")}
            </p>
            <div className="flex md:flex-row flex-col items-center w-full gap-4">
              <div className="flex items-center w-full">
                <StatusCircle type={StatusMap[status]} className="mx-2" />
                <AuthInputBox
                  onChange={(newToken) => {
                    props.setFebboxKey(newToken);
                  }}
                  value={props.febboxKey ?? ""}
                  placeholder="eyJ0eXAi..."
                  passwordToggleable
                  className="flex-grow"
                />
              </div>
              <div className="flex items-center">
                <RegionSelectorPart />
              </div>
            </div>
          </>
        ) : null}
      </SettingsCard>
      <Modal id={exampleModal.id}>
        <ModalCard>
          <Heading2 className="!mt-0 !mb-4 !text-2xl">
            {t("fedapi.setup.tokenExample.title")}
          </Heading2>
          <Paragraph className="!mt-1 !mb-6">
            {t("fedapi.setup.tokenExample.description")}
          </Paragraph>
          <div className="bg-authentication-inputBg p-4 rounded-lg mb-6 font-mono text-sm break-all">
            eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDc1MTI2MTksIm5iZiI6MTc0NzUxMjYxOSwiZXhwIjoxNzc4NjE2NjM5LCJkYXRhIjp7InVpZCI6NTI1NTc3LCsudujeI6IjE4NTQ4NmEwMzBjMGNlMWJjY2IzYWJjMjI2OTYwYzQ4dhdhs.qkuTF2aVPu54S0RFJS_ca7rlHuGz_Fe6kWkBydYQoCg
          </div>
          <Paragraph className="!mt-1 !mb-6 text-type-danger">
            {t("fedapi.setup.tokenExample.warning")}
          </Paragraph>
          <div className="flex justify-end">
            <Button theme="secondary" onClick={exampleModal.hide}>
              {t("fedapi.setup.tokenExample.close")}
            </Button>
          </div>
        </ModalCard>
      </Modal>
    </>
  );
}

async function getDebridStatus(token: string | null, service: string) {
  if (token) {
    let status: Status = "unset";
    if (service === "realdebrid") {
      status = await testdebridToken(token);
    } else if (service === "torbox") {
      status = await testTorboxToken(token);
    }
    return status;
  }
  return "unset";
}

export function DebridEdit(props: {
  debridToken: string | null;
  setdebridToken: (value: string | null) => void;
  debridService: string;
  setdebridService: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("unset");

  useEffect(() => {
    const checkTokenStatus = async () => {
      const result = await getDebridStatus(
        props.debridToken,
        props.debridService,
      );
      setStatus(result);
    };
    checkTokenStatus();
  }, [props.debridToken, props.debridService]);

  const serviceOptions = [
    { id: "realdebrid", name: "Real-Debrid" },
    { id: "torbox", name: "Torbox" },
  ];

  return (
    <SettingsCard>
      <div className="flex flex-col gap-3">
        <p className="text-white font-bold">
          {t("settings.connections.debrid.title")} (Beta)
        </p>
        <p className="max-w-[30rem] font-medium text-type-secondary">
          <Trans
            i18nKey="settings.connections.debrid.description"
            components={[
              <MwLink url="https://real-debrid.com" />,
              <MwLink url="https://torbox.app" />,
            ]}
          />
        </p>
        <Divider marginClass="my-4" />
        <div className="flex md:flex-row flex-col items-center w-full gap-4">
          <div className="flex items-center w-full">
            <StatusCircle type={StatusMap[status]} className="mx-2" />
            <AuthInputBox
              onChange={(newToken) => {
                props.setdebridToken(newToken);
              }}
              value={props.debridToken ?? ""}
              passwordToggleable
              placeholder="Token"
              className="flex-grow"
            />
          </div>
          <div className="w-full md:w-auto">
            <Dropdown
              options={serviceOptions}
              selectedItem={
                serviceOptions.find((o) => o.id === props.debridService) ||
                serviceOptions[0]
              }
              setSelectedItem={(item) => props.setdebridService(item.id)}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

interface ConnectionsPartProps {
  // Debrid Props
  debridToken: string | null;
  setdebridToken: (v: string | null) => void;
  debridService: string;
  setdebridService: (v: string) => void;
}

export function ConnectionsPart(props: ConnectionsPartProps) {
  const { t } = useTranslation();

  return (
    <div>
      <Heading1 border>{t("settings.connections.title")}</Heading1>
      <div className="space-y-6 mt-8">
        <DebridEdit
          debridToken={props.debridToken}
          setdebridToken={props.setdebridToken}
          debridService={props.debridService}
          setdebridService={props.setdebridService}
        />
      </div>
    </div>
  );
}
