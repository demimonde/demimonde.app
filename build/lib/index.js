const { createBlobService, createTableService, TableQuery } = require('azure-storage');
let uuid = require('uuid/v4'); if (uuid && uuid.__esModule) uuid = uuid.default;
const { queryTable, ensureTable, insert } = require('./query');

const getUrl = (storage, container, blob) => {
  return [
    'https://',
    storage,
    '.blob.core.windows.net/',
    container, '/', blob,
  ].join('')
}
       const uploadFile = async ({
  contentType,
  filename,
  container,
  blob,
  storage,
}) => {
  const blobService = createBlobService()
  const res = await new Promise((r, j) => {
    blobService.createBlockBlobFromLocalFile(container, blob, filename, {
      contentSettings: {
        contentType,
      },
    }, (err) => {
      if (err) return j(err)
      r(getUrl(storage, container, blob))
    })
  })
  return res
}

       const file = async ({
  contentType,
  text,
  container,
  blob,
  storage,
}) => {
  const blobService = createBlobService()
  const res = await new Promise((r, j) => {
    blobService.createBlockBlobFromText(container, blob, text, {
      contentSettings: {
        contentType,
      },
    }, (err) => {
      if (err) return j(err)
      r(getUrl(storage, container, blob))
    })
  })
  return res
}

       const createRecord = async (
  {
    table,
    partition,
    data,
    key = uuid(),
    tbl = createTableService(),
  }
) => {
  const allData = {
    PartitionKey: { _: partition },
    RowKey: { _: key },
    ...data,
  }
  await ensureTable(tbl, table)
  await insert(tbl, table, allData)
  return key
}

       const getPhotos = async (tbl, userId, page = 1) => {
  const query = new TableQuery()
    .select(['ImageUrl', 'ThumbUrl', 'ImageWidth', 'ImageHeight'])
    .top(20 * (page - 1))
    .where('PartitionKey eq ?', userId)
  const entries = await queryTable(tbl, 'photos', query)
  return entries
}

       const getAlbumPhotos = async (tbl, album, userId, page = 1) => {
  const query = new TableQuery()
    .select(['ImageUrl', 'ThumbUrl', 'ImageWidth', 'ImageHeight'])
    .top(20 * (page - 1))
    .where('AlbumId eq ? && PartitionKey eq ?', album, userId)
  const entries = await queryTable(tbl, 'photos', query)
  return entries
}

       const getAlbums = async (tbl, userId) => {
  const query = new TableQuery()
    .where('PartitionKey eq ?', userId)
  return await queryTable(tbl, 'albums', query)
}

       const queryAlbum = async (tbl, userId, id) => {
  const query = new TableQuery()
    .where('PartitionKey eq ? && RowKey eq ?', userId, id)
  const [res] = await queryTable(tbl, 'albums', query)
  return res
}

       const postAlbums = async (tbl, userId, { name }) => {
  if (!name) throw new Error('no name')
  const res = await createRecord({
    table: 'albums',
    partition: userId,
    tbl,
    data: {
      Name: { _: name },
    },
  })
  return res
}

// export const query = async ({
//   tableService = createTableService(),
//   fields = [],
//   partitionKey,
// }) => {
//   /** @type {} */
//   const query = new TableQuery()
//     .select(fields)
//     .where('PartitionKey eq ?', partitionKey)
// }

module.exports.uploadFile = uploadFile
module.exports.file = file
module.exports.createRecord = createRecord
module.exports.getPhotos = getPhotos
module.exports.getAlbumPhotos = getAlbumPhotos
module.exports.getAlbums = getAlbums
module.exports.queryAlbum = queryAlbum
module.exports.postAlbums = postAlbums