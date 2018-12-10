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
      const ff = await sharp(path).rotate().resize(500).toBuffer()
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
  const { Orientation = 1 } = metadata
  await createRecord('photos', id, {
    ImageUrl: { _: imageUrl },
    ThumbUrl: { _: thumbUrl },
    ImageWidth: { _: Orientation < 5 ? metadata.ImageWidth : metadata.ImageHeight },
    ImageHeight: { _: Orientation < 5 ? metadata.ImageHeight : metadata.ImageWidth },
  }, pad())
  ctx.body = thumbUrl
}

const pad = () => {
  const s = `${8640000000000000 - Date.now()}`
  const l = Math.max(19 - s.length, 0)
  const t = '0'.repeat(l)
  return `${t}${s}`
}