import { it, expect, vi, afterEach } from "vitest";
import { useFocus, flushWrites } from "./useFocus";
import { database } from "../db/database";
import { initialData } from "../lib/model";
import { freshTimer, start } from "../features/timer/engine";
afterEach(() => vi.restoreAllMocks());
it("serializes restore and blocks stale timer writes until it commits", async () => {
  await flushWrites();
  const data = initialData();
  data.settings.focusMinutes = 10;
  const restore = useFocus.getState().replace(data);
  useFocus.getState().setTimer(start(freshTimer(), Date.now()));
  await restore;
  await flushWrites();
  expect(useFocus.getState().data).toEqual(data);
  expect(await database.load()).toEqual(data);
  expect(useFocus.getState().replacing).toBe(false);
});
it("preserves visible data when a restore cannot be saved", async () => {
  await flushWrites();
  const before = useFocus.getState().data;
  vi.spyOn(database, "save").mockRejectedValueOnce(new Error("Quota exceeded"));
  const replacement = initialData();
  replacement.settings.focusMinutes = 45;
  await expect(useFocus.getState().replace(replacement)).rejects.toThrow(
    "Quota",
  );
  expect(useFocus.getState().data).toEqual(before);
  expect(useFocus.getState().replacing).toBe(false);
});
