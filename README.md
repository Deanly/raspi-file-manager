# Raspberry Pi File Manager
A server for moving motion cam files from Raspberry Pi to Google Drive. Allows to receive and process repeat functions and events.

## Run

1) Create a Google API service user and write private-key and client-email in `.env`

    Example file (`.env`)
    ```
    NODE_ENV=development

    # Google API
    ## Authorization
    G_CLIENT_EMAIL="!@#!@#.iam.gserviceaccount.com"
    G_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..!@#!@# ..-----END PRIVATE KEY-----\n"
    ## Uploading
    G_ROOT_FOLDER_NAME_UPLOADING="CCTV"
    G_FILE_PATH_FORMAT_UPLOADING="yyyy-MM/MM-dd/yyyyMMdd_hhmmss(w1).w2"

    # Source
    SOURCE_LOCAL_PATH="/home/pi/motion/"
    SOURCE_FILE_NAME_SEPARATORS="-_.,"
    SOURCE_FILE_NAME_FORMAT="*-*-yyyyMMddhhmmss.*"
    ```

2) Start
    ``` bash
    $ npm i
    $ npm run build
    $ npm run start
    ```