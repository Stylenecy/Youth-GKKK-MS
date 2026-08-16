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
import { Search, Plus, User } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  away: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  alumni: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  inactive: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function Members() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    whatsapp: "",
    birthDate: "",
    hometown: "",
    university: "",
    cohort: "",
    status: "active" as "active" | "away" | "alumni" | "inactive",
  });

  const { data, isLoading, refetch } = trpc.member.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const createMember = trpc.member.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setFormData({
        fullName: "",
        nickname: "",
        whatsapp: "",
        birthDate: "",
        hometown: "",
        university: "",
        cohort: "",
        status: "active",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) return;
    createMember.mutate(formData);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t("member.title")}
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {data?.total ?? 0} {t("member.title").toLowerCase()}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-aurora text-white border-0 hover:opacity-90">
              <Plus className="w-4 h-4 mr-1.5" />
              {t("member.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#14141E] border-white/[0.08] text-white max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("member.new")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div>
                <label className="text-sm text-[#C0C0C0] mb-1 block">
                  {t("member.fullName")} *
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="bg-white/[0.04] border-white/[0.08] text-white"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">
                    {t("member.nickname")}
                  </label>
                  <Input
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">
                    {t("member.whatsapp")}
                  </label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="628..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">
                    {t("member.birthDate")}
                  </label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">
                    {t("member.status")}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full h-10 rounded-md bg-white/[0.04] border border-white/[0.08] text-white px-3"
                  >
                    <option value="active">{t("member.active")}</option>
                    <option value="away">{t("member.away")}</option>
                    <option value="alumni">{t("member.alumni")}</option>
                    <option value="inactive">{t("member.inactive")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#C0C0C0] mb-1 block">
                  {t("member.hometown")}
                </label>
                <Input
                  value={formData.hometown}
                  onChange={(e) =>
                    setFormData({ ...formData, hometown: e.target.value })
                  }
                  className="bg-white/[0.04] border-white/[0.08] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">
                    {t("member.university")}
                  </label>
                  <Input
                    value={formData.university}
                    onChange={(e) =>
                      setFormData({ ...formData, university: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">
                    {t("member.cohort")}
                  </label>
                  <Input
                    value={formData.cohort}
                    onChange={(e) =>
                      setFormData({ ...formData, cohort: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                    placeholder="2023"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-aurora text-white border-0 hover:opacity-90 mt-2"
                disabled={createMember.isPending}
              >
                {createMember.isPending
                  ? t("common.loading")
                  : t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("member.search")}
            className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-[#6B7280]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md bg-white/[0.04] border border-white/[0.08] text-white px-3 text-sm"
        >
          <option value="">{t("common.filter")}</option>
          <option value="active">{t("member.active")}</option>
          <option value="away">{t("member.away")}</option>
          <option value="alumni">{t("member.alumni")}</option>
          <option value="inactive">{t("member.inactive")}</option>
        </select>
      </div>

      {/* Members List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
      ) : data?.members && data.members.length > 0 ? (
        <div className="space-y-2">
          {data.members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={`/members/${member.id}`}>
                <Card className="glass rounded-xl p-4 border-0 hover:bg-white/[0.06] transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-nebula flex items-center justify-center text-sm font-bold shrink-0">
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">
                          {member.fullName}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-5 ${
                            statusColors[member.status]
                          }`}
                        >
                          {t(`member.${member.status}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {member.nickname && (
                          <span className="text-xs text-[#6B7280]">
                            "{member.nickname}"
                          </span>
                        )}
                        {member.memberships?.[0]?.cross && (
                          <span className="text-xs text-[#A78BFA]">
                            {member.memberships[0].cross.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      {member.skills
                        ?.filter((s) => s.isPrimary)
                        .slice(0, 2)
                        .map((s) => (
                          <span
                            key={s.id}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#C0C0C0]"
                          >
                            {s.skill.nameEn}
                          </span>
                        ))}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <User className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
          <p className="text-[#6B7280]">{t("member.noMembers")}</p>
        </div>
      )}
    </div>
  );
}
