import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, fresh } from "./helpers";

const index = JSON.parse(readFileSync(new URL("../public/data/index.json", import.meta.url), "utf8")) as { chorales: { id: string; title: string }[] };

test.beforeEach(async ({ page }) => fresh(page, { goal: "sing" }));

test("shows a Start here shelf of five and all thirty chorales", async ({ page }) => {
  await page.goto("/#/library");
  await expect(page.locator(".shelf-list > li")).toHaveCount(5);
  await expect(page.locator(".chorale-table tbody tr")).toHaveCount(30);
});

test("searches by title, BWV and Riemenschneider number", async ({ page }) => {
  await page.goto("/#/library");
  const search = page.getByRole("searchbox");
  await search.fill("wachet");
  await expect(page.locator(".chorale-table tbody tr")).toHaveCount(1);
  await search.fill("BWV 302");
  await expect(page.locator(".chorale-table tbody tr")).toHaveText([/Ein’ feste Burg/]);
  await search.fill("R 74");
  await expect(page.locator(".chorale-table tbody tr")).toHaveText([/O Haupt/]);
  await search.fill("zzzz");
  await expect(page.getByText("Nothing matches", { exact: false })).toBeVisible();
});

test("has no axe violations", async ({ page }) => {
  await page.goto("/#/library");
  await expect(page.locator(".chorale-table")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("all thirty chorales open, play and show their title", async ({ page }) => {
  test.slow();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const c of index.chorales) {
    await page.goto(`/#/chorale/${c.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(c.title);
    await page.getByTestId("play").click();
    await expect(page.getByTestId("play")).toHaveText(/Pause/);
    await page.getByTestId("play").click();
    await expect(page.getByTestId("play")).toHaveText(/Play/);
  }
  expect(errors).toEqual([]);
});
