import * as path from "path"
import fs from "fs"
import yaml from 'js-yaml'
import { v4 as uuidv4 } from "uuid"
import { Redis } from "@upstash/redis"
import { encrypt } from "./backend.encryption"

export async function readYaml(filePath: string) {
    const absoulutePath = path.join(...[process.cwd(), '/app', filePath])
    const fileContents = fs.readFileSync(absoulutePath, 'utf-8')
    const config = yaml.load(fileContents)
    return config;
}

export async function saveInRedis(opts: {
    key: string;
    value: string | object;
    service: string;
}) {
    const { key, value, service} = opts;
    console.log(opts)
    const encryptionKey = process.env[`ENCRYPTION_KEY_${service.toUpperCase().replace(/-/g, "_")}`];
    console.log(encryptionKey)
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    });

    const stringifiedValue =  typeof value === "object" ? JSON.stringify(value) : value;
    const encryptedValue = encrypt(stringifiedValue, Buffer.from(encryptionKey, "base64url"));

    await redis.set(key, encryptedValue)
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
}) {
    const {   
        clientId,
        clientSecret,
        redirectUri,
        scopes,
        authUrl,
        tokenUrl,
        service,
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
    console.log('appAuthUrl:', appAuthUrl)
    const key = `app:${appUuid}`;

    const value = {
        clientId,
        clientSecret,
        redirectUri,
        scopes,
        appAuthUrl,
        tokenUrl,
        service,
        tokens: []
    };

    await saveInRedis({key, value, service});

    return appUuid;
}