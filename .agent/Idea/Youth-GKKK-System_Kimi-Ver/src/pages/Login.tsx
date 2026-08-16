import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center relative overflow-hidden">
      {/* Aurora glow */}
      <div className="absolute inset-0 aurora-glow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <Card className="glass-strong rounded-2xl border border-white/[0.08]">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 rounded-2xl gradient-aurora flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Space Youth
            </CardTitle>
            <p className="text-sm text-[#6B7280] mt-1">
              {t("common.subtitle")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full gradient-aurora text-white border-0 hover:opacity-90 h-11 text-base"
              size="lg"
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
            >
              {t("nav.login")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-center text-[#6B7280]">
              {t("common.loginPrompt")}
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#6B7280] mt-6">
          GKKK Youth Ministry Platform
        </p>
      </motion.div>
    </div>
  );
}
