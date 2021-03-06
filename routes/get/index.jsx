const App = ({ user, token }) => {
  return (<div>
    <p>
      Demimonde allows to publish images online.
    </p>
    <ul>
      {user && <li><a href="/upload">Upload New</a></li>}
      {user && <li><a href="/photos">My Photos</a></li>}
      {user && <li><a href="/albums">Photo Albums</a></li>}
      <li><a href="/privacy">Privacy Policy</a></li>
      {user && <li><a href={`/signout?token=${token}`}>Sign Out</a></li>}
    </ul>
  </div>)
}

export default async (ctx) => {
  const user = ctx.session.user
  const app = (<App activeMenu="index" user={user} token={ctx.session.token}/>)
  ctx.body = ctx.Layout({
    App: app,
    session: ctx.session,
  })
}

export const aliases = ['/']