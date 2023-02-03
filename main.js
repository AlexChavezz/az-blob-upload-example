
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

server.get('/create/:name', async function (req, res) {
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
        return res.status(201).json({ message: "File was uploaded successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "INTERNAL SERVER ERROR" })
    }
})

/*
    FUNCTION TO LIST ALL BLOBS INSIDE A CONTAINER
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

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})