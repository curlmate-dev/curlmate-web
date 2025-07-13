import {z} from "zod";

export const Org = z.object({
    id: z.number(),
    login: z.string(),
    avatar: z.url(),
    email: z.email().nullable(),
    apps: z.array(z.string()),   
})

export const App = z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    redirectUri: z.string(),
    scopes: z.string(),
    appAuthUrl: z.string(),
    tokenUrl: z.string(),
    service: z.string(),
    tokens: z.array(z.string()),
    custAuthUrl: z.string()
})

export const UserInfo = z.object({
    email: z.email(),
})