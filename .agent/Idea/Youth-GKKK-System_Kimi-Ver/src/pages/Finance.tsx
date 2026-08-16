import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getLocale } from "@/lib/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const categoryColors: Record<string, string> = {
  cash_offering: "#7C3AED",
  qris: "#3B82F6",
  donation: "#10B981",
  food: "#EC4899",
  gifts: "#F59E0B",
  event_supplies: "#8B5CF6",
  equipment: "#EF4444",
  transport: "#6B7280",
};

const categoryLabels: Record<string, string> = {
  cash_offering: "finance.cashOffering",
  qris: "finance.qris",
  donation: "finance.donation",
  food: "finance.food",
  gifts: "finance.gifts",
  event_supplies: "finance.eventSupplies",
  equipment: "finance.equipment",
  transport: "finance.transport",
};

export default function Finance() {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    transactionDate: format(new Date(), "yyyy-MM-dd"),
    description: "",
    category: "cash_offering" as const,
    amount: "",
    type: "income" as "income" | "expense",
  });

  const { data: snapshot, isLoading: snapshotLoading } = trpc.finance.getSnapshot.useQuery();
  const { data: trend } = trpc.finance.getTrend.useQuery({ months: 6 });
  const { data: incomeBreakdown } = trpc.finance.getCategoryBreakdown.useQuery({
    type: "income",
  });
  trpc.finance.getCategoryBreakdown.useQuery({ type: "expense" });
  const { data: transactions, refetch } = trpc.finance.list.useQuery({ limit: 20 });
  const createTx = trpc.finance.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;
    createTx.mutate({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  const pieData = [
    ...(incomeBreakdown?.map((d) => ({
      name: t(categoryLabels[d.category] || d.category),
      value: Number(d.total),
      color: categoryColors[d.category] || "#6B7280",
    })) || []),
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{t("finance.title")}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-cosmic text-white border-0 hover:opacity-90">
              <Plus className="w-4 h-4 mr-1.5" />
              {t("finance.newTransaction")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#14141E] border-white/[0.08] text-white">
            <DialogHeader>
              <DialogTitle>{t("finance.newTransaction")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">{t("finance.transactionDate")}</label>
                  <Input type="date" value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                    className="bg-white/[0.04] border-white/[0.08] text-white" />
                </div>
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">{t("finance.type")}</label>
                  <select value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })}
                    className="w-full h-10 rounded-md bg-white/[0.04] border border-white/[0.08] text-white px-3">
                    <option value="income">{t("finance.income")}</option>
                    <option value="expense">{t("finance.expense")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#C0C0C0] mb-1 block">{t("finance.description")} *</label>
                <Input value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">{t("finance.category")}</label>
                  <select value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full h-10 rounded-md bg-white/[0.04] border border-white/[0.08] text-white px-3">
                    {Object.entries(categoryLabels).map(([key]) => (
                      <option key={key} value={key}>{t(key)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#C0C0C0] mb-1 block">{t("finance.amount")} *</label>
                  <Input type="number" value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-white/[0.04] border-white/[0.08] text-white" required />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-cosmic text-white border-0 hover:opacity-90" disabled={createTx.isPending}>
                {createTx.isPending ? t("common.loading") : t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: t("finance.totalIncome"), value: snapshot?.totalIncome ?? 0, icon: TrendingUp, color: "#10B981", gradient: "gradient-cosmic" },
          { label: t("finance.totalExpense"), value: snapshot?.totalExpense ?? 0, icon: TrendingDown, color: "#EF4444", gradient: "gradient-sunset" },
          { label: t("finance.balance"), value: snapshot?.balance ?? 0, icon: Wallet, color: "#A78BFA", gradient: "gradient-aurora" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass rounded-xl p-5 border-0">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-[#6B7280]">{stat.label}</span>
              </div>
              {snapshotLoading ? (
                <Skeleton className="h-8 w-28 bg-white/10" />
              ) : (
                <p className="text-2xl font-bold" style={{ color: stat.color }}>
                  Rp {(stat.value).toLocaleString()}
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2">
          <Card className="glass rounded-2xl p-5 border-0">
            <p className="text-sm text-[#6B7280] mb-4">{t("finance.trend")}</p>
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ background: "#14141E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff" }}
                    formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-[#6B7280]">{t("common.noData")}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="glass rounded-2xl p-5 border-0">
          <p className="text-sm text-[#6B7280] mb-4">{t("finance.categoryBreakdown")}</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#14141E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff" }} formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[#6B7280]">{t("common.noData")}</p>
            </div>
          )}
          <div className="space-y-1.5 mt-3">
            {pieData.slice(0, 5).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[#C0C0C0]">{d.name}</span>
                </div>
                <span className="text-[#6B7280]">Rp {d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transaction List */}
      <Card className="glass rounded-2xl p-5 border-0">
        <p className="text-sm text-[#6B7280] mb-4">{t("finance.title")}</p>
        <div className="space-y-2">
          {transactions?.transactions?.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {tx.type === "income" ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[#6B7280]">
                    {t(categoryLabels[tx.category] || tx.category)}
                  </span>
                  {tx.transactionDate && (
                    <span className="text-[10px] text-[#6B7280]">
                      {format(new Date(tx.transactionDate), "d MMM yyyy", { locale })}
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-sm font-medium shrink-0 ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                {tx.type === "income" ? "+" : "-"}Rp {Number(tx.amount).toLocaleString()}
              </p>
            </div>
          ))}
          {(!transactions?.transactions || transactions.transactions.length === 0) && (
            <p className="text-sm text-[#6B7280] text-center py-6">{t("finance.noTransactions")}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
