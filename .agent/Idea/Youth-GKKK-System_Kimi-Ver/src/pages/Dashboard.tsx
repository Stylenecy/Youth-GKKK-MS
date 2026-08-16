import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Cross,
  Calendar,
  Wallet,
  AlertTriangle,
  ArrowRight,
  Activity,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getLocale } from "@/lib/locale";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  const { data: upcoming } = trpc.dashboard.getUpcomingGathering.useQuery();
  const { data: fatigueAlerts } = trpc.dashboard.getFatigueAlerts.useQuery();
  const { data: activities } = trpc.dashboard.getRecentActivity.useQuery({ limit: 5 });

  const statCards = [
    {
      label: t("dashboard.totalMembers"),
      value: stats?.totalMembers ?? 0,
      icon: Users,
      gradient: "gradient-aurora",
    },
    {
      label: t("dashboard.activeCross"),
      value: stats?.activeCrossGroups ?? 0,
      icon: Cross,
      gradient: "gradient-nebula",
    },
    {
      label: t("dashboard.monthGatherings"),
      value: stats?.monthGatherings ?? 0,
      icon: Calendar,
      gradient: "gradient-cosmic",
    },
    {
      label: t("dashboard.monthlyBalance"),
      value: `Rp ${((stats?.monthlyBalance ?? 0) / 1000000).toFixed(1)}M`,
      icon: Wallet,
      gradient: "gradient-sunset",
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass rounded-xl p-4 border-0">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              {statsLoading ? (
                <Skeleton className="h-7 w-16 bg-white/10" />
              ) : (
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              )}
              <p className="text-xs text-[#6B7280] mt-1">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          {upcoming && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass rounded-2xl p-5 border-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
                      {t("dashboard.upcomingGathering")}
                    </p>
                    <h2 className="text-xl font-bold text-white">
                      {upcoming.theme}
                    </h2>
                    <p className="text-sm text-[#C0C0C0] mt-1">
                      {format(new Date(upcoming.eventDate), "EEEE, d MMMM yyyy", { locale })}
                    </p>
                  </div>
                  <Badge
                    variant={upcoming.status === "published" ? "default" : "secondary"}
                    className={
                      upcoming.status === "published"
                        ? "gradient-cosmic text-white border-0"
                        : "bg-white/10 text-[#C0C0C0]"
                    }
                  >
                    {t(`gathering.${upcoming.status}`)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-white/[0.04] rounded-full h-2">
                    <div
                      className="gradient-aurora h-2 rounded-full transition-all"
                      style={{
                        width: `${((upcoming.stewardAssignments?.filter((s) => s.memberId && s.status !== "replaced").length ?? 0) / 6) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#6B7280]">
                    {upcoming.stewardAssignments?.filter((s) => s.memberId && s.status !== "replaced").length ?? 0}/6
                  </span>
                </div>

                <Link to={`/gatherings/${upcoming.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#A78BFA] hover:text-[#A78BFA] hover:bg-[#7C3AED]/10"
                  >
                    {t("common.viewAll")}
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          )}

          {fatigueAlerts && fatigueAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="rounded-2xl p-5 border border-[#F59E0B]/30 bg-[#F59E0B]/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                  <p className="text-sm font-semibold text-[#F59E0B]">
                    {t("dashboard.fatigueAlert")}
                  </p>
                </div>
                <div className="space-y-2">
                  {fatigueAlerts.map((alert) => (
                    <div key={alert.member.id} className="flex items-center justify-between">
                      <p className="text-sm text-[#C0C0C0]">
                        {t("dashboard.fatigueMessage", {
                          name: alert.member.fullName,
                          count: alert.serviceCount,
                        })}
                      </p>
                      <Link to={`/members/${alert.member.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[#F59E0B] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10"
                        >
                          {t("common.viewAll")}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="glass rounded-2xl p-5 border-0">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-3">
                {t("dashboard.quickActions")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { to: "/gatherings", label: t("gathering.new"), icon: Calendar, color: "#7C3AED" },
                  { to: "/finance", label: t("finance.newTransaction"), icon: Wallet, color: "#10B981" },
                  { to: "/meetings", label: t("meeting.new"), icon: FileText, color: "#3B82F6" },
                  { to: "/audit", label: t("nav.audit"), icon: Activity, color: "#F59E0B" },
                ].map((action) => (
                  <Link key={action.to} to={action.to}>
                    <Button
                      variant="ghost"
                      className="w-full h-auto py-3 flex flex-col items-center gap-2 hover:bg-white/[0.06]"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${action.color}20` }}>
                        <action.icon className="w-4 h-4" style={{ color: action.color }} />
                      </div>
                      <span className="text-xs text-[#C0C0C0]">{action.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass rounded-2xl p-5 border-0 h-full">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-4">
              {t("dashboard.recentActivity")}
            </p>
            <div className="space-y-3">
              {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-3 h-3 text-[#6B7280]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-[#C0C0C0] leading-snug">
                        {activity.description}
                      </p>
                      <p className="text-[10px] text-[#6B7280] mt-1">
                        {format(new Date(activity.createdAt), "d MMM HH:mm", { locale })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280] text-center py-6">
                  {t("dashboard.noActivity")}
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
