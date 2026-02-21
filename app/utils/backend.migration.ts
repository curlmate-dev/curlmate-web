import { z } from "zod";
import { zApp } from "./types";

// ensure backward compatibility with change of scope type to string[] from older connections with string scope
export const zAppCompat = z.object({
  ...zApp.shape,
  userSelectedScope: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === "string" ? [val] : val)),
});
