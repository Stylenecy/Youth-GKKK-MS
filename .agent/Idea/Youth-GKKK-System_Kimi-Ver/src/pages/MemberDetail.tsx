import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { getLocale } from "@/lib/locale";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  away: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  alumni: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  inactive: "bg-red-500/20 text-red-400 border-red-500/30",
};

const proficiencyColors: Record<string, string> = {
  beginner: "text-[#6B7280]",
  intermediate: "text-[#3B82F6]",
  advanced: "text-[#10B981]",
};

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);

  const { data: member, isLoading } = trpc.member.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-32 bg-white/10" />
        <Skeleton className="h-40 bg-white/10 rounded-2xl" />
        <Skeleton className="h-60 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <p className="text-[#6B7280]">{t("common.noData")}</p>
        <Link to="/members">
          <Button variant="ghost" className="mt-4 text-[#A78BFA]">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const skillsByCategory = member.skills?.reduce((acc, ms) => {
    const catName = ms.skill.category?.nameEn || "Other";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(ms);
    return acc;
  }, {} as Record<string, typeof member.skills>);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link to="/members">
        <Button variant="ghost" className="mb-4 text-[#C0C0C0] hover:text-white pl-0">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("member.title")}
        </Button>
      </Link>

      {/* Profile Header */}
      <Card className="glass rounded-2xl p-6 border-0 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-aurora flex items-center justify-center text-2xl font-bold shrink-0">
            {member.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">
                {member.fullName}
              </h1>
              <Badge
                variant="outline"
                className={`${statusColors[member.status]}`}
              >
                {t(`member.${member.status}`)}
              </Badge>
            </div>
            {member.nickname && (
              <p className="text-[#C0C0C0] mt-0.5">"{member.nickname}"</p>
            )}
            {member.memberships?.[0]?.cross && (
              <p className="text-sm text-[#A78BFA] mt-1">
                {member.memberships[0].cross.name}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/[0.06]">
          {member.whatsapp && (
            <div>
              <p className="text-xs text-[#6B7280]">{t("member.whatsapp")}</p>
              <p className="text-sm text-[#C0C0C0]">{member.whatsapp}</p>
            </div>
          )}
          {member.birthDate && (
            <div>
              <p className="text-xs text-[#6B7280]">{t("member.birthDate")}</p>
              <p className="text-sm text-[#C0C0C0]">
                {format(new Date(member.birthDate), "d MMMM yyyy", { locale })}
              </p>
            </div>
          )}
          {member.hometown && (
            <div>
              <p className="text-xs text-[#6B7280]">{t("member.hometown")}</p>
              <p className="text-sm text-[#C0C0C0]">{member.hometown}</p>
            </div>
          )}
          {member.university && (
            <div>
              <p className="text-xs text-[#6B7280]">{t("member.university")}</p>
              <p className="text-sm text-[#C0C0C0]">{member.university}</p>
            </div>
          )}
          {member.cohort && (
            <div>
              <p className="text-xs text-[#6B7280]">{t("member.cohort")}</p>
              <p className="text-sm text-[#C0C0C0]">{member.cohort}</p>
            </div>
          )}
        </div>

        {/* Fatigue Warning */}
        {member.fatigueCount >= 3 && (
          <div className="mt-4 p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <p className="text-sm text-[#F59E0B]">
              {t("dashboard.fatigueMessage", {
                name: member.fullName,
                count: member.fatigueCount,
              })}
            </p>
          </div>
        )}
      </Card>

      {/* Skills */}
      <Card className="glass rounded-2xl p-6 border-0 mb-4">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t("member.skills")}
        </h2>
        {skillsByCategory && Object.keys(skillsByCategory).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category}>
                <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">
                  {category}
                </p>
                <div className="space-y-2">
                  {skills?.map((ms) => (
                    <div
                      key={ms.id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#C0C0C0]">
                          {ms.skill.nameEn}
                        </span>
                        {ms.isPrimary && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA]">
                            {t("member.primarySkill")}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs capitalize ${
                          proficiencyColors[ms.proficiencyLevel]
                        }`}
                      >
                        {t(`member.${ms.proficiencyLevel}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280]">{t("common.noData")}</p>
        )}
      </Card>

      {/* Service History */}
      <Card className="glass rounded-2xl p-6 border-0">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t("member.serviceHistory")}
        </h2>
        {member.serviceHistory && member.serviceHistory.length > 0 ? (
          <div className="space-y-2">
            {member.serviceHistory.map((sh) => (
              <div
                key={sh.id}
                className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
              >
                <div>
                  <p className="text-sm text-[#C0C0C0]">{sh.roleName}</p>
                  {sh.gathering && (
                    <p className="text-xs text-[#6B7280]">
                      {sh.gathering.theme}
                    </p>
                  )}
                </div>
                <p className="text-xs text-[#6B7280]">
                  {sh.gathering?.eventDate
                    ? format(
                        new Date(sh.gathering.eventDate),
                        "d MMM yyyy",
                        { locale }
                      )
                    : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280]">{t("common.noData")}</p>
        )}
      </Card>
    </div>
  );
}
