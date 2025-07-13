import { LoaderFunctionArgs } from "@remix-run/node";
import { getFromRedis } from "~/utils/backend.redis";

export const loader = async({ request, params }: LoaderFunctionArgs) => {
    const url = new URL(request.url);

    const tokenId = url.searchParams.get("tokenId");

    if(!tokenId) {
        return Response.json({
            error: "Token Id missing"
        }, 
        {
            status: 400,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    const service = url.searchParams.get("service");

    if(!service) {
        return Response.json({
            error: "OAuth service missing"
        }, 
        {
            status: 400,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    const token = await getFromRedis({key: tokenId, service});

    if(!token) {
        return Response.json({
            error: "Token not found"
        }, {
            status: 404,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    return Response.json({
        ...token
    },
    {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    } 
    )
}