import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Start each test as a first-time visitor, with the getting-started question answered or not. */
export async function fresh(page: Page, opts: { goal?: string } = {}) {
  await page.addInitScript((goal) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.clear();
      if (goal) localStorage.setItem("chorale-workshop", JSON.stringify({ state: { goal, hintsDone: ["mute", "loop", "score"] }, version: 1 }));
      sessionStorage.setItem("seeded", "1");
    }
  }, opts.goal ?? "");
}

export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
  expect(summary).toEqual([]);
}

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 600;
