import {createCookie, createCookieSessionStorage} from "@remix-run/node"
import { randomBytes } from "crypto"

const isProd = process.env.NODE_ENV === "production";

export const curlmateKeyCookie = createCookie("Curlmate", {
     httpOnly: true,
     secure: isProd,
     sameSite: "strict",
     path: "/",
     maxAge: 60 * 60 * 24
})