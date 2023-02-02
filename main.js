
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const app = require('express');
const server = app();
const PORT = process.env.PORT || 3000;
const { BlobServiceClient } = require('@azure/storage-blob');


/* 
    FUNCTION USED TO CREATE A BLOB CONTAINER
    Should be resive a param called name to set this value as a container name
*/

server.get('/create/:name', async function (req, res) {
    const { name } = req.params;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) throw new Error('Azure storage account name is not defined');

    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );

    const containerClient = blobServiceClient.getContainerClient(name);
    const createContainerResponse = await containerClient.create();
    res.send(`Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`);
})


server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})