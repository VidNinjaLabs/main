/* eslint-disable react-hooks/rules-of-hooks */
import classNames from "classnames";
import {
  LogIn,
  LogOut,
  LucideIcon as LucideIconType,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { base64ToBuffer, decryptData } from "@/backend/accounts/crypto";
import { UserAvatar } from "@/components/Avatar";
import { Icon, Icons } from "@/components/Icon";
import { LucideIcon } from "@/components/LucideIcon";
import { Transition } from "@/components/utils/Transition";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAuthStore } from "@/stores/auth";
import { useTranslation } from "react-i18next";

function Divider() {
  return <hr className="border-0 w-full h-px bg-dropdown-border" />;
}

function GoToLink(props: {
  children: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();

  const goTo = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank");
    } else {
      window.scrollTo(0, 0);
      navigate(href);
    }
  };

  return (
    <a
      tabIndex={0}
      href={props.href}
      onClick={(evt) => {
        evt.preventDefault();
        if (props.href) goTo(props.href);
        else props.onClick?.();
      }}
      className={props.className}
    >
      {props.children}
    </a>
  );
}

function DropdownLink(props: {
  children: React.ReactNode;
  href?: string;
  icon?: Icons | LucideIconType;
  highlight?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <GoToLink
      onClick={props.onClick}
      href={props.href}
      className={classNames(
        "tabbable cursor-pointer flex gap-3 items-center m-3 p-1 rounded font-medium transition-colors duration-100",
        props.highlight
          ? "text-dropdown-highlight hover:text-dropdown-highlightHover"
          : "text-dropdown-text hover:text-white",
        props.className,
      )}
    >
      {props.icon ? (
        typeof props.icon === "string" ? (
          <Icon icon={props.icon as Icons} className="text-xl" />
        ) : (
          <LucideIcon icon={props.icon as LucideIconType} className="text-xl" />
        )
      ) : null}
      {props.children}
    </GoToLink>
  );
}

function CircleDropdownLink(props: {
  icon: Icons | LucideIconType;
  href: string;
}) {
  return (
    <GoToLink
      href={props.href}
      onClick={() => window.scrollTo(0, 0)}
      className="tabbable w-11 h-11 rounded-full bg-dropdown-contentBackground text-dropdown-text hover:text-white transition-colors duration-100 flex justify-center items-center"
    >
      {typeof props.icon === "string" ? (
        <Icon className="text-2xl" icon={props.icon as Icons} />
      ) : (
        <LucideIcon className="text-2xl" icon={props.icon as LucideIconType} />
      )}
    </GoToLink>
  );
}

export function LinksDropdown(props: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const deviceName = useAuthStore((s) => s.account?.deviceName);
  const seed = useAuthStore((s) => s.account?.seed);
  const bufferSeed = useMemo(
    () => (seed ? base64ToBuffer(seed) : null),
    [seed],
  );
  const { logout } = useAuth();

  // Import new auth context
  const {
    isAuthenticated,
    user,
    isAdmin: isAdminRole,
    logout: authLogout,
  } = useAuthContext();

  // Check both old and new auth systems
  // TODO: Remove deviceName check once fully migrated to JWT auth
  const isLoggedIn = isAuthenticated || !!deviceName;
  const isAdmin = isAdminRole; // Use actual admin role from JWT

  // Logout handler
  const handleLogout = () => {
    // Call new auth logout
    authLogout();
    // Also call old auth logout for backward compatibility
    logout();
  };

  useEffect(() => {
    function onWindowClick(evt: MouseEvent) {
      if ((evt.target as HTMLElement).closest(".is-dropdown")) return;
      setOpen(false);
    }

    window.addEventListener("click", onWindowClick);
    return () => window.removeEventListener("click", onWindowClick);
  }, []);

  const toggleOpen = useCallback(() => {
    setOpen((s) => !s);
  }, []);
  return (
    <div className="relative is-dropdown">
      <div
        className="cursor-pointer tabbable"
        tabIndex={0}
        onClick={toggleOpen}
        onKeyUp={(evt) => evt.key === "Enter" && toggleOpen()}
      >
        {props.children}
      </div>
      <Transition animation="slide-down" show={open}>
        <div className="rounded-xl absolute w-64 bg-dropdown-altBackground top-full mt-3 right-0">
          {/* User profile or Login button */}
          {isLoggedIn ? (
            // Show user profile if logged in
            isAuthenticated && user ? (
              // New JWT auth - show email
              <DropdownLink className="text-white" href="/settings">
                <UserAvatar />
                {user.email}
              </DropdownLink>
            ) : deviceName && bufferSeed ? (
              // Old auth - show device name
              <DropdownLink className="text-white" href="/settings">
                <UserAvatar />
                {(() => {
                  try {
                    return decryptData(deviceName, bufferSeed);
                  } catch (error) {
                    console.warn(
                      "Failed to decrypt device name in LinksDropdown, using fallback:",
                      error,
                    );
                    return t("settings.account.unknownDevice");
                  }
                })()}
              </DropdownLink>
            ) : null
          ) : (
            // Show Login button only when NOT logged in
            <DropdownLink href="/login" icon={LogIn} highlight>
              Login
            </DropdownLink>
          )}
          <Divider />

          {/* Settings - only show for admin */}
          {isAdmin && (
            <DropdownLink href="/settings" icon={Settings}>
              {t("navigation.menu.settings")}
            </DropdownLink>
          )}

          {/* Logout - only for logged in users */}
          {isLoggedIn ? (
            <DropdownLink
              className="!text-type-danger opacity-75 hover:opacity-100"
              icon={LogOut}
              onClick={handleLogout}
            >
              {t("navigation.menu.logout")}
            </DropdownLink>
          ) : null}

          <Divider />
          <div className="my-2 flex justify-center items-center gap-4">
            <CircleDropdownLink href="/support" icon={Icons.SUPPORT} />
          </div>
        </div>
      </Transition>
    </div>
  );
}
