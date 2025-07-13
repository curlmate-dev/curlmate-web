import { LoaderFunctionArgs } from "@remix-run/node";
import { getFromRedis } from "~/utils/backend.redis";

export const loader = async({ request, params }: LoaderFunctionArgs ) => {
    const url = new URL(request.url);

    const appId = url.searchParams.get("appId");

    if(!appId) {
        return Response.json({"error": "App Id missing"}, {
            status: 404,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    const app = await getFromRedis({ key: appId, service: appId.split(":")[2]});

    if (!app) {
        return Response.json({
            error: "App not found",
        }, 
        {
            status: 400,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    return Response.json({
        data: app.tokens
    },
    {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    })
}