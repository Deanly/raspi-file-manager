import * as assert from "assert";
import * as fs from "fs";
import * as rimraf from "rimraf";
import * as path from "path";
import { readFsFolder } from "../../src/models/folder";
import { init, uploadSourceFilesToGoogleDrive } from "../../src/controllers/file-uploader";

const sourceLocalFolderPath = path.normalize(path.join(__dirname, "..", "dummy"));
const firstFilePath = path.join(sourceLocalFolderPath, "0-92-20190624090104.mkv");
const secondFilePath = path.join(sourceLocalFolderPath, "0-92-20190625144850.mkv");


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

describe("Firing trigger module test", () => {
    it("Getting upload source files to google-drive", async () => {
        await init();
        console.log("Test")
        await uploadSourceFilesToGoogleDrive(sourceLocalFolderPath);
    });

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

describe.skip("Deleting files from Google Drive", () => {
    it("Delete files expired only");

    it("Delete all test files");
});
