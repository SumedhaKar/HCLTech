import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "./page";

const baseProfile = {
  goal: null,
  interests: [],
  experienceLevel: null,
  completedCourseIds: [],
  timeBudgetHoursPerWeek: null,
};

const courses = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Intro to Python",
    domain: "Programming Fundamentals",
  },
];

function mockFetch() {
  global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/learner-profile" && init?.method === "PATCH") {
      return Promise.resolve({
        ok: true,
        json: async () => JSON.parse(init.body as string),
      });
    }
    if (url === "/api/learner-profile") {
      return Promise.resolve({ ok: true, json: async () => baseProfile });
    }
    if (url === "/api/courses") {
      return Promise.resolve({ ok: true, json: async () => ({ courses }) });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  }) as unknown as typeof fetch;
}

describe("ProfilePage", () => {
  it("loads the current profile and lets the learner add and remove an interest", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<ProfilePage />);

    await screen.findByText("Your trail profile");

    const interestInput = screen.getByPlaceholderText("Add an interest…");
    await user.type(interestInput, "Kubernetes");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Kubernetes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Kubernetes" }));
    expect(screen.queryByText("Kubernetes")).not.toBeInTheDocument();
  });

  it("saves the edited experience level via PATCH", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<ProfilePage />);

    await screen.findByText("Your trail profile");
    await user.click(screen.getByRole("button", { name: "Beginner" }));
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(screen.getByText("Saved.")).toBeInTheDocument();
    });

    const calls = (global.fetch as unknown as { mock: { calls: unknown[][] } })
      .mock.calls as [RequestInfo | URL, RequestInit | undefined][];
    const patchCall = calls.find(
      ([url, init]) => String(url) === "/api/learner-profile" && init?.method === "PATCH"
    );
    expect(patchCall).toBeTruthy();
    const body = JSON.parse(patchCall![1]!.body as string);
    expect(body.experienceLevel).toBe("beginner");
  });
});
