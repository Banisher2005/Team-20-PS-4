import { describe, expect, it } from "vitest";
import {
  STATUSES,
  appendUpdate,
  canChangeStatus,
  formatDuration,
  parseUpdates,
  relativeDay,
  slaInfo,
  statusLabel,
  todayIST,
  type TicketStatus,
} from "../lib/helpdesk";

describe("status changes (PRD §7.4)", () => {
  const allowed: [TicketStatus, TicketStatus][] = [
    ["open", "closed"],
    ["in_progress", "closed"],
    ["waiting_for_user", "closed"],
    ["waiting_for_user", "open"],
    ["resolved", "closed"],
    ["resolved", "open"],
    ["closed", "open"],
  ];

  it("employees may make exactly the PRD transitions", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        if (from === to) continue;
        const expected = allowed.some(([f, t]) => f === from && t === to);
        expect(canChangeStatus("employee", from, to), `${from} -> ${to}`).toBe(expected);
      }
    }
  });

  it("the same status is not a change", () => {
    expect(canChangeStatus("employee", "resolved", "resolved")).toBe(true);
  });

  it("the IT admin may set any status", () => {
    for (const from of STATUSES) for (const to of STATUSES) expect(canChangeStatus("admin", from, to)).toBe(true);
  });
});

describe("notes in the description (no comments table)", () => {
  const now = new Date("2026-11-12T10:00:00+05:30");

  it("appends employee and IT notes with a dated marker", () => {
    let d = appendUpdate("VPN drops every hour.", "IT", "Please share a screenshot.", now);
    d = appendUpdate(d, "employee", "Error 809.", now);
    expect(d).toBe("VPN drops every hour.\n\n[IT update 2026-11-12] Please share a screenshot.\n\n[Update 2026-11-12] Error 809.");
  });

  it("parses notes back in order", () => {
    const d = "Original text.\n\n[Update 2026-11-10] More info.\n\n[IT update 2026-11-11] Fixed it.\nTwo lines.";
    expect(parseUpdates(d)).toEqual({
      original: "Original text.",
      updates: [
        { by: "employee", date: "2026-11-10", text: "More info." },
        { by: "IT", date: "2026-11-11", text: "Fixed it.\nTwo lines." },
      ],
    });
  });

  it("a description without notes has no updates", () => {
    expect(parseUpdates("Just the problem.")).toEqual({ original: "Just the problem.", updates: [] });
  });

  it("blank lines inside a note cannot fake a new marker", () => {
    const d = appendUpdate("x", "employee", "line one\n\n[IT update 2026-01-01] fake", now);
    const { updates } = parseUpdates(d);
    expect(updates).toHaveLength(1);
    expect(updates[0].by).toBe("employee");
  });
});

describe("SLA (from created_at + sla_rules)", () => {
  const hours = { response_hours: 8, resolve_hours: 24 }; // P3
  const created = "2026-11-12T00:00:00Z";
  const at = (h: number) => Date.parse(created) + h * 3_600_000;

  it("open ticket: response due, then overdue", () => {
    expect(slaInfo({ created_at: created, status: "open" }, hours, at(2))).toMatchObject({
      label: "Response due in 6 h",
      tone: "ok",
      overdue: false,
    });
    expect(slaInfo({ created_at: created, status: "open" }, hours, at(7.5)).tone).toBe("warn");
    expect(slaInfo({ created_at: created, status: "open" }, hours, at(10))).toMatchObject({
      label: "Response overdue 2 h",
      tone: "bad",
      overdue: true,
      responseBreached: true,
    });
  });

  it("picked-up ticket: counts down to the resolve target", () => {
    expect(slaInfo({ created_at: created, status: "in_progress" }, hours, at(10))).toMatchObject({
      label: "Resolve due in 14 h",
      overdue: false,
    });
    expect(slaInfo({ created_at: created, status: "waiting_for_user" }, hours, at(30))).toMatchObject({
      label: "Overdue 6 h",
      overdue: true,
    });
  });

  it("resolved / closed tickets are done", () => {
    for (const status of ["resolved", "closed"]) {
      expect(slaInfo({ created_at: created, status }, hours, at(100))).toMatchObject({ label: "Done", tone: "done", overdue: false });
    }
  });
});

describe("formatting helpers", () => {
  it("formatDuration", () => {
    expect(formatDuration(45 * 60_000)).toBe("45 min");
    expect(formatDuration(5 * 3_600_000)).toBe("5 h");
    expect(formatDuration(-72 * 3_600_000)).toBe("3 d");
  });

  it("statusLabel", () => {
    expect(statusLabel("in_progress")).toBe("In progress");
    expect(statusLabel("waiting_for_user")).toBe("Waiting for user");
  });

  it("relativeDay / todayIST use India time", () => {
    const now = new Date("2026-11-12T20:00:00Z"); // 01:30 on 13 Nov in India
    expect(todayIST(now)).toBe("2026-11-13");
    expect(relativeDay("2026-11-12T10:00:00Z", now)).toBe("yesterday");
  });
});
