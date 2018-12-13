const temp = require('../../bin/temp');
const { getAlbums } = require('../../lib');

module.exports=async (ctx) => {
  const user = ctx.session.user
  const albums = await getAlbums(ctx.tableService, user.id)
  const data = `
  <h1>Albums</h1>
  <ul>
    ${albums.map(({ Name, RowKey }) => {
    return `<li><a href="/album/${RowKey._}">${Name._}</a></li>`
  })}
  <ul>
<a href="/add-album">Add Album</a>
`
  ctx.body = temp({ data, title: 'Albums', user })
}