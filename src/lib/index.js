import { createBlobService, createTableService, TableQuery } from 'azure-storage'
import uuid from 'uuid/v4'
import { queryTable, ensureTable, insert } from './query'

const getUrl = (storage, container, blob) => {
  return [
    'https://',
    storage,
    '.blob.core.windows.net/',
    container, '/', blob,
  ].join('')
}
export const uploadFile = async ({
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

export const file = async ({
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

export const createRecord = async (
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

export const getPhotos = async (userId, page = 1) => {
  const tbl = createTableService()
  const query = new TableQuery()
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

export const getAlbums = async (tbl, userId) => {
  const query = new TableQuery()
    .where('PartitionKey eq ?', userId)
  await queryTable(tbl, 'albums', query)
}

export const postAlbums = async (tbl, userId, { name }) => {
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