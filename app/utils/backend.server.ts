import * as path from "path"
import fs from "fs"
import yaml from 'js-yaml'
import { v4 as uuidv4 } from "uuid"
import { getSession } from "./backend.cookie"
import { redirect } from "@remix-run/node"
import { getFromRedis, getOrg, saveAppsForOrg, saveInRedis } from "./backend.redis"

export async function readYaml(filePath: string) {
    const absoulutePath = path.join(...[process.cwd(), '/app', filePath])
    const fileContents = fs.readFileSync(absoulutePath, 'utf-8')
    const config = yaml.load(fileContents)
    return config;
}

export function getAuthUrl(opts: {
    clientId: string, 
    clientSecret: string, 
    redirectUri: string,
    authUrl: string; 
    scopes: string,
    appUuid: string;
    service: string; 
}) {
    const params = new URLSearchParams({
        client_id: opts.clientId,
        response_type: "code",
        redirect_uri: opts.redirectUri,
        scope: opts.scopes,
        state: `${opts.appUuid}:${opts.service}`,
    });

    const authUrl = `${opts.authUrl}?${params.toString()}`;

    return authUrl
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
            "Accept": "application/json",
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

export async function configureApp(opts: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string;
    authUrl: string;
    tokenUrl: string;
    service: string;
    origin: string;
    orgKey: string | undefined;
}) {
    const {   
        clientId,
        clientSecret,
        redirectUri,
        scopes,
        authUrl,
        tokenUrl,
        service,
        origin,
        orgKey
    } = opts;

    const appUuid = uuidv4();

    const appAuthUrl = getAuthUrl({
        clientId,
        clientSecret,
        redirectUri,
        authUrl,
        scopes,
        appUuid,
        service,
    });

    const appKey = `app:${appUuid}:${service}`;

    orgKey && await saveAppsForOrg(orgKey, appKey )

    const value = {
        clientId,
        clientSecret,
        redirectUri,
        scopes,
        appAuthUrl,
        tokenUrl,
        service,
        tokens: [],
        custAuthUrl: `${origin}/oauth/${service}/${appUuid}`
    };

    await saveInRedis({key: appKey, value, service});

    return appUuid;
}

export async function getRefreshToken(opts: {
    appUuid: string;
    tokenUuid: string;
    service: string;
}) {
    const { appUuid, tokenUuid, service } = opts;
    if (!appUuid) {
        throw new Error("Missing App Id");
    }

    if (!tokenUuid) {
        throw new Error("Missing Token Id");
    }

    if (!service) {
        throw new Error("Missing service name");
    }

    const token = await getFromRedis({key: `token:${tokenUuid}`, service});

    const app = await getFromRedis({key:`app:${appUuid}`, service});

    const response = fetch(refreshTokenUrl, {
        method: "POST",
        headers:{
            "Authorization": `Basic `
        } 
    })
}

export async function requireOrg(request: Request): Promise<string> {
    const session = await getSession(request.headers.get("Cookie") || "");
    const orgKey = session.get("orgKey");
    if (!orgKey) {
        throw redirect("/")
    }
    return orgKey;
}