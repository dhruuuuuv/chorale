import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, fresh } from "./helpers";

test.skip(({ isMobile }) => !!isMobile, "keyboard flows run on desktop");

test.beforeEach(async ({ page }) => fresh(page, { goal: "harmony" }));

test("the whole Listen lens works from the keyboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("play")).toBeVisible();
  await page.locator("body").click({ position: { x: 5, y: 5 } });

  await page.keyboard.press("Space");
  await expect(page.getByTestId("play")).toHaveText(/Pause/);
  await page.keyboard.press("Space");
  await expect(page.getByTestId("play")).toHaveText(/Play/);

  await page.keyboard.press("1");
  await expect(page.getByRole("button", { name: "Mute soprano" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("1");
  await expect(page.getByRole("button", { name: "Mute soprano" })).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Shift+4");
  await expect(page.getByRole("button", { name: "Solo bass" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Shift+4");

  await page.keyboard.press("l");
  await expect(page.getByTestId("loop")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("l");
  await expect(page.getByTestId("loop")).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("]");
  await expect(page.locator(".tempo output")).toHaveText("♩ = 64");
  await page.keyboard.press("[");
  await expect(page.locator(".tempo output")).toHaveText("♩ = 60");
});

test("stepping chord by chord announces bar, chord, notes and word", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("play")).toBeVisible();
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("ArrowRight");
  const live = page.locator("[aria-live='polite'][aria-atomic='true']");
  await expect(live).toContainText("Bar 0, beat 4");
  await expect(live).toContainText("Soprano A4");
  await page.keyboard.press("ArrowRight");
  await expect(live).toContainText("Bar 1, beat 1");
  await expect(live).toContainText("B flat major");
  await expect(live).toContainText("Sung: Haupt");
});

test("every control is reachable by Tab with a visible focus ring", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("play")).toBeVisible();
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return { name: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? el.tagName, outline: cs.outlineStyle };
    });
    if (info) {
      seen.add(info.name);
      expect(info.outline, `focus ring on ${info.name}`).not.toBe("none");
    }
  }
  for (const name of ["Mute Soprano", "Solo bass", "Next chord", "Options"]) expect([...seen].some((s) => s.includes(name)), name).toBe(true);
});

test("the options popover has no axe violations", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Options" }).click();
  await expect(page.getByLabel("Pause length")).toBeVisible();
  await expectNoAxeViolations(page);
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Pause length")).toBeHidden();
});

test("Space plays and pauses even when a button has focus; Enter still presses the button", async ({ page }) => {
  await page.goto("/");
  const soprano = page.getByRole("button", { name: "Mute Soprano" });
  await soprano.focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("play")).toHaveText(/Pause/);
  await expect(soprano).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(page.getByTestId("play")).toHaveText(/Play/);
  await page.keyboard.press("Enter");
  await expect(soprano).toHaveAttribute("aria-pressed", "true");
});

test("Space still types in the search box", async ({ page }) => {
  await page.goto("/#/library");
  const search = page.getByRole("searchbox");
  await search.fill("ein");
  await search.press("Space");
  await expect(search).toHaveValue("ein ");
});
