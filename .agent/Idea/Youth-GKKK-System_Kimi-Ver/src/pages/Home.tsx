import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Users, Calendar, Wallet, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 lg:pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-[#C0C0C0] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
            GKKK Youth Ministry
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="text-gradient-aurora">Space Youth</span>
            <br />
            <span className="text-white">Platform</span>
          </h1>
          <p className="text-lg text-[#C0C0C0] mb-8 leading-relaxed">
            {t("common.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="gradient-aurora text-white border-0 hover:opacity-90 w-full sm:w-auto"
              >
                {t("common.welcome")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-white/10 text-white hover:bg-white/5 w-full sm:w-auto"
              >
                {t("nav.login")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Calendar,
              title: t("nav.gatherings"),
              desc: "Plan and manage Saturday gatherings with steward assignments",
              gradient: "gradient-aurora",
              to: "/gatherings",
            },
            {
              icon: Users,
              title: t("nav.members"),
              desc: "Manage members, skills, and Cross group memberships",
              gradient: "gradient-nebula",
              to: "/members",
            },
            {
              icon: Wallet,
              title: t("nav.finance"),
              desc: "Track income, expenses, and financial reports",
              gradient: "gradient-cosmic",
              to: "/finance",
            },
            {
              icon: FileText,
              title: t("nav.meetings"),
              desc: "Create agendas, take notes, and track action items",
              gradient: "gradient-sunset",
              to: "/meetings",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
            >
              <Link to={feature.to}>
                <div className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition-all group cursor-pointer h-full">
                  <div
                    className={`w-10 h-10 rounded-xl ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ministry Rhythm */}
      <section className="px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto glass rounded-3xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Ministry Rhythm
          </h2>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-2xl font-bold text-gradient-aurora">Sat</p>
              <p className="text-xs text-[#6B7280] mt-1">17:00</p>
              <p className="text-sm text-[#C0C0C0] mt-0.5">Gathering</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gradient-nebula">Wed</p>
              <p className="text-xs text-[#6B7280] mt-1">19:00</p>
              <p className="text-sm text-[#C0C0C0] mt-0.5">Rehearsal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gradient-cosmic">Monthly</p>
              <p className="text-xs text-[#6B7280] mt-1">Flexible</p>
              <p className="text-sm text-[#C0C0C0] mt-0.5">Meeting</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs text-[#6B7280]">
        <p>GKKK Youth Ministry - Space Youth Platform</p>
        <p className="mt-1">Built with love for the next generation</p>
      </footer>
    </div>
  );
}
