import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";
import dotenv from "dotenv";
import path from "path";

import { init as initFileUploader } from "./controllers/file-uploader";

dotenv.config({ path: ".env" });

const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

app.use(
    express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

// TODO(dean): Adding http event trigger using expressjs


// Bootstrap
(async function () {
    /*1*/ await initFileUploader();
})();

export default app;