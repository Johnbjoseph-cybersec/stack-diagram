import { isNotFound, isRedirect } from "@tanstack/react-router";
import { createMiddleware, createStart } from "@tanstack/react-start";

const isIntended = (error: unknown) =>
  isNotFound(error) ||
  isRedirect(error) ||
  (error instanceof Error && "status" in error && typeof error.status === "number");

// Database errors carry SQL text and parameters, so only errors thrown on purpose reach the browser.
const hideUnexpectedErrors = createMiddleware({ type: "function" }).server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (isIntended(error)) {
      throw error;
    }
    console.error(error);
    // A cause would be serialized to the browser along with the message.
    // oxlint-disable-next-line eslint/preserve-caught-error
    throw new Error("Something went wrong. Try again.");
  }
});

export const startInstance = createStart(() => ({ functionMiddleware: [hideUnexpectedErrors] }));
