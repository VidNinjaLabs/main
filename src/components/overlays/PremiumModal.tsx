/* eslint-disable no-alert */
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAsyncFn } from "react-use";

import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { useModal } from "@/components/overlays/Modal";
import { OverlayPortal } from "@/components/overlays/OverlayDisplay";
import { Paragraph } from "@/components/text/Paragraph";
import { Title } from "@/components/text/Title";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { useAuthStore } from "@/stores/auth";
import { useOverlayStack } from "@/stores/interface/overlayStack";

export function PremiumModal(props: { id: string; onClose?: () => void }) {
  const auth = useAuth();
  const backendUrl = useBackendUrl();
  const account = useAuthStore((s) => s.account);
  const modal = useModal(props.id);
  const { modalStack } = useOverlayStack();
  const modalIndex = modalStack.indexOf(props.id);
  const zIndex = modalIndex >= 0 ? 1000 + modalIndex : 999;

  useEffect(() => {
    modal.show();
  }, [modal, modal.show]);

  const handleClose = () => {
    modal.hide();
    props.onClose?.();
  };

  const [loading, createPayment] = useAsyncFn(async () => {
    if (!auth.loggedIn || !backendUrl || !account) {
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/payment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${account.token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Payment creation failed", text);
        alert(`Payment Error: ${text}`);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Payment creation failed", err);
    }
  }, [auth.loggedIn, backendUrl, account]);

  return (
    <OverlayPortal
      darken
      close={handleClose}
      show={modal.isShown}
      zIndex={zIndex}
    >
      <Helmet>
        <html data-no-scroll />
      </Helmet>
      <div className="flex absolute inset-0 items-center justify-center flex-col">
        <div className="flex flex-col items-center space-y-6 p-8 text-center bg-modal-background rounded-xl max-w-[30rem] m-4 pointer-events-auto w-full">
          <Icon icon={Icons.DIAMOND} className="text-6xl text-purple-500" />
          <Title>CloudClash Premium</Title>

          <div className="space-y-4">
            <Paragraph>
              <span className="block text-lg font-bold text-white">
                Unlock the full experience
              </span>
            </Paragraph>
            <ul className="text-left space-y-2 text-type-text">
              <li className="flex items-center space-x-2">
                <Icon icon={Icons.CHECKMARK} className="text-green-500" />
                <span>Ad-free viewing</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon icon={Icons.CHECKMARK} className="text-green-500" />
                <span>Full HD / 4K Quality</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon icon={Icons.CHECKMARK} className="text-green-500" />
                <span>Support the platform</span>
              </li>
            </ul>
          </div>

          <div className="w-full space-y-3">
            {import.meta.env.VITE_ENABLE_PREMIUM !== "true" ? (
              <div className="p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                <p className="text-gray-300">
                  Premium system is currently disabled.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-purple-500/10 border border-purple-500/50 p-4">
                  <p className="text-xl font-bold text-purple-200">
                    $3.00 / month
                  </p>
                  <p className="text-xs text-purple-300">
                    Crypto Payment via Hoodpay
                  </p>
                </div>

                {auth.loggedIn ? (
                  <Button
                    theme="purple"
                    className="w-full justify-center py-3"
                    onClick={() => createPayment()}
                    loading={loading.loading}
                  >
                    Upgrade Now
                  </Button>
                ) : (
                  <Button
                    theme="secondary"
                    className="w-full justify-center py-3"
                    onClick={() => {
                      window.location.href = "/login";
                    }}
                  >
                    Login to Upgrade
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
