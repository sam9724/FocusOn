import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi, afterEach } from "vitest";
import { Settings } from "./Settings";
import { initialData } from "../../lib/model";
import { useFocus, flushWrites } from "../../store/useFocus";
vi.mock("../../components/Install", () => ({ Install: () => null }));
afterEach(async () => {
  cleanup();
  await flushWrites();
});
it("updates preferences and adds a category", async () => {
  useFocus.setState({ data: initialData() });
  const user = userEvent.setup();
  render(<Settings />);
  await user.selectOptions(screen.getByLabelText("Theme"), "dark");
  expect(useFocus.getState().data.settings.theme).toBe("dark");
  await user.type(screen.getByLabelText("New category name"), "Personal");
  await user.click(screen.getByRole("button", { name: "Add" }));
  expect(useFocus.getState().data.categories.at(-1)?.name).toBe("Personal");
});
