import * as path from "path"
import fs from "fs"
import yaml from 'js-yaml'
import { json } from "@remix-run/node"

export async function readYaml(filePath: string) {
    console.log(process.cwd())
    console.log(filePath)
    const absoulutePath = path.join(...[process.cwd(), '/app', filePath])
    const fileContents = fs.readFileSync(absoulutePath, 'utf-8')
    const config = yaml.load(fileContents)
    return config;
}

export async function getAuthUrl(opts: {clientId: string, clientSecret: string, redirectUri: string, scope: string, authUrl: string}) {
    const params = new URLSearchParams({
        client_id: opts.clientId,
        response_type: "code",
        redirect_uri: opts.redirectUri,
        scope: opts.scope
    })

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

    
    return json({access_token: "foo"})
}