import { describe, it, expect } from "vitest";
import {
  isCommittee,
  canManageFinance,
  canViewAudit,
  canApproveAccounts,
  ROLE_LABEL,
} from "@/lib/roles";
import type { AppRole } from "@/lib/types";

const ALL: AppRole[] = ["admin", "treasurer", "leader", "ministry", "member"];
const allowed = (fn: (r: AppRole) => boolean) => ALL.filter(fn);

describe("role gates mirror RLS", () => {
  it("committee = admin, treasurer, ministry (is_committee() in 0010)", () => {
    expect(allowed(isCommittee)).toEqual(["admin", "treasurer", "ministry"]);
  });

  it("finance = admin + treasurer only", () => {
    expect(allowed(canManageFinance)).toEqual(["admin", "treasurer"]);
  });

  it("audit log and approvals = admin only", () => {
    expect(allowed(canViewAudit)).toEqual(["admin"]);
    expect(allowed(canApproveAccounts)).toEqual(["admin"]);
  });

  it("demo mode (null role) sees everything for preview", () => {
    for (const gate of [isCommittee, canManageFinance, canViewAudit, canApproveAccounts]) {
      expect(gate(null)).toBe(true);
    }
  });

  it("every role has an Indonesian label", () => {
    for (const r of ALL) expect(ROLE_LABEL[r]).toBeTruthy();
  });
});
