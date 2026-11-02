import { isNotFound } from "@tanstack/react-router";

const FAILED = "Something went wrong.";
// A failed response the client cannot decode, such as a WAF or 502 page, becomes an Error with the whole body.
const isShortText = (message: string) => message.length <= 200 && !/[<\n]/.test(message);

/** The text for a failed action; a server function's `notFound()` arrives as a plain object. */
export function errorText(cause: unknown) {
  if (isNotFound(cause)) {
    return "Not found.";
  }
  return cause instanceof Error && cause.message && isShortText(cause.message)
    ? cause.message
    : FAILED;
}
