import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { BrandPill } from "@/components/layout/BrandPill";
import { Loading } from "@/components/layout/Loading";
import { useMigration } from "@/hooks/auth/useMigration";
import { BlurEllipsis } from "@/pages/layouts/SubPageLayout";
import { conf } from "@/setup/config";

export function MigrationPart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { migrate } = useMigration();
  const [status, setStatus] = useState<"idle" | "migrating" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function startMigration() {
      const backendUrl = conf().BACKEND_URL;
      
      if (!backendUrl) {
        setStatus("error");
        setErrorMessage("Backend URL not configured");
        return;
      }

      try {
        setStatus("migrating");
        await migrate(backendUrl);
        setStatus("success");
        
        // Redirect to home after successful migration
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error) {
        console.error("Migration error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Migration failed");
      }
    }

    if (status === "idle") {
      startMigration();
    }
  }, [status, migrate, navigate]);

  return (
    <div className="flex flex-col justify-center items-center h-screen text-center font-medium">
      {/* Overlaid elements */}
      <BlurEllipsis />
      <div className="right-[calc(2rem+env(safe-area-inset-right))] top-6 absolute">
        <BrandPill />
      </div>

      {/* Content */}
      {status === "migrating" && (
        <>
          <Loading />
          <p className="max-w-[19rem] mt-3 mb-12 text-type-secondary">
            {t("screens.migration.inProgress")}
          </p>
        </>
      )}
      
      {status === "success" && (
        <>
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <p className="max-w-[19rem] mt-3 mb-12 text-type-secondary">
            Migration successful! Redirecting...
          </p>
        </>
      )}
      
      {status === "error" && (
        <>
          <div className="text-red-500 text-6xl mb-4">✗</div>
          <p className="max-w-[19rem] mt-3 mb-12 text-red-500">
            {errorMessage}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-purple-500 rounded-lg hover:bg-purple-600"
          >
            Go Home
          </button>
        </>
      )}
    </div>
  );
}
