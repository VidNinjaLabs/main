import { LogOut, Menu, User } from "lucide-react";

import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/auth/useAuth";

interface SettingsHeaderProps {
  onMobileMenuClick?: () => void;
}

export function SettingsHeader(props: SettingsHeaderProps) {
  const { user } = useAuthContext();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="backdrop-blur-md px-4 py-2.5">
      <div className="flex items-center justify-between md:justify-end gap-4 max-w-7xl mx-auto">
        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          onClick={props.onMobileMenuClick}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-settings-card-background border border-settings-card-border">
            <div className="w-8 h-8 rounded-full bg-settings-card-altBackground flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-white hidden sm:inline">
              {user?.profile?.profile?.name ||
                user?.email?.split("@")[0] ||
                "User"}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${user?.isPremium ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"}`}
            >
              {user?.isPremium ? "Premium" : "Free"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-type-danger/10 hover:bg-type-danger/20 border border-type-danger/30 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-type-danger" />
            <span className="text-sm font-medium text-type-danger hidden sm:inline">
              Logout
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
