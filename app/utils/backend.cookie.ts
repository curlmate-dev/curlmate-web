import {createCookie, createCookieSessionStorage} from "@remix-run/node"
import { randomBytes } from "crypto"

export const curlmateKeyCookie = createCookie("Curlmate", {
     httpOnly: true,
     secure: false,
     sameSite: "lax",
     path: "/",
     maxAge: 60 * 60 * 24
})