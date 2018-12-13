import temp from '../../bin/temp'
import { getAlbums } from '../../lib'

export default async (ctx) => {
  const user = ctx.session.user
  const albums = await getAlbums(ctx.tableService, user.id)
  console.log(albums)
  // action="http://localhost:7071/api/HttpTrigger"
  const data = `
<form method="post" enctype="multipart/form-data">
  <input type="hidden" name="_csrf" value="${ctx.csrf}">
  <input type="text" name="caption" placeholder="caption">
  <input type="file" name="file" required>
  <select name="album">
    <option>Select album</option>
    ${albums.map(({ id, name }) => {
    return `<option value="${id}">${name}</option>`
  })}
  </select>
  <input name="id" value="${ctx.session.user.id}" type="hidden">
  <input type="submit">
</form>`
  ctx.body = temp({ data, title: 'Upload', user })
  // fetch /
}