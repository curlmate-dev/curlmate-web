import { LoaderFunctionArgs } from "react-router";
import { getOrg } from "~/utils/backend.redis";

export const loader = async({request, params}: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("orgId");

    if(!orgId) {
        return Response.json({"error": "Org Id missing"}, {
            status: 400
        })
    }

    const org = await getOrg(orgId);

    if(!org) {
        return Response.json({"error": "Org not found"}, {
            status: 404
        });
    }

    return Response.json({data: org.apps}, {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    });

}