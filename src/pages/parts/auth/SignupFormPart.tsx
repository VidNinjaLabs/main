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

interface SignupFormPartProps {
  onSignup?: () => void;
}

export function SignupFormPart(props: SignupFormPartProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { signup } = useAuthContext();

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
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

      // Check Turnstile token if enabled
      if (turnstileSiteKey && !turnstileToken) {
        throw new Error("Please complete the security check");
      }

      // Call signup API
      await signup(email, password, turnstileToken || undefined);

      // Success - call onSignup callback
      props.onSignup?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

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
          placeholder="your@email.com"
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
        {turnstileSiteKey && (
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
