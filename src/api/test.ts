import { createServerFn } from "@tanstack/react-start";

export const testFn = createServerFn({ method: "POST" }).handler(async ({ context }) => {
  console.log(Object.keys(context));
  return { ok: true };
});
