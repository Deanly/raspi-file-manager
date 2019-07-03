import { FileNameParser } from "../helpers/file-name-parser";
import { list$Files, get$Files } from "../helpers/google-apis/google-drive";
import { readFsFile, File$Fs, createGdFileMedia } from "../models/file";
import { readFsFolder, createIfNotExistsFolder, Folder$GDrive, readFsOneFileInFolder } from "../models/folder";

import winston from "winston";

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
    disableBatch?: boolean;
}

let lock_upload_files = false;
let upload_file_index = 0;

export async function uploadSourceFilesToGoogleDrive(sourcePath?: string, rootFolderId?: string): Promise<void> {
    const file = await readFsOneFileInFolder(sourcePath || sourceFolderPath, upload_file_index);

    if (file) {
        if (lock_upload_files) return;
        lock_upload_files = true;
        const timeout = setTimeout(() => { lock_upload_files = false; }, 60000);

        if (file instanceof File$Fs) {
            const nameData = fileNameParser.parse(file.basename, true);
            const filePath = Object.keys(nameData)
                .reduce((acc, key) => acc.replace(new RegExp(key, "g"), nameData[key]), targetFilePathFormat);
            const tempPath = filePath.split("/");
            const fileName = tempPath.pop();

            const leafFolder = await createFoldersInGoogleDrive(tempPath.join("/"), rootFolderId);
            await createGdFileMedia({ name: fileName, fsPath: file.fsPath, folderId: leafFolder.id });

            // TODO(dean): backup files to other disks
            await file.delete();
            winston.info(`[FILE][UP]${file.basename}, ${file.bytes}bytes`);
        } else {
            upload_file_index++;
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

function backupLocalFile(sourcePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
    });
}

function startBatchProcesses() {
    setInterval(uploadSourceFilesToGoogleDrive, 5000);
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

    if (!options.disableBatch) startBatchProcesses();
}