import { createOrUpdateSalesforceRecord } from "./create-or-update-salesforce-record";
import { sendGmail } from "./send-gmail";
import { sendSlackMessage } from "./send-slack-message";
import { uploadFileToDropbox } from "./upload-file-to-dropbox";
import { uploadFileToGoogleDrive } from "./upload-file-to-google-drive";

export type ActionCtx = {
  accessToken: string;
  input: string;
};

type Actions = {
  [key: string]: (params: ActionCtx) => Promise<unknown>;
};

export const actions: Actions = {
  "create-or-update-salesforce-record": createOrUpdateSalesforceRecord,
  "send-slack-message": sendSlackMessage,
  "send-gmail": sendGmail,
  "upload-file-to-dropbox": uploadFileToDropbox,
  "upload-file-to-google-drive": uploadFileToGoogleDrive,
};
