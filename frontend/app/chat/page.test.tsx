import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function mockIntakeResponse(body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("ChatPage checklist gating", () => {
  it("reveals Generate my path once every checklist field is known", async () => {
    mockIntakeResponse({
      reply: "Great, I have everything I need.",
      profilePatch: {
        goal: "Become a backend engineer",
        interests: ["apis"],
        experienceLevel: "beginner",
        timeBudgetHoursPerWeek: 6,
      },
      profileComplete: true,
    });

    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(
      screen.getByPlaceholderText("Describe your goal…"),
      "I want to become a backend engineer"
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByRole("button", { name: /generate my path/i })
    ).toBeInTheDocument();
  });

  it("keeps Generate my path hidden when a field is still unknown, even if profileComplete is wrongly true", async () => {
    // Regression guard for a real bug found in this app: the backend once
    // returned profileComplete: true while experienceLevel was still null.
    // The button must gate on the checklist's own state, never on that flag.
    mockIntakeResponse({
      reply: "Nice, tell me more.",
      profilePatch: {
        goal: "Become a backend engineer",
        interests: ["apis"],
        experienceLevel: null,
        timeBudgetHoursPerWeek: 6,
      },
      profileComplete: true,
    });

    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(
      screen.getByPlaceholderText("Describe your goal…"),
      "I want to become a backend engineer"
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getAllByText("not yet known").length).toBeGreaterThan(0);
    });
    expect(
      screen.queryByRole("button", { name: /generate my path/i })
    ).not.toBeInTheDocument();
  });
});
