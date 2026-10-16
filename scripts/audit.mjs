import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";
const chrome = await launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const result = await lighthouse(
    process.env.AUDIT_URL || "http://127.0.0.1:4173/",
    {
      port: chrome.port,
      output: ["json", "html"],
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    },
  );
  if (!result) throw new Error("No audit result");
  await mkdir("reports", { recursive: true });
  await writeFile("reports/lighthouse.json", result.report[0]);
  await writeFile("reports/lighthouse.html", result.report[1]);
  const scores = Object.fromEntries(
    Object.entries(result.lhr.categories).map(([id, value]) => [
      id,
      Math.round((value.score ?? 0) * 100),
    ]),
  );
  console.log(scores);
  if (scores.performance < 90 || scores.accessibility < 90)
    process.exitCode = 1;
} finally {
  await chrome.kill();
}
