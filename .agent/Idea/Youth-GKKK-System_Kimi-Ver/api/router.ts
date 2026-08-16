import { authRouter } from "./auth-router";
import { memberRouter } from "./member-router";
import { skillRouter } from "./skill-router";
import { crossRouter } from "./cross-router";
import { gatheringRouter } from "./gathering-router";
import { financeRouter } from "./finance-router";
import { meetingRouter } from "./meeting-router";
import { dashboardRouter } from "./dashboard-router";
import { auditRouter } from "./audit-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  member: memberRouter,
  skill: skillRouter,
  cross: crossRouter,
  gathering: gatheringRouter,
  finance: financeRouter,
  meeting: meetingRouter,
  dashboard: dashboardRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
