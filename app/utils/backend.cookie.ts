import { createCookie } from "@remix-run/node";

export const userSession = createCookie("user-session", {
  maxAge: 60 * 60 * 24 * 7,
  httpOnly: true,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  secrets: [process.env.SESSION_ID_SECRET!],
});

export type FlowStep = "started";

export type FlowSessionData = { userId: string; flowStep: FlowStep };

export const flowSession = createCookie("flow-session", {
  maxAge: 60 * 60 * 24 * 7,
  httpOnly: true,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  secrets: [process.env.SESSION_ID_SECRET!],
});
