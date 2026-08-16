import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="text-center px-4">
        <Compass className="w-16 h-16 text-[#6B7280] mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-[#C0C0C0] mb-6">
          Page not found
        </p>
        <Link to="/">
          <Button className="gradient-aurora text-white border-0 hover:opacity-90">
            <Home className="w-4 h-4 mr-1.5" />
            {t("nav.dashboard")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
