import { LoaderFunctionArgs } from "@remix-run/node";
import { getOrg } from "~/utils/backend.redis";

export const loader = async({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return Response.json({error: "Missing parameter id"}, {
            status: 400,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    const org = await getOrg(id);

    if (!org) {
        return Response.json({error: "Org not found"}, {
            status: 404,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }
    return Response.json({...org}, {
        status: 200,
        headers: {"Content-Type": "application/json"}
    })
}