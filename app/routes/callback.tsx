import { json, LoaderFunctionArgs } from "@remix-run/node";
import { exchangeAuthCodeForToken } from "~/utils/backend.server";

export async function loader({request}: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const authCode = url.searchParams.get('code')
    if (authCode) {
        try {
            const tokenResponse = await exchangeAuthCodeForToken({
                authCode,
                clientId: "",
                clientSecret: "",
                tokenUrl: "",
                redirectUri: ""
            })

            return tokenResponse;
        } catch(error) {
            return json({error})
        }
    } else {
        return json({error: "Auth Code missing"})
    }
}
