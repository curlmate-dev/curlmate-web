import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { exchangeAuthCodeForToken } from "~/utils/backend.server";
import { Redis } from "@upstash/redis"
import { access } from "fs";
import { curlmateKeyCookie } from "~/utils/backend.cookie";
import { decrypt, encrypt } from "~/utils/backend.encryption";

export async function loader({request}: LoaderFunctionArgs) {
    const cookieHeader = request.headers.get("Cookie");
    const userKey = await curlmateKeyCookie.parse(cookieHeader);
    console.log("userKey: ", userKey)
    if (!userKey) {
        throw new Error("Missing encryption key");
    };

    const url = new URL(request.url)
    const authCode = url.searchParams.get('code')
    const stateId = url.searchParams.get('state')

    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    })

    const session = await redis.get(`state:${stateId}`)

    const decrtyptedSession = JSON.parse(decrypt(session, Buffer.from(userKey, "base64url")))

    if (authCode) {
        try {
            const tokenResponse = await exchangeAuthCodeForToken({
                authCode,
                clientId: decrtyptedSession.clientId,
                clientSecret: decrtyptedSession.clientSecret,
                tokenUrl: decrtyptedSession.tokenUrl,
                redirectUri: decrtyptedSession.redirectUri
            })
            const encryptedTokenResponse = encrypt(JSON.stringify(tokenResponse), Buffer.from(userKey, "base64url"));
            await redis.set(`token:${stateId}`, encryptedTokenResponse);
            return redirect(`/apicurl?state=${stateId}`)
        } catch(error) {
            throw Error(`Error in token response ${error}`)
        }
    } else {
        return json({error: "Auth Code missing"})
    }
}
