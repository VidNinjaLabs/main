import { useCallback, useState } from "react";

import { Button } from "@/components/buttons/Button";
import { ThinContainer } from "@/components/layout/ThinContainer";
import { Heading1, Paragraph } from "@/components/utils/Text";
import { Transition } from "@/components/utils/Transition";
import { useEmbedOrderState } from "@/hooks/useEmbedOrderState";
import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { BackendTestPart } from "@/pages/parts/admin/BackendTestPart";
import { ConfigValuesPart } from "@/pages/parts/admin/ConfigValuesPart";
import { EmbedOrderPart } from "@/pages/parts/admin/EmbedOrderPart";
import { M3U8TestPart } from "@/pages/parts/admin/M3U8TestPart";
import { WorkerTestPart } from "@/pages/parts/admin/WorkerTestPart";
import { useTranslation } from "react-i18next";

export function AdminPage() {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const embedOrderState = useEmbedOrderState();

  const handleSaveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      await embedOrderState.saveChanges();
    } catch (error) {
      console.error("Failed to save embed order changes:", error);
    } finally {
      setIsSaving(false);
    }
  }, [embedOrderState]);

  return (
    <SubPageLayout>
      <ThinContainer>
        <Heading1>Admin tools</Heading1>

        <ConfigValuesPart />
        <BackendTestPart />
        <WorkerTestPart />
        <M3U8TestPart />
        <EmbedOrderPart
          embedOrder={embedOrderState.embedOrder}
          setEmbedOrder={embedOrderState.setEmbedOrder}
          enableEmbedOrder={embedOrderState.enableEmbedOrder}
          setEnableEmbedOrder={embedOrderState.setEnableEmbedOrder}
          disabledEmbeds={embedOrderState.disabledEmbeds}
          setDisabledEmbeds={embedOrderState.setDisabledEmbeds}
        />
        {/* <ProgressCleanupPart /> */}
      </ThinContainer>

      <Transition
        animation="fade"
        show={embedOrderState.hasChanges}
        className="bg-settings-saveBar-background border-t border-settings-card-border/50 py-4 transition-opacity w-full fixed bottom-0 flex justify-between flex-col md:flex-row px-8 items-start md:items-center gap-3 z-[999]"
      >
        <p className="text-type-danger">{t("settings.unsaved")}</p>
        <div className="space-x-3 w-full md:w-auto flex">
          <Button
            className="w-full md:w-auto"
            theme="secondary"
            onClick={embedOrderState.reset}
          >
            {t("settings.reset")}
          </Button>
          <Button
            className="w-full md:w-auto"
            theme="purple"
            loading={isSaving}
            onClick={handleSaveChanges}
          >
            {t("settings.save")}
          </Button>
        </div>
      </Transition>
    </SubPageLayout>
  );
}
