import { google, drive_v3 } from "googleapis";
import { JWT, Credentials } from "google-auth-library";
import { GaxiosResponse } from "gaxios";
import { setTimeoutPromise } from "../utils";

const SCOPES = ['https://www.googleapis.com/auth/drive'];


export const MimeType = {
    G_AUDIO: "application/vnd.google-apps.audio",
    G_DOCS: "application/vnd.google-apps.document",
    G_DRAWING: "application/vnd.google-apps.drawing",
    G_FILE: "application/vnd.google-apps.file",
    G_FOLDER: "application/vnd.google-apps.folder",
    G_FORM: "application/vnd.google-apps.form",
    G_FUSION: "application/vnd.google-apps.fusiontable",
    G_MAP: "application/vnd.google-apps.map",
    G_PHOTO: "application/vnd.google-apps.photo",
    G_SLIDES: "application/vnd.google-apps.presentation",
    G_SCRIPT: "application/vnd.google-apps.script",
    G_SITE: "application/vnd.google-apps.site",
    G_SHEETS: "application/vnd.google-apps.spreadsheet",
    G_UNKNOWN: "application/vnd.google-apps.unknown",
    G_VIDEO: "application/vnd.google-apps.video",
    G_SDK: "application/vnd.google-apps.drive-sdk",
};


// Authorization
export let jwt: JWT;
let credentials: Credentials;

export function clearJwt() {
    jwt = undefined;
}

export async function authorize(): Promise<void> {
    jwt = new google.auth.JWT({
        email: process.env.G_CLIENT_EMAIL,
        key: process.env.G_PRIVATE_KEY,
        scopes: SCOPES,
    });

    credentials = await jwt.authorize();

    return void 0;
}

const MAXIMUM_RETRY = 3;

async function request(api: () => Promise<GaxiosResponse>, retry: number = 0): Promise<GaxiosResponse> {
    let response, error;
    try {
        response = await api();
    } catch (e) {
        response = e.response;
        error = e;
    }

    switch (response.status) {
        case 200: case 201: case 202: case 203: case 204: case 205: case 206: case 207: case 208:
            return response;
        case 401:
        case 403:
            if (retry >= MAXIMUM_RETRY) throw error;
            await authorize();
            return setTimeoutPromise(async () => await request(api, retry + 1), 300);
        case 404:
        default:
            throw error;
    }
}


export async function list$Files(options: drive_v3.Params$Resource$Files$List = {}, details?: boolean): Promise<drive_v3.Schema$FileList> {
    const drive = google.drive({ version: "v3" });

    if (details) options.fields = "nextPageToken,files(id,name,parents,mimeType,originalFilename,fileExtension,webContentLink,size,viewedByMeTime,modifiedTime,createdTime,capabilities)";

    const response = await request(async () =>
            await drive.files.list({
                auth: jwt,
                ...options
            })
        );

    return response.data;
}

export async function get$Files(options?: drive_v3.Params$Resource$Files$Get): Promise<drive_v3.Schema$File> {
    const drive = google.drive({ version: "v3" });

    const response = await request(async () =>
            await drive.files.get({
                auth: jwt,
                ...options
            })
        );

    return response.data;
}

export async function create$Files(options?: drive_v3.Params$Resource$Files$Create): Promise<drive_v3.Schema$File> {
    const drive = google.drive({ version: "v3" });

    const response = await request(async () =>
            await drive.files.create({
                auth: jwt,
                ...options
            })
        );

    return response.data;
}

export async function createFolder(
    name: string,
    folderId: string,
): Promise<drive_v3.Schema$File> {
    const drive = google.drive({ version: "v3" });

    const response = await request(async () =>
            await drive.files.create({
                auth: jwt,
                requestBody: {
                    name,
                    parents: [
                        folderId
                    ],
                    mimeType: MimeType.G_FOLDER
                }
            })
        );

    return response.data;
}

export async function update$Files(options?: drive_v3.Params$Resource$Files$Update): Promise<drive_v3.Schema$File> {
    const drive = google.drive({ version: "v3" });

    const response = await request(async () =>
        await drive.files.update({
            auth: jwt,
            ...options
        })
    );

    return response.data;
}

export async function delete$Files(options?: drive_v3.Params$Resource$Files$Delete): Promise<void> {
    const drive = google.drive({ version: "v3" });

    const response = await request(async () =>
            await drive.files.delete({
                auth: jwt,
                ...options
            })
        );

    return response.data;
}
