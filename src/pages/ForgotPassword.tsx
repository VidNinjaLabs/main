import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/buttons/Button";
import { BrandPill } from "@/components/layout/BrandPill";
import {
  LargeCard,
  LargeCardButtons,
  LargeCardText,
} from "@/components/layout/LargeCard";
import { MwLink } from "@/components/text/Link";
import { AuthInputBox } from "@/components/text-inputs/AuthInputBox";
import { useAuthContext } from "@/contexts/AuthContext";
import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { PageTitle } from "@/pages/parts/util/PageTitle";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email) {
        throw new Error("Please enter your email address");
      }

      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SubPageLayout hideSettings hideFooter>
        <PageTitle subpage k="global.pages.forgotPassword" />
        <LargeCard top={<BrandPill backgroundClass="bg-[#161527]" />}>
          <LargeCardText title="Check your email">
            <div className="space-y-4">
              <p>
                We&apos;ve sent a password reset link to{" "}
                <strong>{email}</strong>
              </p>
              <p className="text-gray-400 text-sm">
                Click the link in the email to reset your password.
              </p>
            </div>
          </LargeCardText>
          <LargeCardButtons>
            <Button theme="purple" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </LargeCardButtons>
        </LargeCard>
      </SubPageLayout>
    );
  }

  return (
    <SubPageLayout hideSettings hideFooter>
      <PageTitle subpage k="global.pages.forgotPassword" />
      <LargeCard top={<BrandPill backgroundClass="bg-[#161527]" />}>
        <LargeCardText title="Forgot Password">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </LargeCardText>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInputBox
            label="Email Address"
            value={email}
            autoComplete="email"
            name="email"
            onChange={setEmail}
            placeholder="you@example.com"
          />

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </form>

        <LargeCardButtons>
          <Button
            theme="purple"
            loading={loading}
            onClick={() => handleSubmit()}
          >
            Send Reset Link
          </Button>
        </LargeCardButtons>

        <p className="text-center mt-6">
          <MwLink
            to="/login"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Back to Login
          </MwLink>
        </p>
      </LargeCard>
    </SubPageLayout>
  );
}
