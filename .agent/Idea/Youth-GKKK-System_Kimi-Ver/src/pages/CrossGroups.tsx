import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Crown, User } from "lucide-react";
import { motion } from "framer-motion";

export default function CrossGroups() {
  const { t } = useTranslation();
  const { data: groups, isLoading } = trpc.cross.list.useQuery();

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t("cross.title")}</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {groups?.length ?? 0} {t("cross.title").toLowerCase()}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-white/[0.04] rounded-2xl" />
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="glass rounded-2xl p-5 border-0 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-nebula flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{group.name}</h3>
                    <p className="text-xs text-[#6B7280]">
                      {t("cross.memberCount", { count: group.memberCount })}
                    </p>
                  </div>
                </div>

                {group.description && (
                  <p className="text-sm text-[#C0C0C0] mb-4">
                    {group.description}
                  </p>
                )}

                {group.leader && (
                  <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-white/[0.03]">
                    <Crown className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span className="text-sm text-[#C0C0C0]">
                      {t("cross.leader")}: {group.leader.fullName}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  {group.memberships?.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <User className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span className="text-[#C0C0C0]">
                        {m.member.fullName}
                      </span>
                    </div>
                  ))}
                  {(group.memberships?.length ?? 0) > 5 && (
                    <p className="text-xs text-[#6B7280] pl-5">
                      +{(group.memberships?.length ?? 0) - 5} more
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
          <p className="text-[#6B7280]">{t("cross.noGroups")}</p>
        </div>
      )}
    </div>
  );
}
