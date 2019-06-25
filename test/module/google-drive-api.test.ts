import { authorize, jwt, getFileList } from "../../src/storage/google-drive/google-drive-api";
import dotenv from "dotenv";
import * as assert from "assert";

dotenv.config({ path: ".env" });

describe("Getting Authorized to service account", () => {
    it("Getting certified from Google", async () => {
        await authorize();
        assert.ok(jwt);
    });

    it("Reading drive files", async () => {
        const list = await getFileList({ });
        console.log("files", list.files)
        assert.ok(list.files.length > 0);
    });
});

describe("Searching and getting read to files from Google Drive", () => {

});
