import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { exchangeAuthCodeForToken, readYaml } from "~/utils/backend.server";
import { v4 as uuidv4 } from "uuid";
import { UserInfo } from "~/utils/types";
import {getApp, saveInRedis} from "~/utils/backend.redis"

export async function loader({request}: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const authCode = url.searchParams.get('code');
    const [appUuid, service] = url.searchParams.get('state')?.split(":") ?? [];

    const appData = await getApp({appUuid, service});
    if (!appData) { throw new Error("App not found")};

    if (authCode) {
        try {
            const tokenResponse = await exchangeAuthCodeForToken({
                authCode,
                clientId: appData.clientId,
                clientSecret: appData.clientSecret,
                tokenUrl: appData.tokenUrl,
                redirectUri: appData.redirectUri
            });

            const serviceSpecs = await readYaml(`/oauth/${service}.yaml`);
            const userInfoUrl = serviceSpecs.userInfoUrl;
            const userInfoRes = await fetch(userInfoUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                    Accept: 'application/json'
                }
            })
            const rawUserInfo = await userInfoRes.json();
            const { email } = UserInfo.parse(rawUserInfo);

            const tokenUuid = uuidv4()
            const tokenId = `token:${tokenUuid}`;
            await saveInRedis({ key: tokenId , value: { email, tokenResponse }, service})

            appData.tokens.push(tokenId);
            await saveInRedis({key: `app:${appUuid}:${service}`, value: appData, service })

            return redirect(`/success/${service}/${tokenUuid}`);
        } catch(error) {
            throw Error(`Error in token response ${error}`);
        }
    } else {
        return Response.json({error: "Auth Code missing"});
    }
}
