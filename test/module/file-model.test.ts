import * as assert from "assert";
import * as path from "path";
import {} from "../../src/models/file";
import { readFsFolder, readGdFolder } from "../../src/models/folder";

describe.skip("Getting created files and folder", () => {
    it("Create folder instance by fs path", async () => {
        const folder = await readFsFolder(path.join(__dirname, "..", ".."));
        assert.ok(folder.files.length > 0);
    });

    it("Getting parsed a drive files to tree data", async () => {
        const folder = await readGdFolder(dummyParentId);
        console.log(">>>>>", folder.countTotalFiles, folder.bytesTotalFiles);
    }, 100000);
});

const dummyParentId = "1T4GeobLoUujGQQZmwauojewqZocPbHW7";
