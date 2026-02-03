import jwt from "jsonwebtoken";

// export function signJWT({
//   payload,
//   secretKey,
//   options
// }: {
//   payload: Record<string, string|number>;
//   secretKey: string | Buffer;
//   options: object;
// }): string {
//   try {
//     return jwt.sign(payload, secretKey, options);
//   } catch (err) {
//     throw new Error("Failed to sign", {cause: err});
//   }
// }

// export function verifyJwt(token: string): Record<string, unknown> | null {
//   const secretOrPublicKey = process.env["CM_JWT_SECRET"];
//   console.log(`secretKey: ${secretOrPublicKey}`);
//   try {
//     const decodedVal = jwt.verify(token, secretOrPublicKey!);
//     console.log(`decodedVal: ${decodedVal}`);
//     return decodedVal as Record<string, unknown>;
//   } catch (error) {
//     console.log(error);
//     return null;
//   }
// }

export function verifyJwt(token: string): Record<string, unknown> | null {
  const secret = process.env.CM_JWT_SECRET?.trim();

  if (!secret) {
    return null;
  }

  try {
    return jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as Record<string, unknown>;
  } catch (err) {
    return null;
  }
}

// export function createJWTCredentials({
//   config,
//   provider,
//   dynamicCredentials
// }: {
//   config: string;
//   provider: ProviderJwt | ProviderTwoStep;
//   dynamicCredentials: Record<string, any>
// }) {
// }
