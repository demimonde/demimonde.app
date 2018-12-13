import temp from '../../bin/temp'
import { getAlbums } from '../../lib'

export default async (ctx) => {
  const user = ctx.session.user
  const albums = await getAlbums(ctx.tableService, user.id)
  console.log(albums)
  // action="http://localhost:7071/api/HttpTrigger"
  const data = `
    ${albums.map(({ id, name }) => {
    return `<a href="/albums/${id}">${name}</a>`
  })}

<a href="/add-album">Add Album</a>
`
  ctx.body = temp({ data, title: 'Albums', user })
}