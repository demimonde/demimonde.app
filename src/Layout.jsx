import render from '@depack/render'

const Hello = ({ user }) => {
  if (!user) return null
  const link = `https://facebook.com/${user.id}`
  return <span>
    Hello, <a href={link}>{user.name}</a>.
  </span>
}

const Html = ({ title = 'Demimonde', App, user, script, style, csrf }) => (<html>
  <head lang="ru">
    <title>{title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
    <link rel="stylesheet" href="/App.css"/>

    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"/>
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png"/>
    <link rel="manifest" href="/site.webmanifest"/>
    {style && <style dangerouslySetInnerHTML={{ __html: style }}/>}
  </head>
  <body>
    <a href="/" style="display:block;">
      <img src="/logo.svg" style="width:350px;"/>
    </a>
    <Hello user={user} />
    <Links user={user} csrf={csrf} />
    {App}
    {script && <script dangerouslySetInnerHTML={{ __html: `(function ${script.toString()})()` }}>
    </script>}
  </body>
</html>)

const Links = ({ user, csrf }) => {
  if (!user) return (<a href="/auth/facebook">
    <img src="/fb.png"/>
  </a>)
  return <span>
    {' '}<a href={`/signout?token=${csrf}`}>Sign out</a>{' '}
    <a href="/upload">Upload</a>
  </span>
}

const Layout = ({
  App, title, user, script, style, csrf,
}) => {
  return render(<Html App={App}
    title={title} user={user} script={script} style={style} csrf={csrf} />, {
    addDoctype: true,
  })
}

{/* <link href="https://fonts.googleapis.com/css?family=Noto+Serif" rel="stylesheet"/> */}
{/* <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossOrigin="anonymous"/> */}

export default Layout