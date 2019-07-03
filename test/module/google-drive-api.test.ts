import * as assert from "assert";

import {
    authorize, jwt, list$Files, clearJwt, createFolder, delete$Files, get$Files, create$Files
} from "../../src/helpers/google-apis/google-drive";
import { drive_v3 } from "googleapis";
import { setTimeoutPromise } from "../../src/helpers/utils";

let rootFolderId: string;
describe.skip("Getting Authorized to service account", () => {
    it("Getting certified from Google", async () => {
        await authorize();
        assert.ok(jwt);
        clearJwt();
        assert.ok(!jwt);
    });

    it("Auto authorized", async () => {
        const list = await list$Files(undefined, true);
        // console.log(list);
        rootFolderId = list.files.find(f => f.name === process.env.G_ROOT_FOLDER_NAME_UPLOADING).id;
        assert.ok(list.files.length > 0);
    });

    let temp_f: drive_v3.Schema$File;

    it("Getting created a folder", async () => {
        temp_f = (await createFolder("test-01", rootFolderId));
    });

    it("Getting delete a folder", async () => {
        await delete$Files({
            fileId: temp_f.id
        });
        try {
            temp_f = await get$Files({
                fileId: temp_f.id
            });
        } catch (e) {
            return assert.ok(e.code === 404);
        }
        assert.ok(false);
    });

    it("Getting write a text file", async () => {
        temp_f = await create$Files({
            requestBody: {
                mimeType: "text/plain",
                name: "unit-test-01",
                parents: [
                    rootFolderId
                ]
            }
        });
        temp_f = await get$Files({
            fileId: temp_f.id
        });

        assert.ok(temp_f.name === "unit-test-01");
    });

    it("Getting delete a text file", async () => {
        await delete$Files({
            fileId: temp_f.id
        });
        try {
            temp_f = await get$Files({
                fileId: temp_f.id
            });
        } catch (e) {
            return assert.ok(e.code === 404);
        }
        assert.ok(false);
    });

    it("Getting delete folder having files", async () => {
        const folder = await createFolder("test-01", rootFolderId);
        const file = await create$Files({
            requestBody: {
                mimeType: "text/plain",
                name: "unit-test-02",
                parents: [
                    folder.id
                ]
            }
        });
        temp_f = undefined;

        await delete$Files({
            fileId: folder.id
        });
        await setTimeoutPromise(async () => {}, 4000);
        try {
            temp_f = await get$Files({
                fileId: file.id,
                fields: "id,name,parents,originalFilename,fileExtension,webContentLink,size,viewedByMeTime,modifiedTime,createdTime,canReadRevisions,canEdit,canComment",
            });
        } catch (e) {
            return assert.ok(e.code === 404);
        }
        assert.ok(!temp_f);
    }, 10000);
});
