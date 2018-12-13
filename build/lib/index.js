const { createBlobService, createTableService, TableQuery } = require('azure-storage');
let uuid = require('uuid/v4'); if (uuid && uuid.__esModule) uuid = uuid.default;

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
  table, partition, data, key = uuid(),
) => {
  const tbl = createTableService()
  const photo = {
    PartitionKey: { _: partition },
    RowKey: { _: key },
    ...data,
  }
  await new Promise((r, j) => {
    tbl.createTableIfNotExists(table, function(error, result) {
      if(!error) {
        r(result)
      } else j(error)
    })
  })
  await new Promise((r, j) => {
    tbl.insertEntity(table, photo, function (error, result, rr) {
      if(!error){
        r(rr)
      } else j(error)
    })
  })
}

       const getPhotos = async (userId, page = 1) => {
  const tbl = createTableService()
  var query = new TableQuery()
    .select(['ImageUrl', 'ThumbUrl', 'ImageWidth', 'ImageHeight'])
    .top(20 * page)
    .where('PartitionKey eq ?', userId)
  const res = await new Promise((r, j) => {
    tbl.queryEntities('photos', query, null, (error, result) => {
      if(!error) {
        r(result)
      } else j(error)
    })
  })
  return res
}

module.exports.uploadFile = uploadFile
module.exports.file = file
module.exports.createRecord = createRecord
module.exports.getPhotos = getPhotos