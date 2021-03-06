import photos from '../../src/lib/photos'
import { queryAlbum, getAlbumPhotos } from '../../src/lib'

const Page = ({ album, inner }) => {
  return (<div>
    <h1>{album.Name._}</h1>
    {inner}
  </div>)
}

export default async (ctx) => {
  const { id } = ctx.session.user
  const { id: albumId } = ctx.params

  const album = await queryAlbum(ctx.tableService, id, albumId)
  if (!album) {
    ctx.status = 404
    ctx.body = ctx.Layout({
      App: <h1>Album Not Found</h1>,
      title: 404,
      session: ctx.session,
    })
    return
  }

  const page = ctx.params.page ? parseInt(ctx.params.page) : 1

  const entries = await getAlbumPhotos(ctx.tableService, albumId, id, page)
  const { Container, style } = photos(entries)

  ctx.body = ctx.Layout({
    App: <Page album={album} inner={Container} />,
    title: `Album ${album.Name._}`,
    session: ctx.session,
    style,
  })
}

export const aliases = ['/album/:id']