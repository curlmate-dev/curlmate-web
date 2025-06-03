import * as path from "path"
import fs from "fs"
import yaml from 'js-yaml'
import { json } from "@remix-run/node"
import { v4 as uuidv4 } from "uuid"
import { Redis } from "@upstash/redis"

export async function readYaml(filePath: string) {
    const absoulutePath = path.join(...[process.cwd(), '/app', filePath])
    const fileContents = fs.readFileSync(absoulutePath, 'utf-8')
    const config = yaml.load(fileContents)
    return config;
}

export async function getAuthUrl(opts: {
    clientId: string, 
    clientSecret: string, 
    redirectUri: string, 
    scopes: string, 
    authUrl: string,
    tokenUrl: string,
    service: string,
}) {
    const params = new URLSearchParams({
        client_id: opts.clientId,
        response_type: "code",
        redirect_uri: opts.redirectUri,
        scope: opts.scopes,
        state: uuidv4(),
    })

    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    })

    await redis.set(`state:${params.get("state")}`, JSON.stringify({
        clientId: opts.clientId,
        clientSecret: opts.clientSecret,
        redirectUri: opts.redirectUri,
        tokenUrl: opts.tokenUrl,
        service: opts.service,
    }))

    return `${opts.authUrl}?${params.toString()}`
}

export async function exchangeAuthCodeForToken(opts: {
    authCode: string,
    clientId: string,
    clientSecret: string,
    tokenUrl: string,
    redirectUri: string,
}) {    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', opts.authCode);
    params.append('redirect_uri', opts.redirectUri);
    params.append('client_id', opts.clientId);
    params.append('client_secret', opts.clientSecret);

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    }

    const response = await fetch(opts.tokenUrl, requestOptions);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Http error !", {
            cause: errorText
        })
    }

    return await response.json();
}