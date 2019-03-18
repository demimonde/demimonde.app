import { getAlbums } from '../../src/lib'
import Layout from '../../src/Layout'

const Page = ({ albums }) => {
  return (<div>
    <h1>Albums</h1>
    <ul>
      {albums.map(({ Name, RowKey }) => {
        const href = `/album/${RowKey._}`
        return <li key={RowKey._}>
          <a href={href}>{Name._}</a>
        </li>
      })}
    </ul>
    <a href="/add-album">Add Album</a>
  </div>)
}

export default async (ctx) => {
  const user = ctx.session.user
  const albums = await getAlbums(ctx.tableService, user.id)
  ctx.body = Layout({
    App: <Page albums={albums} />,
    title: 'Albums',
    user,
  })
}