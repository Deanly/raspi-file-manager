import * as assert from "assert";
import * as fs from "fs";
import * as rimraf from "rimraf";
import * as path from "path";
import { readFsFolder } from "../../src/models/folder";
import { init, uploadSourceFilesToGoogleDrive, targetFolderId } from "../../src/controllers/file-uploader";
import { createFolder, delete$Files } from "../../src/helpers/google-apis/google-drive";
import { drive_v3 } from "googleapis";

const sourceLocalFolderPath = path.normalize(path.join(__dirname, "..", "dummy"));
const firstFilePath = path.join(sourceLocalFolderPath, "0-92-19880315030104.mkv");
const secondFilePath = path.join(sourceLocalFolderPath, "0-93-20100625144850.mkv");


describe("Getting detected when creating new files", () => {
    it("Creating test files, first", async () => {
        fs.mkdirSync(sourceLocalFolderPath);
        fs.writeFileSync(firstFilePath, "test");
    });

    it("Getting detected, first", async () => {
        const folder = await readFsFolder(sourceLocalFolderPath);
        assert.ok(folder.count === 1);
    });

    it("Creating test files, second", async () => {
        fs.writeFileSync(secondFilePath, "test");
    });

    it("Getting detected, second", async () => {
        const folder = await readFsFolder(sourceLocalFolderPath);
        assert.ok(folder.count === 2);
    });
});

let testGoogleFolder: drive_v3.Schema$File;

describe("Firing trigger module test", () => {
    it("Getting upload source files to google-drive", async () => {
        await init({  disableBatch: true });
        testGoogleFolder = await createFolder("test", targetFolderId);
        await uploadSourceFilesToGoogleDrive(sourceLocalFolderPath, testGoogleFolder.id);
    }, 60000);
});


describe.skip("Uploading files to Google Drive", () => {
    it("Getting structured to folders");

    it("Upload");
});

describe("Cleaning up files in locally", () => {
    it.skip("Move to others", () => {

    });

    it.skip("Delete files expired only", () => {

    });

    it("Delete all test files", () => {
        rimraf.sync(path.join(sourceLocalFolderPath));
    });
});

describe("Getting Delete files from Google Drive", () => {
    it.skip("Delete files expired only", () => {

    });

    it("Delete all test files", async () => {
        await delete$Files({
            fileId: testGoogleFolder.id
        });
    });
});
