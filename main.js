
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const app = require('express');
const server = app();
const PORT = process.env.PORT || 3000;
const { BlobServiceClient } = require('@azure/storage-blob');


server.use(app.json());

/* 
    FUNCTION USED TO CREATE A BLOB CONTAINER
    Should be resive a param called name to set this value as a container name
*/

server.post('/create/:name', async function (req, res) {
    const { name } = req.params;

    try {
        // -> Get azure storage account name from environment variables
        const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

        // -> Check if account name variable exists
        if (!accountName) {
            // throw new Error('Azure storage account name is not defined');
            return res.status(500).json({ message: "INTERNAL SERVER ERROR" })
        }

        // -> Define a client reference to bob storage service
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );

        const containerClient = blobServiceClient.getContainerClient(name);
        const createContainerResponse = await containerClient.create();
        if (createContainerResponse) {
            return res.status(201).json({ message: "Container was created successfully" })
        }
    }
    catch (error) {
        console.error(`Error: ${error}`)
        return res.status(500).json({ message: "INTERNAL SERVER ERROR" })
    }
})

/*
    FUNCTION TO UPLOAD A FILE TO A BLOB CONTAINER
    This file must be a .txt archive
*/

server.post('/upload', async function (req, res) {

    // -> Get text content and file name from request body
    const { text, fileName } = req.body;

    try {
        // -> Upload Text First
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );

        const containerClient = blobServiceClient.getContainerClient("text-uploads-example");
        const blobBlockClient = containerClient.getBlockBlobClient(`${fileName}.txt`);
        await blobBlockClient.upload(text, text.length);

        /*
        Also we can obtain the url of the blob using the following code
            const blobUrl = blobBlockClient.url;
        and then return it to the client.
            return res.status(201).json({ message: "File was uploaded successfully", blobUrl });
        */

        return res.status(201).json({ message: "File was uploaded successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "INTERNAL SERVER ERROR" })
    }
})

/*
    FUNCTION TO LIST ALL BLOBS INSIDE A CONTAINER
    Next function should return a list of all bobs inside a container
    and has to return name and thumbnail url in an array structure.
*/

server.get('/get', async function (req, res) {

    // -> Upload Text First
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );

    // -> Get container reference
    const containerClient = blobServiceClient.getContainerClient("text-uploads-example");

    let blobsItems = [];
    let blobItem = {}
    // -> Get Item by Item
    for await (const blob of containerClient.listBlobsFlat()) {
        const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);
        blobItem = {
            name: blob.name,
            thumbnail: tempBlockBlobClient.url
        }
        blobsItems = [...blobsItems, blobItem];
        blobItem = {};
    }
    //console.table(blobsItems)
    return res.status(200).json(blobsItems);
})

/*

    FUNCTION TO DELETE A BLOB CONTAINER
    This function should delete a container and all its content

*/

server.delete('/delete/:containerName', async function (req, res) {
    const { containerName } = req.params;

    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );

        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.delete();
        return res.status(200).json({ message: "Container was deleted successfully" })
    }
    catch (error) {
        return res.status(500).json({ message: "INTERNAL SERVER ERROR" })
    }
})


/*
    UPLAOAD IMAGES TO A AZURE BLOB CONTAINER
    The next code can be used to upload images to a blob container.
    To make this idea works, there's a lot of ways to do it.
    Imagine that you have a front-end application and you want to upload images to a blob container in azure also you have nodejs application server (express server).
    So you need to think about how to send a image from your client to your server.

    We need to install the multer library, this library allows handling multipart/form-data, which is primarily used for uploading files.
    -> https://www.npmjs.com/package/multer
    -> npm install multer

    FRONT-END CODE

    (() => {
    const fileInput = document.querySelector('#file');
    // fileInput.click();
    fileInput.addEventListener('change', ({ target }) => {
        // get file from input
        const file = target.files[0];
        // create a formdata instance
        const formdata = new FormData();
        // insert document in formdata intance
        // formdata.append('id', '1212121212');
        // formdata.append('name', 'image');
        formdata.append('image', file);
        // send image trough fetch request
        console.log(typeof formdata)
        fetch('http://localhost:8080/api/v1/uploadImage', {
            method: 'POST',
            body: formdata
        })
            .then(res => res.json())
            .then((res)=>{
                document.querySelector('#image').src = res.thumbnailUrl;
            })
            .catch(console.error)
    })
})()

*/

const multer = require('multer');
const
    inMemoryStorage = multer.memoryStorage(),
    uploadStrategy = multer({ storage: inMemoryStorage }).single('image');

server.post('/upload-image', uploadStrategy,  async function (req, res) {
    const file = req.file;
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );

        const containerClient = blobServiceClient.getContainerClient("blog-images");
        // -> Set file name. This must be unique.
        const blobBlockClient = containerClient.getBlockBlobClient(file.originalname);
        await blobBlockClient.upload(req.file.buffer, req.file.buffer.length);
        return res.status(201).json({ message: "File was uploaded successfully", thumbnailUrl: blobBlockClient.url });
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ message: "INTERNAL SERVER ERROR" })
    }
})

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})