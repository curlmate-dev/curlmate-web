import { z } from "zod";
import { zApp } from "./types";

export const zAppCompat = z.object({
  ...zApp.shape,
  userSelectedScope: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === "string" ? [val] : val)),
});
