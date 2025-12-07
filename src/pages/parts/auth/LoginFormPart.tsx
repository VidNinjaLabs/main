/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-promise-executor-return */
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

      // Call login API
      await login(email, password, turnstileToken || undefined);

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
        Sign in with your email and password
      </LargeCardText>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInputBox
          label="Email Address"
          value={email}
          autoComplete="email"
          name="email"
          onChange={setEmail}
          placeholder="admin@cloudclash.local"
        />
        <AuthInputBox
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          passwordToggleable
          autoComplete="current-password"
        />
        {turnstileSiteKey && import.meta.env.PROD && (
          <div className="flex justify-center">
            <Turnstile
              sitekey={turnstileSiteKey}
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              theme="dark"
            />
          </div>
        )}
        {error && <p className="text-authentication-errorText">{error}</p>}
      </form>

      <LargeCardButtons>
        <Button theme="purple" loading={loading} onClick={() => handleSubmit()}>
          {t("auth.login.submit")}
        </Button>
      </LargeCardButtons>
      <p className="text-center mt-6">
        <Trans i18nKey="auth.createAccount">
          <MwLink to="/register">.</MwLink>
        </Trans>
      </p>
    </LargeCard>
  );
}
