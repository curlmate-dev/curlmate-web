import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { exchangeAuthCodeForToken } from "~/utils/backend.server";
import { Redis } from "@upstash/redis"
import { access } from "fs";

export async function loader({request}: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const authCode = url.searchParams.get('code')
    const stateId = url.searchParams.get('state')

    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    })

    const session = await redis.get(`state:${stateId}`)

    if (authCode) {
        try {
            const tokenResponse = await exchangeAuthCodeForToken({
                authCode,
                clientId: session.clientId,
                clientSecret: session.clientSecret,
                tokenUrl: session.tokenUrl,
                redirectUri: session.redirectUri
            })

            await redis.set(`token:${stateId}`, JSON.stringify(tokenResponse));
            return redirect(`/${session.service}?state=${stateId}`)
        } catch(error) {
            return json({error})
        }
    } else {
        return json({error: "Auth Code missing"})
    }
}
