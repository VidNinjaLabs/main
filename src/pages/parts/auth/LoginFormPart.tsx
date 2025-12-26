/* eslint-disable import/no-extraneous-dependencies */
import { FormEvent, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
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

interface LoginFormPartProps {
  onLogin?: () => void;
}

export function LoginFormPart(props: LoginFormPartProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { t } = useTranslation();
  const { login } = useAuthContext();
  const { config } = useConfig();

  const turnstileSiteKey = config?.turnstileSiteKey || "";

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error(
          t("auth.login.validationError") ?? "Please fill in all fields",
        );
      }

      // Check Turnstile token if enabled (only in production)
      if (import.meta.env.PROD && turnstileSiteKey && !turnstileToken) {
        throw new Error("Please complete the security check");
      }

      // Call Supabase login (Turnstile verification would need backend integration)
      await login(email, password);

      // Success - call onLogin callback
      props.onLogin?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LargeCard top={<BrandPill backgroundClass="bg-[#161527]" />}>
      <LargeCardText title={t("auth.login.title")}>
        Sign in to access your account
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
          placeholder="Enter your password"
          passwordToggleable
          autoComplete="current-password"
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
          {t("auth.login.submit")}
        </Button>
      </LargeCardButtons>

      <div className="space-y-3 mt-6">
        <p className="text-center">
          <Trans i18nKey="auth.createAccount">
            <MwLink to="/signup">.</MwLink>
          </Trans>
        </p>
        <p className="text-center">
          <MwLink
            to="/forgot-password"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Forgot your password?
          </MwLink>
        </p>
      </div>
    </LargeCard>
  );
}
