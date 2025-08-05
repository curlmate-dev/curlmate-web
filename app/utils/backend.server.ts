import * as path from "path"
import fs from "fs"
import yaml from 'js-yaml'
import { v4 as uuidv4 } from "uuid"
import { getSession } from "./backend.cookie"
import { redirect } from "@remix-run/node"
import { getFromRedis, getOrg, saveAppsForOrg, saveInRedis } from "./backend.redis"
import { ServiceConfig, UserInfo } from "./types"
import { z } from "zod";

export function readYaml(filePath: string) {
    const absoulutePath = path.join(...[process.cwd(), '/app', filePath]);
    const fileContents = fs.readFileSync(absoulutePath, 'utf-8');
    const rawConfig = yaml.load(fileContents);
    const config = ServiceConfig.parse(rawConfig);
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
        state: `${opts.appUuid}:${opts.service}`,
    });

    const serviceConfig = readYaml(`/oauth/${opts.service}.yaml`);
    const scope = getScopeForService({
        serviceConfig,
        scope: opts.scopes
    });

    scope && params.set("scope", scope)

    getAdditionalParamsForService({serviceConfig, params});

    const authUrl = `${opts.authUrl}?${params.toString()}`;

    return authUrl
}

export async function exchangeAuthCodeForToken(opts: {
    authCode: string,
    clientId: string,
    clientSecret: string,
    tokenUrl: string,
    redirectUri: string,
    service: string,
}) {    
    const { service , authCode, clientId, clientSecret, tokenUrl, redirectUri} = opts;
    const params = new URLSearchParams();
    getAuthTokenParamsForService({ service, authCode, clientId, clientSecret, redirectUri,  params });
    const requestOptions = getRequestOptionsForService({ service, authCode, clientId, clientSecret, redirectUri,  params });

    const response = await fetch(tokenUrl, requestOptions);

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

export function getScopeForService(opts: {
    serviceConfig: z.infer<typeof ServiceConfig>;
    scope: string;
}) {

    const { serviceConfig, scope } = opts;

    const scopes = scope ? [scope]: [];

    const { userInfoScope } = serviceConfig

    userInfoScope && scopes.push(userInfoScope)
    
    return scopes.join(" ")
}

export function getAdditionalParamsForService(opts: {
    serviceConfig: z.infer<typeof ServiceConfig>
    params: URLSearchParams;
}) {
    const { serviceConfig, params } = opts;

    const { additionalRequired } = serviceConfig;

    additionalRequired && Object.entries(additionalRequired).forEach(([key, value]) => {
        params.set(key, value)
    })
 }

export async function getUserInfo(opts: {
    serviceConfig: z.infer<typeof ServiceConfig>;
    accessToken: string;
}) {
    const { serviceConfig, accessToken } = opts;
    const userInfoUrl = serviceConfig.userInfoUrl;

    const requestOptions = {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
        }
    }
    const { additionalHeaders } = serviceConfig;
    requestOptions.headers = { ...requestOptions.headers, ...additionalHeaders};
    const userInfoRes = await fetch(userInfoUrl, requestOptions);

    const userInfo = await userInfoRes.json();

    const { name } = serviceConfig;
    if (name === "google-drive") {
        const email = userInfo.email;
        return email;
    }

    if (name === "notion") {
        const email = userInfo.bot.owner.user.person.email;
        return email;
    }

}

function getAuthTokenParamsForService(opts: {
    service: string; 
    authCode: string; 
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    params: URLSearchParams
}) {
    const {service, authCode, clientId, clientSecret, redirectUri, params} = opts;
    if (service === "google-drive") {
        params.append('grant_type', 'authorization_code');
        params.append('code', authCode);
        params.append('redirect_uri', redirectUri);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
    }
}

function getRequestOptionsForService(opts: {
    service: string; 
    authCode: string; 
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    params: URLSearchParams
}): RequestInit {
    const {service, authCode, clientId, clientSecret, redirectUri, params} = opts;
    if (service === "google-drive") {
        return {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: params.toString(),
        }
    }

    if(service === "notion") {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
        return {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`
            },
            body:JSON.stringify({
                code: authCode,
                grant_type: "authorization_code",
                redirect_uri: redirectUri
            })
        }
    }

    return {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
        body: params.toString(),
    }
}