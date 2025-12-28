import { Readable } from "stream";
import { basename, join } from "path";
import * as mime from "mime-types";
import { v4 as uuidv4 } from "uuid";
import { tmpdir } from "os";
import { createReadStream, createWriteStream, promises as fs, Stats } from "fs";
import { pipeline } from "stream/promises";

function isUrl(pathOrUrl: string): boolean {
  try {
    new URL(pathOrUrl);
    return true;
  } catch {
    return false;
  }
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export interface FileMetaData {
  size: number;
  contentType?: string;
  lastModified?: Date;
  name?: string;
  etag?: string;
}

export async function getFileStreamAndMetadata(
  pathOrUrl: string,
): Promise<{ stream: Readable; metadata: FileMetaData }> {
  if (isUrl(pathOrUrl)) {
    return await getRemoteFileStreamAndMetadata(pathOrUrl);
  } else {
    return await getLocalFileStreamAndMetadata(pathOrUrl);
  }
}

export async function getRemoteFileStreamAndMetadata(url: string) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to fetch $url}: ${response.text} ${response.status}`,
    );
  }

  const headers = response.headers;
  const contentLength = headers.get("content-length");
  const lastModified = headers.get("last-modified")
    ? new Date(headers.get("last-modified")!)
    : undefined;
  const etag = headers.get("etag") || undefined;
  const urlObj = new URL(url);
  const name = basename(urlObj.pathname);
  const contentType =
    headers.get("content-type") || mime.lookup(urlObj.pathname) || undefined;

  const baseMetadata = {
    contentType,
    lastModified,
    name,
    etag,
  };

  if (contentLength) {
    const metadata = {
      ...baseMetadata,
      size: parseInt(contentLength, 10),
    };
    const stream = Readable.fromWeb(
      response.body as ReadableStream<Uint8Array>,
    );
    return {
      stream,
      metadata,
    };
  }

  return downloadToTemporaryFile(response, baseMetadata);
}

async function downloadToTemporaryFile(
  response: Response,
  baseMetadata: Partial<FileMetaData>,
) {
  const tempFileName = `file-stream-${uuidv4()}`;
  const tempFilePath = join(tmpdir(), tempFileName);

  const fileStream = createWriteStream(tempFilePath);
  const webStream = Readable.fromWeb(
    response.body as ReadableStream<Uint8Array>,
  );

  try {
    await pipeline(webStream, fileStream);
    const stats = await fs.stat(tempFilePath);
    const metadata: FileMetaData = {
      ...baseMetadata,
      size: stats.size,
    };
    const stream = createReadStream(tempFilePath);

    const cleanup = async () => {
      try {
        fs.unlink(tempFilePath);
      } catch {
        //ignore cleanup errors
      }
    };

    stream.once("close", cleanup);
    stream.once("end", cleanup);
    stream.once("error", cleanup);

    return {
      stream,
      metadata,
    };
  } catch (err) {
    //Cleanup on error
    try {
      fs.unlink(tempFilePath);
    } catch {
      //ignore
    }
    throw err;
  }
}

async function safeStat(path: string): Promise<Stats> {
  try {
    return await fs.stat(path);
  } catch {
    throw new Error(`File not found ${path}`);
  }
}
async function getLocalFileStreamAndMetadata(
  filePath: string,
): Promise<{ stream: Readable; metadata: FileMetaData }> {
  const stats = await safeStat(filePath);
  const contentType = mime.lookup(filePath) || undefined;
  const metadata: FileMetaData = {
    size: stats.size,
    lastModified: stats.mtime,
    name: basename(filePath),
    contentType,
  };

  const stream = createReadStream(filePath);

  return {
    stream,
    metadata,
  };
}
