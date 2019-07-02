import { delete$Files, get$Files, update$Files, create$Files } from "../helpers/google-apis/google-drive";
import { drive_v3 } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as stream from "stream";

const MIME_TYPES = {
    ".mkv": "video/x-matroska",
};

interface File {
    basename: string;
    name: string;
    ext: string;
    path: string;
    bytes: number;

    accessTime: Date;
    modifyTime: Date;
    createTime: Date;

    readable: boolean;
    writable: boolean;
}

export class File$Fs implements File {
    path: string;

    constructor(
        public fsPath: string,
        private stats: fs.Stats,
    ) {
        // if (stats.mode & 0x8000) throw new Error("Not type file");
        if (!stats.isFile()) throw new Error("Not type file");
        this.path = fsPath;
    }

    get basename(): string {
        return path.basename(this.path);
    }
    get ext(): string {
        return path.extname(this.path);
    }
    get name(): string {
        return this.basename.replace(new RegExp("\\" + this.ext + "$"), "");
    }

    get createTime(): Date {
        return this.stats.birthtime;
    }
    get accessTime(): Date {
        return this.stats.atime;
    }
    get modifyTime(): Date {
        return this.stats.mtime;
    }
    get bytes(): number {
        return this.stats.size;
    }
    get readable(): boolean {
        // return this.stats.mode & 4 ? true : false; // otherRead
        return this.stats.mode & 40 ? true : false; // groupRead
        // return this.stats.mode & 400 ? true : false; // ownerRead
    }
    get writable(): boolean {
        // return this.stats.mode & 2 ? true : false; // otherWrite
        return this.stats.mode & 20 ? true : false; // groupWrite
        // return this.stats.mode & 200 ? true : false; // ownerWrite
    }
    get executable(): boolean {
        // return this.stats.mode & 1 ? true : false; // otherExecute
        return this.stats.mode & 10 ? true : false; // groupExecute
        // return this.stats.mode & 100 ? true : false; // ownerExecute
    }

    deleteFs(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

export async function readFsFile (filePath: string): Promise<File$Fs> {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (err) return reject(err);
            try {
                resolve(new File$Fs(filePath, stats));
            } catch (e) {
                reject(e);
            }
        });
    });
}

export class File$GDrive implements File {

    static REQUIRED_FIELDS = "id,name,parents,mimeType,originalFilename,fileExtension,webContentLink,size,viewedByMeTime,modifiedTime,createdTime,capabilities";

    private schema: drive_v3.Schema$File;

    deleted: boolean;

    constructor(fileSchema: drive_v3.Schema$File) {
        this.schema = fileSchema;
        this.deleted = false;
    }

    get basename(): string {
        return this.schema.originalFilename;
    }
    get name(): string {
        return this.schema.name;
    }
    get ext(): string {
        return this.schema.fileExtension;
    }
    get path(): string {
        return this.schema.webContentLink;
    }
    get bytes(): number {
        return parseInt(this.schema.size);
    }
    get accessTime(): Date {
        return new Date(this.schema.viewedByMeTime);
    }
    get modifyTime(): Date {
        return new Date(this.schema.modifiedTime);
    }
    get createTime(): Date {
        return new Date(this.schema.createdTime);
    }
    get readable(): boolean {
        return this.schema.capabilities.canReadRevisions;
    }
    get writable(): boolean {
        return this.schema.capabilities.canEdit;
    }

    get id(): string {
        return this.schema.id;
    }

    get commentable(): boolean {
        return this.schema.capabilities.canComment;
    }

    get parents(): Array<string> {
        return this.schema.parents;
    }

    async delete(): Promise<void> {
        await delete$Files({
            fileId: this.schema.id
        });
        this.schema.trashed = true;
        this.deleted = true;
    }

    async move(folderId: string): Promise<void> {
        const previousFile = await get$Files({
            fileId: this.schema.id,
            fields: "parents"
        });

        const result = await update$Files({
            fileId: this.schema.id,
            addParents: folderId,
            removeParents: previousFile.parents.join(","),
            fields: "id, parents"
        });

        this.schema.parents = result.parents;
    }

    async fetch(): Promise<void> {
        this.schema = await get$Files({ fileId: this.id, fields: File$GDrive.REQUIRED_FIELDS });
    }

}

export async function createGdFileMedia(options: { name: string, fsPath: string, mimeType?: string, folderId?: string }): Promise<File$GDrive> {
    return new File$GDrive(await create$Files({
        media: {
            mimeType: options.mimeType,
            body: fs.createReadStream(options.fsPath)
        },
        requestBody: {
            name: options.name,
            parents: options.folderId ? [options.folderId] : [],
        },
        fields: File$GDrive.REQUIRED_FIELDS
    }));
}

export async function readGdFile(fileId: string): Promise<File$GDrive> {
    return new File$GDrive(await get$Files({
        fileId,
        fields: File$GDrive.REQUIRED_FIELDS
    }));
}
