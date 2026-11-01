import { expect, test } from "@playwright/test";
import { fresh } from "./helpers";

test.beforeEach(async ({ page }) => fresh(page, { goal: "sing" }));

for (const [sound, notice] of [
  ["quartet", "Quartet voices ready"],
  ["choir", "Choir voices ready"],
] as const) {
  test(`${sound} samples load and decode after the first Play`, async ({ page }) => {
    const failed: string[] = [];
    page.on("response", (r) => {
      if (r.url().includes("/samples/") && !r.ok()) failed.push(r.url());
    });
    await page.goto("/");
    await page.getByLabel("Sound").selectOption(sound);
    await page.getByTestId("play").click();
    await expect(page.getByText(notice)).toBeVisible({ timeout: 20_000 });
    expect(failed).toEqual([]);
  });
}

test("the sound can be switched between choir, organ and sine, and is remembered", async ({ page }) => {
  await page.goto("/");
  const sound = page.getByLabel("Sound");
  await expect(sound).toHaveValue("quartet");
  await sound.selectOption("sine");
  await page.getByTestId("play").click();
  await expect(page.getByTestId("play")).toHaveText(/Pause/);
  await sound.selectOption("organ");
  await expect(page.getByTestId("play")).toHaveText(/Pause/);
  await page.reload();
  await expect(page.getByLabel("Sound")).toHaveValue("organ");
});
