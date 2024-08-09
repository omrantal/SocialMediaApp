const stream = require('stream');
const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');

const uploadRouter = express.Router();
const upload = multer();

const uploadFile = async (fileObject) => {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileObject.buffer);
  const { data } = await google.drive({ version: 'v3' }).files.create({
    media: {
      mimeType: fileObject.mimeType,
      body: bufferStream,
    },
    requestBody: {
      name: fileObject.originalname,
      parents: ['https://drive.google.com/drive/folders/1Olb1LowmsCVG-eFS_hu0qr1x0Jc8RqK_?usp=drive_link'],
    },
    fields: 'id,name',
  });
  console.log(`Uploaded file ${data.name} ${data.id}`);
};

uploadRouter.post('/upload', upload.any(), async (req, res) => {
  try {
    const { body, files } = req;

    for (let f = 0; f < files.length; f += 1) {
      await uploadFile(files[f]);
    }

    console.log(body);
    res.status(200).send('Form Submitted');
  } catch (f) {
    res.send(f.message);
  }
});

module.exports = uploadRouter;