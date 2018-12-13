import { postAlbums } from '../../lib'

/**
 * @type {import('koa').Middleware}
 */
const mw = async (ctx) => {
  const { id } = ctx.session.user
  const newId = await postAlbums(ctx.tableService, id, {
    name: ctx.request.body.name,
  })
  ctx.redirect(`/album/${newId}`)
}

export default mw