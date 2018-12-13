       const queryTable = async (tbl, table, query) => {
  const res = await new Promise((r, j) => {
    tbl.queryEntities(table, query, null, (error, result) => {
      if(!error) {
        r(result.entries)
      } else j(error)
    })
  })
  return res
}

       const ensureTable = async (tbl, table) => {
  await new Promise((r, j) => {
    tbl.createTableIfNotExists(table, function(error, result) {
      if(!error) {
        r(result)
      } else j(error)
    })
  })
}

       const insert = async (tbl, table, data) => {
  await new Promise((r, j) => {
    tbl.insertEntity(table, data, function (error, result, rr) {
      if(!error){
        r(rr)
      } else j(error)
    })
  })
}

module.exports.queryTable = queryTable
module.exports.ensureTable = ensureTable
module.exports.insert = insert