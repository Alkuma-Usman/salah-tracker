import { test, expect } from "@playwright/test";
test("tracks prayers, persists history, reviews past days, and saves location", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Assalamu Alaikum" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Manchester" })).toBeVisible();
  await page.getByRole("button", { name: "Mark as prayed" }).first().click();
  await expect(
    page.getByRole("button", { name: "Prayed", exact: true }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Prayed", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Mark as prayed" }).first().click();
  await expect(page.getByText("2 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Previous day" }).click();
  await expect(page.getByText("0 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Next day" }).click();
  await expect(page.getByText("2 of 5")).toBeVisible();
  await page
    .getByRole("button", { name: "Prayed", exact: true })
    .first()
    .click();
  await expect(page.getByText("1 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Location name").fill("My Manchester");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(
    page.getByRole("button", { name: "My Manchester" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/dashboard-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("shows an in-app reminder when a prayer starts", async ({ page }) => {
  const { defaults, timesFor } = await import("../src/model");
  const fajr = timesFor(new Date(2026, 9, 23), defaults)[0];
  await page.clock.install({ time: new Date(fajr.getTime() - 2000) });
  await page.addInitScript(
    (settings) =>
      localStorage.setItem("salah-settings", JSON.stringify(settings)),
    { ...defaults, reminders: true },
  );
  await page.goto("/");
  await page.clock.fastForward(3000);
  await expect(page.getByRole("status")).toContainText("It’s time for Fajr");
});
