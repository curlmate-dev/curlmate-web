import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { exchangeAuthCodeForToken } from "~/utils/backend.server";
import { Redis } from "@upstash/redis"
import { curlmateKeyCookie } from "~/utils/backend.cookie";
import { v4 as uuidv4 } from "uuid";
import { decrypt, encrypt } from "~/utils/backend.encryption";

export async function loader({request}: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const authCode = url.searchParams.get('code');
    const [appUuid, service] = url.searchParams.get('state')?.split(":") ?? [];

    const encryptionKey = process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];

    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    });

    const appData = await redis.get(`app:${appUuid}`);

    const decrtyptedAppData = JSON.parse(decrypt(appData, Buffer.from(encryptionKey, "base64url")));

    if (authCode) {
        try {
            const tokenResponse = await exchangeAuthCodeForToken({
                authCode,
                clientId: decrtyptedAppData.clientId,
                clientSecret: decrtyptedAppData.clientSecret,
                tokenUrl: decrtyptedAppData.tokenUrl,
                redirectUri: decrtyptedAppData.redirectUri
            });

            const tokenUuid = uuidv4();
            const encryptedTokenResponse = encrypt(JSON.stringify(tokenResponse), Buffer.from(encryptionKey, "base64url"));
            await redis.set(`token:${tokenUuid}`, encryptedTokenResponse);
            decrtyptedAppData.tokens.push(`token:${tokenUuid}`);
            const reencryptedAppData = encrypt(JSON.stringify(decrtyptedAppData), Buffer.from(encryptionKey, "base64url"));
            await redis.set(`app:${appUuid}`, reencryptedAppData);

            return redirect(`/success/${service}/${tokenUuid}`);
        } catch(error) {
            throw Error(`Error in token response ${error}`);
        }
    } else {
        return Response.json({error: "Auth Code missing"});
    }
}
