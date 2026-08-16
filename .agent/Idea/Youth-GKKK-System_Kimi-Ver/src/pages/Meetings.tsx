import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getLocale } from "@/lib/locale";

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-[#C0C0C0]",
  in_progress: "bg-amber-500/20 text-amber-400",
  completed: "bg-emerald-500/20 text-emerald-400",
};

export default function Meetings() {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", meetingDate: format(new Date(), "yyyy-MM-dd") });

  const { data, isLoading, refetch } = trpc.meeting.list.useQuery();
  const createMeeting = trpc.meeting.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setFormData({ title: "", meetingDate: format(new Date(), "yyyy-MM-dd") });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.meetingDate) return;
    createMeeting.mutate(formData);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{t("meeting.title")}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-nebula text-white border-0 hover:opacity-90">
              <Plus className="w-4 h-4 mr-1.5" />
              {t("meeting.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#14141E] border-white/[0.08] text-white">
            <DialogHeader>
              <DialogTitle>{t("meeting.new")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div>
                <label className="text-sm text-[#C0C0C0] mb-1 block">{t("meeting.title")} *</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] text-white" placeholder="Monthly Committee Meeting" required />
              </div>
              <div>
                <label className="text-sm text-[#C0C0C0] mb-1 block">{t("meeting.date")}</label>
                <Input type="date" value={formData.meetingDate} onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] text-white" required />
              </div>
              <Button type="submit" className="w-full gradient-nebula text-white border-0 hover:opacity-90" disabled={createMeeting.isPending}>
                {createMeeting.isPending ? t("common.loading") : t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
      ) : data?.meetings && data.meetings.length > 0 ? (
        <div className="space-y-3">
          {data.meetings.map((meeting, i) => {
            const openActions = meeting.actionItems?.filter((a) => a.status === "open").length ?? 0;
            const totalActions = meeting.actionItems?.length ?? 0;
            return (
              <motion.div key={meeting.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/meetings/${meeting.id}`}>
                  <Card className="glass rounded-xl p-5 border-0 hover:bg-white/[0.06] transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{meeting.title}</h3>
                          <Badge className={`text-[10px] ${statusColors[meeting.status]}`}>{t(`meeting.${meeting.status}`)}</Badge>
                        </div>
                        <p className="text-sm text-[#6B7280]">
                          {meeting.meetingDate ? format(new Date(meeting.meetingDate), "EEEE, d MMMM yyyy", { locale }) : ""}
                        </p>
                        {totalActions > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                            <span className="text-xs text-[#6B7280]">
                              {totalActions - openActions}/{totalActions} {t("meeting.actionItems").toLowerCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#A78BFA] transition-colors shrink-0 mt-1" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
          <p className="text-[#6B7280]">{t("meeting.noMeetings")}</p>
        </div>
      )}
    </div>
  );
}
