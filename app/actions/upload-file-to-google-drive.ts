import {
  getFileStreamAndMetadata,
  streamToBuffer,
} from "~/utils/backend.api.utils";
import { ActionCtx } from ".";

export async function uploadFileToGoogleDrive(params: ActionCtx) {
  const { accessToken, input } = params;
  const { publicFileUrl } = JSON.parse(input);

  const downloadPublicFile = async (fileUrl: string) => {
    const { stream, metadata } = await getFileStreamAndMetadata(fileUrl);
    const buffer = await streamToBuffer(stream);
    const binary = buffer.toString("binary");
    return {
      name: metadata.name,
      content: binary,
      contentType: metadata.contentType,
    };
  };

  const { name, content, contentType } =
    await downloadPublicFile(publicFileUrl);

  const createFileResponse = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name }),
    },
  );

  if (!createFileResponse.ok || !createFileResponse.body) {
    return Response.json(
      { error: createFileResponse.text },
      { status: createFileResponse.status },
    );
  }

  const { fileId } = await createFileResponse.json();
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}}`;

  const requestOptions: RequestInit = {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body: content,
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    return Response.json(
      { error: response.statusText },
      { status: response.status },
    );
  }

  return await response.json();
}
