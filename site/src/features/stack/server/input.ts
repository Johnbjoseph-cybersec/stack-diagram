import { z } from "zod";

export const stackId = z.string().regex(/^[\w-]{1,64}$/);
export const turnstileToken = z.string().min(1).max(2048);

/** An error whose status TanStack Start sends with the server function's reply. */
export const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), { status });

/** A server-function validator that answers 400 instead of 500 on bad input. */
export const strictInput =
  <T extends z.ZodType>(schema: T) =>
  (input: z.input<T>): z.output<T> => {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw httpError(400, "Invalid input");
    }
    return result.data;
  };
