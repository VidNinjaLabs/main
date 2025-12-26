/* eslint-disable react/no-unused-prop-types */
/* eslint-disable import/no-extraneous-dependencies */
import { FormEvent, useState } from "react";
import { Trans } from "react-i18next";
import Turnstile from "react-turnstile";

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
import { useConfig } from "@/hooks/useConfig";

interface SignupFormPartProps {
  onSignup?: () => void;
}

export function SignupFormPart(props: SignupFormPartProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { signup } = useAuthContext();
  const { config } = useConfig();

  const turnstileSiteKey = config?.turnstileSiteKey || "";

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password || !confirmPassword) {
        throw new Error("Please fill in all fields");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      // Check Turnstile token if enabled (only in production)
      if (import.meta.env.PROD && turnstileSiteKey && !turnstileToken) {
        throw new Error("Please complete the security check");
      }

      // Call Supabase signup
      await signup(email, password);

      // Success - show verification message
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <LargeCard top={<BrandPill backgroundClass="bg-[#161527]" />}>
        <LargeCardText title="Check your email">
          <div className="space-y-4">
            <p>
              We&apos;ve sent a verification link to <strong>{email}</strong>
            </p>
            <p className="text-gray-400 text-sm">
              Click the link in the email to verify your account and complete
              signup.
            </p>
          </div>
        </LargeCardText>
        <LargeCardButtons>
          <MwLink to="/login">
            <Button theme="purple">Go to Login</Button>
          </MwLink>
        </LargeCardButtons>
      </LargeCard>
    );
  }

  return (
    <LargeCard top={<BrandPill backgroundClass="bg-[#161527]" />}>
      <LargeCardText title="Create your account">
        Sign up with your email and password
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
        <AuthInputBox
          label="Password"
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

        {/* Cloudflare Turnstile - Only in production */}
        {import.meta.env.PROD && turnstileSiteKey && (
          <div className="flex justify-center py-2">
            <Turnstile
              sitekey={turnstileSiteKey}
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              theme="dark"
            />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </form>

      <LargeCardButtons>
        <Button theme="purple" loading={loading} onClick={() => handleSubmit()}>
          Create Account
        </Button>
      </LargeCardButtons>
      <p className="text-center mt-6">
        <Trans i18nKey="auth.hasAccount">
          Already have an account? <MwLink to="/login">Login here.</MwLink>
        </Trans>
      </p>
    </LargeCard>
  );
}
