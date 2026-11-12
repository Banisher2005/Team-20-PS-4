import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { orFilter, queryWords, rankArticles, stem } from "../lib/kbSearch";

// The 30 KB articles, parsed from the real seed file so the test matches the demo data.
const sql = readFileSync(new URL("../seed/ps4_it_helpdesk.sql", import.meta.url), "utf8");
const re = /\(\s*'([^']+)',\s*'(VPN|Network|Account|Access|Hardware|Email|Apps|Security)',\s*'([^']+)',\s*'/g;
const articles = [...sql.matchAll(re)].map((m, i) => ({ id: i + 1, title: m[1], category: m[2], keywords: m[3] }));

const top = (q: string) => rankArticles(articles, queryWords(q))[0]?.title;

describe("knowledge-base word search (PRD §7.2)", () => {
  it("parses all 30 seed articles", () => {
    expect(articles).toHaveLength(30);
  });

  it("drops short and common words and stems the rest", () => {
    expect(queryWords("My VPN keeps disconnecting since morning")).toEqual(["vpn", "disconnect"]);
    expect(stem("clicked")).toBe("click");
    expect(stem("vpn")).toBe("vpn");
  });

  it("D1: 'VPN keeps disconnecting' finds the VPN article first", () => {
    expect(top("My VPN keeps disconnecting since morning.")).toBe("VPN keeps disconnecting");
  });

  it("D2: 'strange link' still finds 'Clicked a suspicious link'", () => {
    expect(top("I clicked a strange link in an email.")).toBe("Clicked a suspicious link");
  });

  it.each([
    ["my laptop is not charging", "Laptop not charging"],
    ["office wi-fi down", "Office Wi-Fi not connecting"],
    ["lost my laptop", "Lost or stolen laptop"],
    ["usb pendrive not working", "USB storage blocked"],
    ["need jira access", "Request access to a software tool"],
  ])("'%s' -> %s", (query, title) => {
    expect(top(query)).toBe(title);
  });

  it("returns an empty list (not an error) when nothing matches", () => {
    expect(rankArticles(articles, queryWords("the and since"))).toEqual([]);
    expect(rankArticles(articles, queryWords("zzzz qqqq"))).toEqual([]);
  });

  it("returns at most 3 articles", () => {
    expect(rankArticles(articles, queryWords("laptop slow printer password vpn")).length).toBeLessThanOrEqual(3);
  });

  it("builds a safe Supabase .or() filter (letters/digits only)", () => {
    const words = queryWords("Wi-Fi, (drop) %_");
    expect(orFilter(words)).toBe("title.ilike.%wifi%,keywords.ilike.%wifi%,title.ilike.%drop%,keywords.ilike.%drop%");
  });
});
