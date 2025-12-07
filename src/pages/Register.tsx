import { useNavigate } from "react-router-dom";

import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { MigrationPart } from "@/pages/parts/migrations/MigrationPart";
import { PageTitle } from "@/pages/parts/util/PageTitle";

export function RegisterPage() {
  return (
    <SubPageLayout>
      <PageTitle subpage k="global.pages.register" />
      <MigrationPart />
    </SubPageLayout>
  );
}
