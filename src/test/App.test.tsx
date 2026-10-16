import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, it, expect } from "vitest";
import { App } from "../App";
import { database } from "../db/database";
import { useFocus, flushWrites } from "../store/useFocus";
import { initialData } from "../lib/model";
beforeEach(async () => {
  await flushWrites();
  await database.snapshots.clear();
  useFocus.setState({ data: initialData(), ready: false, error: null });
});
afterEach(() => cleanup());
it("adds a task and focuses it, then starts and pauses", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("button", { name: /start focusing/i });
  await user.click(screen.getByRole("button", { name: /your tasks/i }));
  await user.type(
    screen.getByRole("textbox", { name: "New task title" }),
    "Send one application",
  );
  await user.click(screen.getByRole("button", { name: "Add task" }));
  await user.click(
    screen.getByRole("button", { name: /Send one application.*medium/i }),
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Send one application",
  );
  await user.click(screen.getByRole("button", { name: /start focusing/i }));
  expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /pause/i }));
  expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /mark task done/i }));
  await waitFor(() =>
    expect(screen.getByText("✓ 1 done today")).toBeInTheDocument(),
  );
});
it("supports N and Space without intercepting typing", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("button", { name: /start focusing/i });
  await user.keyboard("n");
  const input = screen.getByRole("textbox", { name: "New task title" });
  await waitFor(() => expect(input).toHaveFocus());
  await user.type(input, "A new thing");
  expect(input).toHaveValue("A new thing");
});
