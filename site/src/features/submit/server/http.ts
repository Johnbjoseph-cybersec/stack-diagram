export const fail = (status: number, error: string) => Response.json({ error }, { status });

/** Answers an unexpected throw in the same `{ error }` shape that share.py prints. */
export async function catchErrors(run: () => Promise<Response>) {
  try {
    return await run();
  } catch (error) {
    console.error(error);
    return fail(500, "Something went wrong. Try again later");
  }
}
