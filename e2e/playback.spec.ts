import { expect, test } from "@playwright/test";
import { fresh } from "./helpers";

test.beforeEach(async ({ page }) => fresh(page, { goal: "sing" }));

test("the playhead moves with the music and stops where you pause", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Tempo").fill("120");
  await page.getByTestId("play").click();
  await expect(page.locator(".readout")).toContainText("Bar 2", { timeout: 8_000 });
  await page.getByTestId("play").click();
  const paused = await page.locator(".readout").textContent();
  await page.waitForTimeout(700);
  expect(await page.locator(".readout").textContent()).toBe(paused);
});

test("a looped phrase goes round and counts its repeats", async ({ page }) => {
  test.slow();
  await page.goto("/");
  await page.getByLabel("Tempo").fill("120");
  await page.getByRole("button", { name: "Loop phrase 1" }).click();
  await page.getByTestId("play").click();
  await expect(page.getByTestId("loop")).toContainText("×2", { timeout: 15_000 });
  // Still inside phrase 1: the loop never lets the playhead into phrase 2.
  await expect(page.locator(".readout")).toContainText("Phrase 1 of 8");
});

test("changing tempo mid-play keeps playing from the same place", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("play").click();
  await page.waitForTimeout(1200);
  await page.getByLabel("Tempo").fill("90");
  await expect(page.getByTestId("play")).toHaveText(/Pause/);
  await expect(page.locator(".readout")).toContainText("Phrase 1 of 8");
});
