import { Link, Palette, Settings, Store, Subtitles, User, Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { BrandPill } from "@/components/layout/BrandPill";
import { SidebarLink, SidebarSection } from "@/components/layout/Sidebar";
import { useAuthContext } from "@/contexts/AuthContext";

export function SettingsSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  // Map the hash to category IDs that Settings.tsx expects
  const getActiveSection = () => {
    const hash = location.hash.replace("#", "");
    const hashToCategoryMap: Record<string, string> = {
      "settings-account": "settings-account",
      "settings-preferences": "settings-preferences",
      "settings-appearance": "settings-appearance",
      "settings-captions": "settings-captions",
      "settings-connection": "settings-connection",
      "settings-providers": "settings-providers",
      "settings-admin": "settings-admin",
    };
    return hashToCategoryMap[hash] || "settings-account";
  };

  const activeSection = getActiveSection();

  const navigateToSection = (section: string) => {
    navigate(`/settings#${section}`, { replace: false });
    // Scroll to the section after a brief delay
    setTimeout(() => {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border-r border-white/5 overflow-x-hidden">
      <div className=" flex items-center">
        <div className="scale-60 pt-1">
          <BrandPill clickable />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <SidebarSection title="Personal">
          <SidebarLink
            icon={User}
            active={activeSection === "settings-account"}
            onClick={() => navigateToSection("settings-account")}
          >
            Account
          </SidebarLink>

          <SidebarLink
            icon={Settings}
            active={activeSection === "settings-preferences"}
            onClick={() => navigateToSection("settings-preferences")}
          >
            Preferences
          </SidebarLink>
        </SidebarSection>

        <SidebarSection title="Customization" className="mt-6">
          <SidebarLink
            icon={Palette}
            active={activeSection === "settings-appearance"}
            onClick={() => navigateToSection("settings-appearance")}
          >
            Appearance
          </SidebarLink>

          <SidebarLink
            icon={Subtitles}
            active={activeSection === "settings-captions"}
            onClick={() => navigateToSection("settings-captions")}
          >
            Subtitles
          </SidebarLink>
        </SidebarSection>

        <SidebarSection title="Integration" className="mt-6">
          <SidebarLink
            icon={Link}
            active={activeSection === "settings-connection"}
            onClick={() => navigateToSection("settings-connection")}
          >
            Connections
          </SidebarLink>

          <SidebarLink
            icon={Store}
            active={activeSection === "settings-providers"}
            onClick={() => navigateToSection("settings-providers")}
          >
            Providers
          </SidebarLink>
        </SidebarSection>

        {/* Admin Section - Only visible to admins */}
        {user?.role === "ADMIN" && (
          <SidebarSection title="Administration" className="mt-6">
            <SidebarLink
              icon={Shield}
              active={activeSection === "settings-admin"}
              onClick={() => navigateToSection("settings-admin")}
            >
              Admin Dashboard
            </SidebarLink>
          </SidebarSection>
        )}
      </div>
    </div>
  );
}
