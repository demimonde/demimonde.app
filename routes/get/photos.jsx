import { getPhotos } from '../../src/lib'
import photos from '../../src/lib/photos'
import Layout from '../../src/Layout'

export default async (ctx) => {
  const { id } = ctx.session.user
  const page = ctx.params.page ? parseInt(ctx.params.page) : 1
  const entries = await getPhotos(ctx.tableService, id, page)

  const { style, Container } = photos(entries)

  ctx.body = Layout({
    App: Container,
    title: 'User Photos',
    user: ctx.session.user,
    style,
  })
}