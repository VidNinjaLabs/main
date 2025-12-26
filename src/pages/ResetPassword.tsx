import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/buttons/Button";
import { BrandPill } from "@/components/layout/BrandPill";
import {
  LargeCard,
  LargeCardButtons,
  LargeCardText,
} from "@/components/layout/LargeCard";
import { AuthInputBox } from "@/components/text-inputs/AuthInputBox";
import { useAuthContext } from "@/contexts/AuthContext";
import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { PageTitle } from "@/pages/parts/util/PageTitle";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!password || !confirmPassword) {
        throw new Error("Please fill in all fields");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      await updatePassword(password);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SubPageLayout hideSettings hideFooter>
        <PageTitle subpage k="global.pages.resetPassword" />
        <LargeCard top={<BrandPill backgroundClass="bg-[#161527]" />}>
          <LargeCardText title="Password Updated">
            <p className="text-center">
              Your password has been successfully updated. Redirecting to
              login...
            </p>
          </LargeCardText>
        </LargeCard>
      </SubPageLayout>
    );
  }

  return (
    <SubPageLayout hideSettings hideFooter>
      <PageTitle subpage k="global.pages.resetPassword" />
      <LargeCard top={<BrandPill backgroundClass="bg-[#161527]" />}>
        <LargeCardText title="Reset Password">
          Enter your new password below
        </LargeCardText>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInputBox
            label="New Password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            passwordToggleable
            autoComplete="new-password"
          />
          <AuthInputBox
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            passwordToggleable
            autoComplete="new-password"
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
            Update Password
          </Button>
        </LargeCardButtons>
      </LargeCard>
    </SubPageLayout>
  );
}
