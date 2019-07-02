import * as fs from "fs";
import * as path from "path";
import { File$Fs, File$GDrive } from "./file";
import { drive_v3 } from "googleapis";
import { MimeType, delete$Files, list$Files, get$Files, create$Files } from "../helpers/google-apis/google-drive";

interface Folder {
    name: string;
    path: string;
    bytesTotalFiles: number;
    countTotalFiles: number;
    count: number;
    child: Array<any>;

    accessTime: Date;
    modifyTime: Date;
    createTime: Date;

    readable: boolean;
    writable: boolean;
}

class Folder$Fs implements Folder {
    name: string;
    path: string;
    child: Array<File$Fs | Folder$Fs> = [];

    constructor(
        public fsPath: string,
        private stats: fs.Stats,
    ) {
        // if (stats.mode & 0x4000) throw new Error("Not type directory");
        if (!stats.isDirectory()) throw new Error("Not type directory");

        this.name = path.basename(fsPath);
        this.path = fsPath;
    }

    get bytesTotalFiles(): number {
        return this.child.reduce(
            (acc, curr) => acc + (curr instanceof Folder$Fs ? curr.bytesTotalFiles : curr.bytes), 0);
    }
    get countTotalFiles(): number {
        return this.child.filter(c => c instanceof File$Fs).length +
            this.child.reduce((acc, curr) => acc + (curr instanceof Folder$Fs ? curr.countTotalFiles : 0), 0);
    }
    get count(): number {
        return this.child.length;
    }

    get files(): Array<File$Fs> {
        return this.child.filter(item => item instanceof File$Fs) as Array<File$Fs>;
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

}

async function fs_statSync(p: string): Promise<fs.Stats> {
    return new Promise((resolve, reject) => {
        fs.stat(p, (err, stats) => {
            if (err) return reject(err);
            resolve(stats);
        });
    });
}

export async function readFsFolder(folderPath: string): Promise<Folder$Fs> {
    return new Promise((resolve, reject) => {
        fs.stat(folderPath, (err, stats) => {
            if (err) return reject(err);

            let folder: Folder$Fs;
            try {
                folder = new Folder$Fs(folderPath, stats);
            } catch (e) {
                return reject(e);
            }

            fs.readdir(folderPath, async (err, namesList) => {
                if (err) return reject(err);

                let itemPath, itemStats;
                for (const itemName of namesList) {
                    itemPath = path.join(folderPath, itemName);
                    itemStats = await fs_statSync(itemPath);

                    if (itemStats.isDirectory()) {
                        folder.child
                            .push(await readFsFolder(itemPath));
                    } else {
                        folder.child
                            .push(new File$Fs(itemPath, itemStats));
                    }
                }

                return resolve(folder);
            });
        });
    });
}


export class Folder$GDrive implements Folder {

    static REQUIRED_FIELDS = "id,name,parents,mimeType,originalFilename,fileExtension,webContentLink,size,viewedByMeTime,modifiedTime,createdTime,capabilities";

    private schema: drive_v3.Schema$File;
    child: Array<File$GDrive | Folder$GDrive>;
    deleted: boolean;

    constructor(folderSchema: drive_v3.Schema$File) {
        if (folderSchema.mimeType !== MimeType.G_FOLDER) throw new Error(`Params is not folder ${folderSchema.id}:${folderSchema.mimeType}`);

        this.schema = folderSchema;
        this.deleted = false;
    }

    get bytesTotalFiles(): number {
        return this.child.reduce((acc, curr) => acc + (curr instanceof Folder$GDrive ? curr.bytesTotalFiles : curr.bytes), 0);
    }
    get countTotalFiles(): number {
        return this.child.filter(c => c instanceof File$GDrive).length +
            this.child.reduce((acc, curr) => acc + (curr instanceof Folder$GDrive ? curr.countTotalFiles : 0), 0);
    }

    get count(): number {
        return this.child.length;
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
        return 0;
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

    async fetch(): Promise<void> {
        this.schema = await get$Files({ fileId: this.id, fields: File$GDrive.REQUIRED_FIELDS });
        this.child = (await readGdFolder(this.id)).child;
    }

}

function linear2tree(linear: Array<drive_v3.Schema$File>, parent: Folder$GDrive): Folder$GDrive {
    const pureChild = linear.filter(sf => sf.parents.some((id) => id === parent.id));
    parent.child = pureChild.map(p => {
        if (p.mimeType === MimeType.G_FOLDER) {
            return linear2tree(linear, new Folder$GDrive(p));
        } else {
            return new File$GDrive(p);
        }
    });
    return parent;
}

export async function readGdFolder(folderId: string, deep: boolean = false): Promise<Folder$GDrive> {
    const folder = new Folder$GDrive(await get$Files({ fileId: folderId, fields: Folder$GDrive.REQUIRED_FIELDS }));
    let result: Array<drive_v3.Schema$File> = [];

    const collect = async (parentId: string, token?: string) => {
        const res = await list$Files({
            q: `'${parentId}' in parents`,
            pageToken: token,
        }, true);

        result = result.concat(res.files);

        if (res.nextPageToken) {
            await collect(parentId, res.nextPageToken);
        }

        if (deep) {
            const childFolders = res.files.filter(f => f.mimeType === MimeType.G_FOLDER);

            for (const childFolder of childFolders) {
                await collect(childFolder.id);
            }
        }
    };

    await collect(folderId);
    linear2tree(result, folder);

    return folder;
}

export async function createIfNotExistsFolder(parentId: string, name: string): Promise<Folder$GDrive> {
    const exists = await list$Files({
        q: `'${parentId}' in parents and name = '${name}' and mimeType = '${MimeType.G_FOLDER}'`,
    }, true);
    if (exists.files.length > 0) {
        return new Folder$GDrive(exists.files[0]);
    } else {
        const res = await create$Files({
            requestBody: {
                name,
                parents: [parentId],
                mimeType: MimeType.G_FOLDER,
            },
            fields: Folder$GDrive.REQUIRED_FIELDS
        });
        return new Folder$GDrive(res);
    }
}