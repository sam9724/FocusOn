import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("JSON export, confirmed reset and import restore the task list", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Your tasks" }).click();
  await page
    .getByRole("textbox", { name: "New task title" })
    .fill("Keep this task");
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^one-thing-focus-.*\.json$/);
  // Read the exact offered Blob inside the browser. Managed runners may forbid
  // OS downloads even with acceptDownloads; this also works on those runners.
  const backup = Buffer.from(
    await page.evaluate(
      async (url) => (await fetch(url)).text(),
      download.url(),
    ),
  );
  expect(JSON.parse(backup.toString()).tasks[0].title).toBe("Keep this task");
  await page.getByRole("button", { name: /Reset all app data/ }).click();
  await expect(
    page.getByRole("button", { name: "Reset all data", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Type RESET to confirm").fill("RESET");
  await page
    .getByRole("button", { name: "Reset all data", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: backup,
  });
  await expect(page.getByRole("dialog")).toContainText("1 tasks");
  await page.getByRole("button", { name: "Replace with backup" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Your tasks" }).click();
  await expect(
    page.getByRole("button", { name: /Keep this task.*medium/ }),
  ).toBeVisible();
});
test("offline task persistence, timer recovery and single-writer protection", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /start focusing/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Your tasks" }).click();
  await page
    .getByRole("textbox", { name: "New task title" })
    .fill("Write one paragraph");
  await page.getByRole("button", { name: "Add task" }).click();
  await page
    .getByRole("button", { name: /Write one paragraph.*medium/ })
    .click();
  await page.getByRole("button", { name: /start focusing/i }).click();
  await expect(page.getByRole("button", { name: /pause/i })).toBeVisible();
  const second = await context.newPage();
  await second.goto("./");
  await expect(
    second.getByRole("heading", { name: "Your space is already open." }),
  ).toBeVisible();
  await second.close();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByRole("button", { name: /pause/i })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Write one paragraph" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /pause/i }).click();
  await expect(page.getByRole("button", { name: /resume/i })).toBeVisible();
  await context.setOffline(false);
});
test("light, dark and mobile screens have no detected WCAG AA violations or overflow", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /start focusing/i }),
  ).toBeVisible();
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ["Now", "Your tasks", "Settings"]) {
      await page
        .getByRole("navigation")
        .getByRole("button", { name, exact: true })
        .click();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags([
              "wcag2a",
              "wcag2aa",
              "wcag21a",
              "wcag21aa",
              "wcag22a",
              "wcag22aa",
            ])
            .analyze()
        ).violations,
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ["Now", "Your tasks", "Settings"]) {
      await page
        .getByRole("navigation")
        .getByRole("button", { name, exact: true })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  expect(
    (
      await new AxeBuilder({ page })
        .withTags([
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22a",
          "wcag22aa",
        ])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("timer completion works away from Now and starts a break", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /start focusing/i }),
  ).toBeVisible();
  await page
    .getByRole("spinbutton", { name: "Custom session minutes" })
    .fill("1");
  await page.getByRole("button", { name: /start focusing/i }).click();
  await page.getByRole("button", { name: "Your tasks" }).click();
  await page.clock.fastForward(61000);
  await page.getByRole("button", { name: "Now", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Rest is part of the work." }),
  ).toBeVisible();
  await expect(page.getByRole("timer")).toHaveAttribute(
    "aria-label",
    /4 minutes/,
  );
});
