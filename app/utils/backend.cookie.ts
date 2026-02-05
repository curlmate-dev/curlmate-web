import { createCookie, createCookieSessionStorage } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [process.env.SESSION_SECRET!],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

export const userSession = createCookie("user-session", {
  maxAge: 60 * 60 * 24 * 7,
  httpOnly: true,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  secrets: [process.env.SESSION_ID_SECRET!],
});
