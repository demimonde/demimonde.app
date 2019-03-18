// import temp from '../../bin/temp'
// import { getAlbums } from '../../lib'

// export default async (ctx) => {
//   const user = ctx.session.user
//   const albums = await getAlbums(ctx.tableService, user.id)
//   // action="http://localhost:7071/api/HttpTrigger"
//   const data = `
// <form method="post" enctype="multipart/form-data">
//   <input type="hidden" name="_csrf" value="${ctx.csrf}">
//   <input type="text" name="caption" placeholder="caption">
//   <input type="file" name="file" required>
//   <select name="album" required>
//     ${albums.map(({ RowKey, Name }) => {
//     return `<option value="${RowKey._}">${Name._}</option>`
//   })}
//   </select>
//   <input type="submit">
// </form>`
//   ctx.body = temp({ data, title: 'Upload', user })
//   // fetch /
// }