import { useNavigate } from "react-router-dom";

import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { SignupFormPart } from "@/pages/parts/auth/SignupFormPart";
import { PageTitle } from "@/pages/parts/util/PageTitle";

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <SubPageLayout hideSettings hideFooter>
      <PageTitle subpage k="global.pages.register" />
      <SignupFormPart
        onSignup={() => {
          navigate("/");
        }}
      />
    </SubPageLayout>
  );
}
