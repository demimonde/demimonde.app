import rm from '@wrote/rm'
import uuid from 'uuid'
import sharp from 'sharp'
import { uploadFile, createRecord, file, queryAlbum } from '../../lib'
import { ExiftoolProcess } from 'node-exiftool'

export default async (ctx) => {
  /** @type {ExiftoolProcess} */
  const exiftool = ctx.exiftool
  const { storage, container } = ctx
  const { id } = ctx.session.user
  if (!storage) throw new Error('Set STORAGE env variable.')
  if (!container) throw new Error('Set CONTAINER env variable.')
  const { album } = ctx.req.body
  if (!album) throw new Error('No album')
  const alb = await queryAlbum(ctx.tableService, id, album)
  if (!alb) throw new Error('Album not found')

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
  const photoId = await createRecord({
    table: 'photos',
    data: {
      ImageUrl: { _: imageUrl },
      ThumbUrl: { _: thumbUrl },
      AlbumId: { _: album },
      ImageWidth: { _: Orientation < 5 ? metadata.ImageWidth : metadata.ImageHeight },
      ImageHeight: { _: Orientation < 5 ? metadata.ImageHeight : metadata.ImageWidth },
    },
    key: pad(),
    partition: id,
    tbl: ctx.tableService,
  })
  ctx.body = { photoId, thumbUrl }
}

const pad = () => {
  const s = `${8640000000000000 - Date.now()}`
  const l = Math.max(19 - s.length, 0)
  const t = '0'.repeat(l)
  return `${t}${s}`
}