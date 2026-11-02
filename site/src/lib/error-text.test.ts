import { notFound } from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";

import { errorText } from "./error-text.ts";

describe("errorText", () => {
  it("shows an error's message", () => {
    expect(errorText(new Error("Too many votes today"))).toBe("Too many votes today");
  });

  it("says not found for a thrown notFound()", () => {
    expect(errorText(notFound())).toBe("Not found.");
  });

  it.each([
    ["a plain object", { status: 500 }],
    ["a string", "boom"],
    ["undefined", undefined],
    ["an error without a message", new Error("")],
    ["an HTML error page", new Error("<!doctype html><title>502</title>")],
    ["a long body", new Error("x".repeat(201))],
  ])("falls back to a generic message for %s", (_, cause) => {
    expect(errorText(cause)).toBe("Something went wrong.");
  });
});
