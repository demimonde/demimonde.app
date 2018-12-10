let rm = require('@wrote/rm'); if (rm && rm.__esModule) rm = rm.default;
let uuid = require('uuid'); if (uuid && uuid.__esModule) uuid = uuid.default;
let sharp = require('sharp'); if (sharp && sharp.__esModule) sharp = sharp.default;
const { uploadFile, createRecord, file } = require('../../lib');
const { ExiftoolProcess } = require('node-exiftool');

module.exports=async (ctx) => {
  /** @type {ExiftoolProcess} */
  const exiftool = ctx.exiftool
  const { storage, container } = ctx
  if (!storage) throw new Error('Set STORAGE env variable.')
  if (!container) throw new Error('Set CONTAINER env variable.')
  const { id } = ctx.req.body
  if (!id) throw new Error('No user id.')
  if (!ctx.req.file) throw new Error('No file')
  const { path, mimetype } = ctx.req.file
  const { data: [metadata] } = await exiftool.readMetadata(path, ['n'])
  if (metadata.MIMEType != 'image/jpeg') throw new Error('Not jpg.')
  const blob = `original/${uuid()}.jpg`
  const [imageUrl, thumbUrl] = await Promise.all([
    uploadFile({
      storage,
      filename: path,
      container, blob, contentType: mimetype,
    }),
    (async () => {
      const ff = await sharp(path).resize(500).toBuffer()
      const thumbBlob = `thumb/${uuid()}.jpg`
      const thumb_url = await file({
        storage,
        text: ff,
        container, blob: thumbBlob, contentType: mimetype,
      })
      return thumb_url
    })(),
  ])
  await rm(path)
  await createRecord('photos', id, {
    ImageUrl: { _: imageUrl },
    ThumbUrl: { _: thumbUrl },
    ImageWidth: { _: metadata.ImageWidth },
    ImageHeight: { _: metadata.ImageHeight },
  })
  ctx.body = thumbUrl
}