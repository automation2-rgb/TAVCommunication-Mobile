import { File, Paths } from 'expo-file-system';



import type { SendMessageFile } from '@/lib/api-client';
import { formatByteSize, MMS_MAX_BYTES, normalizeMimeType } from '@/lib/messaging/mms-policy';



export const MMS_SEND_TIMEOUT_MS = 60_000;



export type PreparedUploadFile = {

  uri: string;

  name: string;

  mimeType: string;

  cleanup: () => void;

};



export type MmsUploadResponse = {

  status: number;

  body: string;

  headers: Record<string, string>;

};



type ReactNativeFormDataFile = {

  uri: string;

  name: string;

  type: string;

};



function sanitizeUploadFilename(name: string) {

  const trimmed = name.trim().replace(/[/\\?%*:|"<>]/g, '_');

  if (trimmed && trimmed.includes('.')) {

    return trimmed.slice(0, 120);

  }

  return `attachment-${Date.now()}.jpg`;

}



function uniqueCacheName(filename: string) {

  const suffix = Math.random().toString(36).slice(2, 8);

  return `mms-${Date.now()}-${suffix}-${filename}`;

}



function shouldStageInCache(uri: string) {

  const lower = uri.toLowerCase();

  return (

    !lower.startsWith('file://') ||

    lower.startsWith('content://') ||

    lower.startsWith('ph://') ||

    lower.startsWith('assets-library://')

  );

}



async function copyToCache(source: File, filename: string): Promise<File> {

  const dest = new File(Paths.cache, uniqueCacheName(filename));

  const copyResult = source.copy(dest, { overwrite: true }) as void | Promise<void>;



  if (copyResult instanceof Promise) {

    await copyResult;

  }



  if (!dest.exists || dest.size <= 0) {

    throw new Error(`Unable to stage attachment ${filename} for upload.`);

  }



  return dest;

}



async function resolveUploadUri(source: File, filename: string): Promise<{ uri: string; cleanup: () => void }> {

  if (!shouldStageInCache(source.uri)) {

    return { uri: source.uri, cleanup: () => {} };

  }



  try {

    const cached = await copyToCache(source, filename);

    return {

      uri: cached.uri,

      cleanup: () => {

        try {

          cached.delete();

        } catch {

          // Best-effort cache cleanup.

        }

      },

    };

  } catch {

    return { uri: source.uri, cleanup: () => {} };

  }

}



export async function prepareUploadFile(file: SendMessageFile): Promise<PreparedUploadFile> {
  const name = sanitizeUploadFilename(file.name);
  const fallbackMimeType = normalizeMimeType(file.type) || 'image/jpeg';

  const source = new File(file.uri);



  if (!source.exists) {
    throw new Error(`Unable to read attachment ${name}.`);
  }



  if (source.size <= 0) {
    throw new Error(`Attachment ${name} is empty.`);
  }

  const mimeType =
    normalizeMimeType(file.type) ||
    normalizeMimeType(source.type) ||
    fallbackMimeType;

  if (source.size > MMS_MAX_BYTES) {
    throw new Error(`Each file must be ${formatByteSize(MMS_MAX_BYTES)} or smaller.`);
  }

  const { uri, cleanup: stagingCleanup } = await resolveUploadUri(source, name);

  return {
    uri,
    name,
    mimeType,
    cleanup: stagingCleanup,
  };
}



export async function prepareUploadFiles(files: SendMessageFile[]) {

  const prepared = await Promise.all(files.map((file) => prepareUploadFile(file)));



  return {

    prepared,

    cleanup: () => {

      for (const item of prepared) {

        item.cleanup();

      }

    },

  };

}



function toReactNativeFormDataFile(prepared: PreparedUploadFile): ReactNativeFormDataFile {

  return {

    uri: prepared.uri,

    name: prepared.name,

    type: prepared.mimeType,

  };

}



/** Production API expects repeated `attachment` parts (same as web inbox). */

export function appendUploadFileToFormData(formData: FormData, prepared: PreparedUploadFile) {

  formData.append('attachment', toReactNativeFormDataFile(prepared) as unknown as Blob);

}



export function mmsUploadResponseToFetchResponse(result: MmsUploadResponse): Response {

  return new Response(result.body, {

    status: result.status,

    headers: result.headers,

  });

}



/**

 * React Native's XHR stack accepts { uri, name, type } multipart parts.

 * expo/fetch and File.upload produce requests the production API does not parse as files.

 */

export function postMultipartMessage(

  url: string,

  parameters: Record<string, string>,

  prepared: PreparedUploadFile[],

  headers: Record<string, string>,

): Promise<MmsUploadResponse> {

  const formData = new FormData();



  for (const [key, value] of Object.entries(parameters)) {

    formData.append(key, value);

  }



  for (const item of prepared) {

    appendUploadFileToFormData(formData, item);

  }



  return new Promise((resolve, reject) => {

    const xhr = new XMLHttpRequest();

    xhr.open('POST', url);

    xhr.responseType = 'text';

    xhr.timeout = MMS_SEND_TIMEOUT_MS;



    for (const [key, value] of Object.entries(headers)) {

      xhr.setRequestHeader(key, value);

    }



    xhr.onload = () => {

      resolve({

        status: xhr.status,

        body: typeof xhr.response === 'string' ? xhr.response : '',

        headers: {},

      });

    };



    xhr.onerror = () => {

      reject(new Error('Network request failed while uploading attachment.'));

    };



    xhr.ontimeout = () => {

      reject(new Error('Attachment upload timed out. Try a smaller photo or check your connection.'));

    };



    xhr.send(formData);

  });

}



export function readComposerFileSize(uri: string): number | undefined {

  try {

    const source = new File(uri);

    if (source.exists && source.size > 0) {

      return source.size;

    }

  } catch {

    // Picker may return a URI that is not readable until send time.

  }



  return undefined;

}

