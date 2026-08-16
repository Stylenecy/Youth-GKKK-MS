import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Globe, Moon, Bell, Shield } from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "id" ? "en" : "id");
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{t("settings.title")}</h1>

      <div className="space-y-4">
        {/* Language */}
        <Card className="glass rounded-2xl p-5 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-aurora flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{t("settings.language")}</p>
                <p className="text-sm text-[#6B7280]">
                  {i18n.language === "id" ? "Bahasa Indonesia" : "English"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={toggleLanguage}
            >
              {i18n.language === "id" ? "Switch to EN" : "Ganti ke ID"}
            </Button>
          </div>
        </Card>

        {/* Theme */}
        <Card className="glass rounded-2xl p-5 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-nebula flex items-center justify-center">
                <Moon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{t("settings.darkMode")}</p>
                <p className="text-sm text-[#6B7280]">Cosmic Dark Theme</p>
              </div>
            </div>
            <Switch checked={true} disabled className="data-[state=checked]:bg-[#7C3AED]" />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="glass rounded-2xl p-5 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-cosmic flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{t("settings.notifications")}</p>
                <p className="text-sm text-[#6B7280]">Steward reminders, meeting alerts</p>
              </div>
            </div>
            <Switch className="data-[state=checked]:bg-[#10B981]" />
          </div>
        </Card>

        {/* About */}
        <Card className="glass rounded-2xl p-5 border-0">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-sunset flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">GKKK Youth Platform</p>
                <p className="text-sm text-[#6B7280]">v1.0.0 - Space Youth</p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/[0.04]">
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Built for GKKK Youth Ministry to manage Saturday Gatherings, members,
                finances, meetings, and Cross groups. History-first, event-first,
                ministry-first.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
