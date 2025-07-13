import { LoaderFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node";
import { getRefreshToken } from "~/utils/backend.server"

export const loader = async({ request, params}: LoaderFunctionArgs) => {
    const url = new URL(request.url);

    const { service, appUuid, tokenUuid } = params;

    if (!service || !appUuid || !tokenUuid ) {
        throw redirect("/404");
    }
    if (service === "salesforce") {
        return redirect(`/oauth-app/${service}/${appUuid}`)
    }
    await getRefreshToken({appUuid, tokenUuid, service});
    return redirect(`/success/${service}/${tokenUuid}`);
}