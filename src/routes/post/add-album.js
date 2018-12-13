import { postAlbums } from '../../lib'

/**
 * @type {import('koa').Middleware}
 */
const mw = async (ctx, next) => {
  const { id } = ctx.session.user
  const newId = await postAlbums(ctx.tableService, id, {
    name: ctx.request.body.name,
  })
  ctx.redirect(`/albums/${newId}`)
}

export default mw