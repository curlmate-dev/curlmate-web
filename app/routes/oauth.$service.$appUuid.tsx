import { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getFromRedis } from "~/utils/backend.redis";

export const loader = async ({ request, params}: LoaderFunctionArgs) => {
    const { service, appUuid } = params;

    if (!service || !appUuid) {
        throw redirect('/404');
    }

    const app = await getFromRedis({ key:`app:${appUuid}:${service}`, service});

    const authUrl = app.appAuthUrl;

    return redirect(authUrl);
}