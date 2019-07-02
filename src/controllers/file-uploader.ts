import { FileNameParser } from "../helpers/file-name-parser";
import { list$Files, get$Files } from "../helpers/google-apis/google-drive";
import { readFsFile, File$Fs } from "../models/file";
import { readFsFolder, createIfNotExistsFolder, Folder$GDrive } from "../models/folder";

// google
export let targetFolderId: string;
export let targetFilePathFormat: string;

// file system
export let sourceFolderPath: string;
export let fileNameParser: FileNameParser;

interface InitializeParamOptions {
    sourceFolderPath?: string;
    sourceFileNameSeparator?: string;
    sourceFileNameFormat?: string;
    googleRootFolderNameForUploading?: string;
    googleRootFolderIdForUploading?: string;
    googleFilePathFormatForUploading?: string;
}

let lock_upload_files = false;

export async function uploadSourceFilesToGoogleDrive(sourcePath: string): Promise<File$Fs> {
    const folder = await readFsFolder(sourcePath);

    if (folder.count > 0) {
        if (lock_upload_files) return;
        lock_upload_files = true;
        const timeout = setTimeout(() => { lock_upload_files = false; }, 60000);

        for (const file of folder.child) {
            if (file instanceof File$Fs) {
                const nameData = fileNameParser.parse(file.basename, true);
                const filePath = Object.keys(nameData)
                    .reduce((acc, key) => acc.replace(new RegExp(key, "g"), nameData[key]), targetFilePathFormat);
                const tempPath = filePath.split("/");
                tempPath.pop();

                await createFoldersInGoogleDrive(tempPath.join("/"), targetFolderId);
            }
        }
        lock_upload_files = false;
        clearTimeout(timeout);
    }
}

async function createFoldersInGoogleDrive(slashPath: string, rootFolderId?: string): Promise<Folder$GDrive> {
    const levels = slashPath.split("/");
    let parentId: string = rootFolderId || targetFolderId;
    let leaf: Folder$GDrive;

    for (const name of levels) {
        leaf = await createIfNotExistsFolder(parentId, name);
        parentId = leaf.id;
    }

    return leaf;
}

async function upload (): Promise<void> {

}

export async function init(options: InitializeParamOptions = {}): Promise<void> {
    targetFolderId = options.googleRootFolderIdForUploading || process.env.G_ROOT_FOLDER_ID_UPLOADING;

    if (!targetFolderId) {
        const folderName = options.googleRootFolderNameForUploading || process.env.G_ROOT_FOLDER_NAME_UPLOADING;
        const filesList = await list$Files({ q: `name = '${folderName}'` });

        if (filesList.files.length > 0) {
            targetFolderId = filesList.files[0].id;
        }
    }

    if (targetFolderId) {
        const file = await get$Files({ fileId: targetFolderId });
        if (!file.mimeType.includes("folder")) {
            throw new Error("Not found target folder in drive");
        }
    } else {
        throw new Error("No target folder id");
    }

    sourceFolderPath = options.sourceFolderPath || process.env.SOURCE_LOCAL_PATH;
    targetFilePathFormat = options.googleFilePathFormatForUploading || process.env.G_FILE_PATH_FORMAT_UPLOADING;

    fileNameParser = new FileNameParser(
        options.sourceFileNameSeparator || process.env.SOURCE_FILE_NAME_SEPARATORS,
        options.sourceFileNameFormat || process.env.SOURCE_FILE_NAME_FORMAT);
}