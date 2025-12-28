import {
  getFileStreamAndMetadata,
  streamToBuffer,
} from "~/utils/backend.api.utils";
import { ActionCtx } from ".";

export async function uploadFileToDropbox(params: ActionCtx) {
  const { accessToken, input } = params;

  const { directory, fileName, publicFileUrl, binaryFileData } =
    JSON.parse(input);

  const downloadPublicFile = async (fileUrl: string) => {
    const { stream, metadata } = await getFileStreamAndMetadata(fileUrl);
    const buffer = await streamToBuffer(stream);
    const binary = buffer.toString("binary");
    return { name: metadata.name as string, content: binary };
  };

  const { name, content } = publicFileUrl
    ? await downloadPublicFile(publicFileUrl)
    : { name: fileName, content: binaryFileData };

  const url = "https://content.dropboxapi.com/2/files/upload";
  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `${directory}/${name}`,
        mode: "add",
        autorename: true,
      }),
      "Content-Type": "application/octet-stream",
    },
    body: content,
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    return Response.json({ error: response.text }, { status: response.status });
  }

  return await response.json();
}
