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
import { Search, Plus, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getLocale } from "@/lib/locale";

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-[#C0C0C0]",
  published: "bg-emerald-500/20 text-emerald-400",
  done: "bg-blue-500/20 text-blue-400",
};

export default function Gatherings() {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    eventDate: "",
    theme: "",
    description: "",
  });

  const monthStr = format(new Date(), "yyyy-MM");
  const { data, isLoading, refetch } = trpc.gathering.list.useQuery({
    month: monthStr,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const createGathering = trpc.gathering.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setFormData({ eventDate: "", theme: "", description: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventDate || !formData.theme) return;
    createGathering.mutate(formData);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">
          {t("gathering.title")}
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-aurora text-white border-0 hover:opacity-90">
              <Plus className="w-4 h-4 mr-1.5" />
              {t("gathering.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#14141E] border-white/[0.08] text-white">
            <DialogHeader>
              <DialogTitle>{t("gathering.new")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div>
                <label className="text-sm text-[#C0C0C0] mb-1 block">
                  {t("gathering.date")} *
                </label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  className="bg-white/[0.04] border-white/[0.08] text-white"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-[#C0C0C0] mb-1 block">
                  {t("gathering.theme")} *
                </label>
                <Input
                  value={formData.theme}
                  onChange={(e) =>
                    setFormData({ ...formData, theme: e.target.value })
                  }
                  className="bg-white/[0.04] border-white/[0.08] text-white"
                  placeholder="Faith Over Fear"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-[#C0C0C0] mb-1 block">
                  {t("gathering.description")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full h-20 rounded-md bg-white/[0.04] border border-white/[0.08] text-white p-2 text-sm resize-none"
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-aurora text-white border-0 hover:opacity-90"
                disabled={createGathering.isPending}
              >
                {createGathering.isPending
                  ? t("common.loading")
                  : t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="pl-10 bg-white/[0.04] border-white/[0.08] text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md bg-white/[0.04] border border-white/[0.08] text-white px-3 text-sm"
        >
          <option value="">{t("common.filter")}</option>
          <option value="draft">{t("gathering.draft")}</option>
          <option value="published">{t("gathering.published")}</option>
          <option value="done">{t("gathering.done")}</option>
        </select>
      </div>

      {/* Gatherings List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
      ) : data?.gatherings && data.gatherings.length > 0 ? (
        <div className="space-y-3">
          {data.gatherings.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/gatherings/${g.id}`}>
                <Card className="glass rounded-xl p-5 border-0 hover:bg-white/[0.06] transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white">
                          {g.theme}
                        </h3>
                        <Badge
                          className={`text-[10px] ${statusColors[g.status]}`}
                        >
                          {t(`gathering.${g.status}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                        <Calendar className="w-3.5 h-3.5" />
                        {g.eventDate
                          ? format(new Date(g.eventDate), "EEEE, d MMMM yyyy", { locale })
                          : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-aurora rounded-full"
                            style={{
                              width: `${((g.stewardCount ?? 0) / 6) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#6B7280]">
                          {g.stewardCount ?? 0}/6
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#A78BFA] transition-colors ml-auto" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
          <p className="text-[#6B7280]">{t("gathering.noGatherings")}</p>
        </div>
      )}
    </div>
  );
}
