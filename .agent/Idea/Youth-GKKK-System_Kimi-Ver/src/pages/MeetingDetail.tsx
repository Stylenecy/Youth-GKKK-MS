import { useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, CheckCircle, Circle, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { getLocale } from "@/lib/locale";

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-[#C0C0C0]",
  in_progress: "bg-amber-500/20 text-amber-400",
  completed: "bg-emerald-500/20 text-emerald-400",
};

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);
  const [activeTab, setActiveTab] = useState<"agenda" | "notes" | "actions">("agenda");
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [actionDesc, setActionDesc] = useState("");
  const [actionAssignee, setActionAssignee] = useState("");

  const { data: meeting, isLoading, refetch } = trpc.meeting.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );
  const { data: membersList } = trpc.member.list.useQuery({ status: "active" });

  const updateMeeting = trpc.meeting.update.useMutation({ onSuccess: () => refetch() });
  const updateStatus = trpc.meeting.updateStatus.useMutation({ onSuccess: () => refetch() });
  const createActionItem = trpc.meeting.createActionItem.useMutation({ onSuccess: () => refetch() });
  const updateActionItem = trpc.meeting.updateActionItem.useMutation({ onSuccess: () => refetch() });

  const handleAddAgenda = () => {
    if (!newAgendaTitle || !meeting) return;
    const currentAgenda = (meeting.agendaData as any[]) || [];
    const newItem = {
      id: Date.now().toString(),
      title: newAgendaTitle,
      timeAllocation: 10,
      status: "pending",
      order: currentAgenda.length,
    };
    updateMeeting.mutate({
      id: meeting.id,
      agendaData: [...currentAgenda, newItem],
    });
    setNewAgendaTitle("");
  };

  const toggleAgendaStatus = (itemId: string) => {
    if (!meeting) return;
    const currentAgenda = (meeting.agendaData as any[]) || [];
    const updated = currentAgenda.map((a) =>
      a.id === itemId ? { ...a, status: a.status === "pending" ? "discussed" : "pending" } : a
    );
    updateMeeting.mutate({ id: meeting.id, agendaData: updated });
  };

  const handleCreateAction = () => {
    if (!actionDesc || !meeting) return;
    createActionItem.mutate({
      meetingId: meeting.id,
      description: actionDesc,
      assigneeId: actionAssignee ? Number(actionAssignee) : undefined,
    });
    setActionDesc("");
    setActionAssignee("");
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-32 bg-white/10" />
        <Skeleton className="h-64 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <p className="text-[#6B7280]">{t("common.noData")}</p>
      </div>
    );
  }

  const agendaItems = (meeting.agendaData as any[]) || [];
  const tabs = [
    { key: "agenda" as const, label: t("meeting.agenda") },
    { key: "notes" as const, label: t("meeting.notes") },
    { key: "actions" as const, label: t("meeting.actionItems") },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Link to="/meetings">
        <Button variant="ghost" className="mb-4 text-[#C0C0C0] hover:text-white pl-0">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("meeting.title")}
        </Button>
      </Link>

      {/* Header */}
      <Card className="glass rounded-2xl p-6 border-0 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{meeting.title}</h1>
              <Badge className={`text-[10px] ${statusColors[meeting.status]}`}>
                {t(`meeting.${meeting.status}`)}
              </Badge>
            </div>
            <p className="text-sm text-[#6B7280]">
              {meeting.meetingDate ? format(new Date(meeting.meetingDate), "EEEE, d MMMM yyyy", { locale }) : ""}
            </p>
          </div>
          <div className="flex gap-1">
            {meeting.status === "draft" && (
              <Button size="sm" className="gradient-aurora text-white border-0 text-xs"
                onClick={() => updateStatus.mutate({ id: meeting.id, status: "in_progress" })}>
                Start
              </Button>
            )}
            {meeting.status === "in_progress" && (
              <Button size="sm" className="gradient-cosmic text-white border-0 text-xs"
                onClick={() => updateStatus.mutate({ id: meeting.id, status: "completed" })}>
                Complete
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/[0.03]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white/[0.08] text-white"
                : "text-[#6B7280] hover:text-[#C0C0C0]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="glass rounded-2xl p-5 border-0">
        {activeTab === "agenda" && (
          <div className="space-y-3">
            {agendaItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-xs text-[#6B7280] w-5 shrink-0">{idx + 1}</span>
                <button onClick={() => toggleAgendaStatus(item.id)} className="shrink-0">
                  {item.status === "discussed" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#6B7280]" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${item.status === "discussed" ? "text-[#6B7280] line-through" : "text-white"}`}>
                    {item.title}
                  </p>
                </div>
                <span className="text-xs text-[#6B7280] shrink-0">{item.timeAllocation}m</span>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Input
                value={newAgendaTitle}
                onChange={(e) => setNewAgendaTitle(e.target.value)}
                placeholder="New agenda item"
                className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddAgenda()}
              />
              <Button size="sm" variant="ghost" className="text-[#A78BFA] hover:text-[#A78BFA] hover:bg-[#7C3AED]/10 shrink-0" onClick={handleAddAgenda}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            <textarea
              value={meeting.notes || ""}
              onChange={(e) =>
                updateMeeting.mutate({ id: meeting.id, notes: e.target.value })
              }
              placeholder="Meeting notes..."
              className="w-full h-64 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white p-3 text-sm resize-none leading-relaxed"
            />
            <p className="text-[10px] text-[#6B7280] mt-2">Auto-saved</p>
          </div>
        )}

        {activeTab === "actions" && (
          <div className="space-y-3">
            {meeting.actionItems?.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                <button
                  onClick={() => updateActionItem.mutate({ id: item.id, status: item.status === "open" ? "closed" : "open" })}
                  className="shrink-0 mt-0.5"
                >
                  {item.status === "closed" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#6B7280]" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${item.status === "closed" ? "text-[#6B7280] line-through" : "text-white"}`}>
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {item.assignee && (
                      <span className="text-[10px] flex items-center gap-1 text-[#A78BFA]">
                        <User className="w-3 h-3" />
                        {item.assignee.fullName}
                      </span>
                    )}
                    {item.dueDate && (
                      <span className="text-[10px] flex items-center gap-1 text-[#6B7280]">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.dueDate), "d MMM", { locale })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t border-white/[0.04]">
              <Input
                value={actionDesc}
                onChange={(e) => setActionDesc(e.target.value)}
                placeholder="New action item"
                className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
              />
              <div className="flex gap-2">
                <Select value={actionAssignee} onValueChange={setActionAssignee}>
                  <SelectTrigger className="flex-1 h-9 text-xs bg-white/[0.04] border-white/[0.08]">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14141E] border-white/[0.08]">
                    {membersList?.members.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)} className="text-white text-xs">
                        {m.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="gradient-nebula text-white border-0 text-xs" onClick={handleCreateAction}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
