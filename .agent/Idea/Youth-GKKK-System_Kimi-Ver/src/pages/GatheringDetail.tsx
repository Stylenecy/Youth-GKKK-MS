import { useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar, CheckCircle, UserX, Users } from "lucide-react";
import { format } from "date-fns";
import { getLocale } from "@/lib/locale";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-[#C0C0C0]",
  published: "bg-emerald-500/20 text-emerald-400",
  done: "bg-blue-500/20 text-blue-400",
};

const stewardStatusColors: Record<string, string> = {
  assigned: "text-[#C0C0C0]",
  confirmed: "text-emerald-400",
  change_requested: "text-amber-400",
  replaced: "text-red-400 line-through",
};

export default function GatheringDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);
  const [selectedMember, setSelectedMember] = useState<Record<number, string>>({});
  const [changeReason, setChangeReason] = useState("");
  const [showChangeForm, setShowChangeForm] = useState<number | null>(null);

  const { data: gathering, isLoading, refetch } = trpc.gathering.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  const { data: membersList } = trpc.member.list.useQuery({ status: "active" });

  const updateStatus = trpc.gathering.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const assignSteward = trpc.gathering.assignSteward.useMutation({
    onSuccess: () => refetch(),
  });

  const requestChange = trpc.gathering.requestChange.useMutation({
    onSuccess: () => {
      refetch();
      setShowChangeForm(null);
      setChangeReason("");
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-32 bg-white/10" />
        <Skeleton className="h-48 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!gathering) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <p className="text-[#6B7280]">{t("common.noData")}</p>
      </div>
    );
  }

  const stewardCount = gathering.stewardAssignments?.filter(
    (s) => s.memberId && s.status !== "replaced"
  ).length ?? 0;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Link to="/gatherings">
        <Button variant="ghost" className="mb-4 text-[#C0C0C0] hover:text-white pl-0">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("gathering.title")}
        </Button>
      </Link>

      {/* Header */}
      <Card className="glass rounded-2xl p-6 border-0 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-white">
                {gathering.theme}
              </h1>
              <Badge className={`text-[10px] ${statusColors[gathering.status]}`}>
                {t(`gathering.${gathering.status}`)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Calendar className="w-4 h-4" />
              {gathering.eventDate
                ? format(new Date(gathering.eventDate), "EEEE, d MMMM yyyy", { locale })
                : ""}
            </div>
          </div>
          <div className="flex gap-1">
            {gathering.status === "draft" && (
              <Button
                size="sm"
                className="gradient-cosmic text-white border-0 text-xs"
                onClick={() => updateStatus.mutate({ id: gathering.id, status: "published" })}
              >
                {t("gathering.published")}
              </Button>
            )}
            {gathering.status === "published" && (
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 text-white text-xs"
                onClick={() => updateStatus.mutate({ id: gathering.id, status: "done" })}
              >
                {t("gathering.done")}
              </Button>
            )}
          </div>
        </div>

        {/* Steward Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/[0.04] rounded-full h-2.5">
            <motion.div
              className="gradient-aurora h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(stewardCount / 6) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-sm text-[#C0C0C0] font-medium">
            {t("gathering.stewardCount", { assigned: stewardCount, total: 6 })}
          </span>
        </div>
      </Card>

      {/* Steward Assignments */}
      <Card className="glass rounded-2xl p-6 border-0">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t("gathering.stewardAssignment")}
        </h2>
        <div className="space-y-3">
          {gathering.stewardAssignments?.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#6B7280]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {assignment.roleName}
                </p>
                {assignment.member ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#C0C0C0]">
                      {assignment.member.fullName}
                    </span>
                    <span
                      className={`text-[10px] ${
                        stewardStatusColors[assignment.status]
                      }`}
                    >
                      ({t(`gathering.${assignment.status}`)})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[#6B7280]">
                    {t("gathering.assignMember")}
                  </span>
                )}
                {assignment.changeReason && (
                  <p className="text-xs text-amber-400 mt-0.5">
                    {assignment.changeReason}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {assignment.status === "change_requested" ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[10px] text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => {
                        if (selectedMember[assignment.id]) {
                          assignSteward.mutate({
                            assignmentId: assignment.id,
                            memberId: Number(selectedMember[assignment.id]),
                          });
                        }
                      }}
                    >
                      <CheckCircle className="w-3 h-3 mr-0.5" />
                      Replace
                    </Button>
                    <Select
                      value={selectedMember[assignment.id] || ""}
                      onValueChange={(v) =>
                        setSelectedMember({ ...selectedMember, [assignment.id]: v })
                      }
                    >
                      <SelectTrigger className="w-[120px] h-7 text-xs bg-white/[0.04] border-white/[0.08]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#14141E] border-white/[0.08]">
                        {membersList?.members
                          .filter((m) => m.id !== assignment.memberId)
                          .map((m) => (
                            <SelectItem
                              key={m.id}
                              value={String(m.id)}
                              className="text-white"
                            >
                              {m.fullName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : assignment.member ? (
                  <>
                    {showChangeForm === assignment.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={changeReason}
                          onChange={(e) => setChangeReason(e.target.value)}
                          placeholder="Reason"
                          className="w-24 h-7 px-2 text-xs rounded bg-white/[0.04] border border-white/[0.08] text-white"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] text-amber-400"
                          onClick={() =>
                            requestChange.mutate({
                              assignmentId: assignment.id,
                              reason: changeReason,
                            })
                          }
                        >
                          Request
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px]"
                          onClick={() => setShowChangeForm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] text-[#6B7280] hover:text-amber-400"
                        onClick={() => setShowChangeForm(assignment.id)}
                      >
                        <UserX className="w-3 h-3 mr-0.5" />
                        Change
                      </Button>
                    )}
                  </>
                ) : (
                  <Select
                    value={selectedMember[assignment.id] || ""}
                    onValueChange={(v) => {
                      setSelectedMember({ ...selectedMember, [assignment.id]: v });
                      assignSteward.mutate({
                        assignmentId: assignment.id,
                        memberId: Number(v),
                      });
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white/[0.04] border-white/[0.08]">
                      <SelectValue placeholder={t("gathering.assignMember")} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#14141E] border-white/[0.08]">
                      {membersList?.members.map((m) => (
                        <SelectItem
                          key={m.id}
                          value={String(m.id)}
                          className="text-white"
                        >
                          {m.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
