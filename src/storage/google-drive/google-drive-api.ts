import { google, drive_v3 } from "googleapis";
import { JWT, Credentials } from "google-auth-library";

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export let jwt: JWT;
let credentials: Credentials;

export async function authorize(): Promise<void> {
    jwt = new google.auth.JWT({
        email: process.env.G_CLIENT_EMAIL,
        key: process.env.G_PRIVATE_KEY,
        scopes: SCOPES,
    });

    credentials = await jwt.authorize();

    return void 0;
}

export async function getFileList(options: drive_v3.Params$Resource$Files$List): Promise<drive_v3.Schema$FileList> {
    const drive = google.drive({ version: "v3" });

    const response = await drive.files.list({
        auth: jwt,
        ...options
    });

    return response.data;
}