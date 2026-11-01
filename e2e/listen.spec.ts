import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, fresh, isPhone } from "./helpers";

test.describe("first visit", () => {
  test.beforeEach(async ({ page }) => fresh(page));

  test("opens straight into the Passion Chorale with one Play button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "O Haupt voll Blut und Wunden" })).toBeVisible();
    await expect(page.getByText("O head, full of blood and wounds")).toBeVisible();
    await expect(page.getByTestId("play")).toHaveText(/Play/);
    await expect(page.getByText("I mostly want to…")).toBeVisible();
  });

  test("hear it, mute a voice and loop a phrase in under a minute", async ({ page }) => {
    const started = Date.now();
    await page.goto("/");
    await page.getByTestId("play").click();
    await expect(page.getByTestId("play")).toHaveText(/Pause/);

    const alto = page.getByRole("button", { name: "Mute alto" });
    await alto.click();
    await expect(alto).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: /Loop phrase 1/ }).click();
    await expect(page.getByTestId("loop")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("loop")).toContainText("Phrase 1");
    expect(Date.now() - started).toBeLessThan(60_000);
  });

  test("the first hint appears after the music starts, and goes once done", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Tap a voice to mute it", { exact: false })).toHaveCount(0);
    await page.getByTestId("play").click();
    await expect(page.getByText("Tap a voice to mute it", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Mute tenor" }).click();
    await expect(page.getByText("Tap a voice to mute it", { exact: false })).toHaveCount(0);
    await expect(page.getByText("to loop that phrase", { exact: false })).toBeVisible();
  });

  test("has no axe violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("play")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test.describe("listening", () => {
  test.beforeEach(async ({ page }) => fresh(page, { goal: "sing" }));

  test("a singer finds a chorale and loops their own part in three taps", async ({ page }) => {
    await page.goto("/#/library");
    // 1. Pick the chorale.
    await page.getByRole("link", { name: /Jesu, meine Freude/ }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Jesu, meine Freude" })).toBeVisible();
    // 2. Solo your voice: long-press on a phone, the solo button on a desktop.
    if (isPhone(page)) {
      const chip = page.getByRole("button", { name: "Mute tenor" });
      const box = (await chip.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(650);
      await page.mouse.up();
      await expect(chip).toContainText("Tenor");
      await expect(page.locator(".chip.is-solo")).toHaveCount(1);
    } else {
      await page.getByRole("button", { name: "Solo tenor" }).click();
      await expect(page.getByRole("button", { name: "Solo tenor" })).toHaveAttribute("aria-pressed", "true");
    }
    // 3. Tap a fermata to loop.
    await page.getByRole("button", { name: "Loop phrase 1" }).click();
    await expect(page.getByTestId("loop")).toHaveAttribute("aria-pressed", "true");
  });

  test("My part puts one voice forward and the others at 30%", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("My part").selectOption("A");
    if (!isPhone(page)) {
      await expect(page.getByRole("button", { name: "Mute soprano" })).toContainText("30%");
      await expect(page.getByRole("button", { name: "Mute alto" })).not.toContainText("%");
    }
    await page.getByLabel("My part").selectOption("");
    await expect(page.getByLabel("My part")).toHaveValue("");
  });

  test("tempo shows a tag when it is not the default", async ({ page }) => {
    await page.goto("/");
    const tempo = page.getByLabel("Tempo");
    await tempo.fill("80");
    await expect(page.locator(".tempo output")).toHaveText("♩ = 80");
    await expect(page.locator(".tempo output")).toHaveClass(/tag/);
  });

  test("switching between ribbons and score keeps the place", async ({ page }) => {
    await page.goto("/");
    for (let i = 0; i < 6; i++) await page.getByRole("button", { name: "Next chord" }).click();
    const before = (await page.locator(".readout").textContent()) ?? "";
    await page.getByRole("button", { name: "Score", exact: true }).click();
    await expect(page.locator(".score-page > svg")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".readout")).toHaveText(before);
    await page.getByRole("button", { name: "Ribbons", exact: true }).click();
    await expect(page.locator(".readout")).toHaveText(before);
  });

  test("the score colours every note by its voice", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Score", exact: true }).click();
    await expect(page.locator(".score-page > svg")).toBeVisible({ timeout: 20_000 });
    const counts = await page.evaluate(() => {
      const all = document.querySelectorAll(".score-page g.note").length;
      const coloured = document.querySelectorAll(".score-page g.note.v-S, .score-page g.note.v-A, .score-page g.note.v-T, .score-page g.note.v-B").length;
      return { all, coloured };
    });
    expect(counts.all).toBeGreaterThan(200);
    expect(counts.coloured).toBe(counts.all);
  });
});
