import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getLocale } from "@/lib/locale";

const moduleColors: Record<string, string> = {
  gatherings: "bg-[#7C3AED]/20 text-[#A78BFA]",
  members: "bg-[#3B82F6]/20 text-[#60A5FA]",
  finance: "bg-[#10B981]/20 text-[#34D399]",
  meetings: "bg-[#F59E0B]/20 text-[#FBBF24]",
  cross: "bg-[#EC4899]/20 text-[#F472B6]",
  skills: "bg-[#8B5CF6]/20 text-[#A78BFA]",
  settings: "bg-[#6B7280]/20 text-[#9CA3AF]",
};

export default function AuditLog() {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);
  const [moduleFilter, setModuleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading } = trpc.audit.list.useQuery({
    module: moduleFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 50,
  });

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t("audit.title")}</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {data?.total ?? 0} {t("audit.title").toLowerCase()}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="h-10 rounded-md bg-white/[0.04] border border-white/[0.08] text-white px-3 text-sm"
        >
          <option value="">{t("common.filter")} - {t("audit.module")}</option>
          <option value="gatherings">{t("nav.gatherings")}</option>
          <option value="members">{t("nav.members")}</option>
          <option value="finance">{t("nav.finance")}</option>
          <option value="meetings">{t("nav.meetings")}</option>
          <option value="cross">{t("nav.cross")}</option>
        </select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-auto bg-white/[0.04] border-white/[0.08] text-white text-sm h-10"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-auto bg-white/[0.04] border-white/[0.08] text-white text-sm h-10"
          placeholder="To"
        />
        {(moduleFilter || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[#6B7280] hover:text-white h-10"
            onClick={() => {
              setModuleFilter("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
      ) : data?.entries && data.entries.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-white/[0.06]" />

          <div className="space-y-3">
            {data.entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative flex items-start gap-4 pl-1"
              >
                {/* Timeline dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 mt-2 z-10 ring-4 ring-[#0A0A0F] ${
                    moduleColors[entry.module]?.split(" ")[0].replace("bg-", "bg-") || "bg-[#6B7280]"
                  }`}
                  style={{
                    backgroundColor:
                      entry.module === "gatherings"
                        ? "#7C3AED"
                        : entry.module === "members"
                          ? "#3B82F6"
                          : entry.module === "finance"
                            ? "#10B981"
                            : entry.module === "meetings"
                              ? "#F59E0B"
                              : "#6B7280",
                  }}
                />

                <Card className="glass rounded-xl p-4 border-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-[#C0C0C0] leading-snug">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          className={`text-[10px] ${
                            moduleColors[entry.module] || "bg-white/10 text-[#6B7280]"
                          }`}
                        >
                          {entry.module}
                        </Badge>
                        {entry.actor && (
                          <span className="text-[10px] text-[#6B7280]">
                            by {entry.actor.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#6B7280] shrink-0">
                      {format(new Date(entry.createdAt), "d MMM HH:mm", { locale })}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
          <p className="text-[#6B7280]">{t("audit.noEntries")}</p>
        </div>
      )}
    </div>
  );
}
