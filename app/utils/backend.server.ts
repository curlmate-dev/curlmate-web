import * as path from "path"
import fs from "fs"
import yaml from 'js-yaml'
import { v4 as uuidv4 } from "uuid"
import { Redis } from "@upstash/redis"
import { encrypt } from "./backend.encryption"
import { decrypt } from "./backend.encryption"
import { getSession } from "./backend.cookie"
import { redirect } from "@remix-run/node"

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export async function readYaml(filePath: string) {
    const absoulutePath = path.join(...[process.cwd(), '/app', filePath])
    const fileContents = fs.readFileSync(absoulutePath, 'utf-8')
    const config = yaml.load(fileContents)
    return config;
}

export async function getFromRedis(opts: { key: string; service: string }) {
    const { key , service } = opts;
    const encryptionKey = process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];

    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const value = await redis.get(key);

    const decryptedValue = JSON.parse(decrypt(value, Buffer.from(encryptionKey, "base64url")));

    return decryptedValue;
};

export async function saveInRedis(opts: {
    key: string;
    value: string | object;
    service: string;
}) {
    const { key, value, service} = opts;
    const encryptionKey = process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    });

    const stringifiedValue =  typeof value === "object" ? JSON.stringify(value) : value;
    const encryptedValue = encrypt(stringifiedValue, Buffer.from(encryptionKey, "base64url"));

    await redis.set(key, encryptedValue)
}

export async function saveOrgInRedis(user: object) {
    if ("login" in user) {
        const redisKey = `org:${user.login}`;
        const existing = await redis.get(redisKey);
        if (!existing) {
            await redis.set(redisKey, JSON.stringify({
                id: user.id,
                login: user.login,
                avatar: user.avatar_url,
                email: user.email,
                apps: []                
            }))
        }
        return redisKey;
    } else {
        return {
            "error": "Email not received from Github"
        }
    }

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

    const key = `app:${appUuid}:${service}`;

    if (orgKey) {
        const org = await redis.get(orgKey);
        org.apps.push(key);
        await redis.set(orgKey, org);
    }

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

    await saveInRedis({key, value, service});

    return appUuid;
}

export async function requireOrg(request: Request): Promise<string> {
    const session = await getSession(request.headers.get("Cookie") || "");
    const orgKey = session.get("orgKey");
    if (!orgKey) {
        throw redirect("/")
    }
    return orgKey;
}

export async function getAppsForOrg(orgKey: string): Promise<string[]> {
    const org = await redis.get(orgKey);
    const apps = org.apps;
    return apps;
}

export async function getOrg(orgKey: string) {
    const org = await redis.get(orgKey);
    return org;
}