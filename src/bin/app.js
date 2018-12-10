import core from '@idio/core'
import facebook from '@idio/facebook'
import { graphGet } from '@demimonde/graph'
import webhook from './webhook'

async function checkToken(ctx, next) {
  const token = ctx.session.token
  if (!token) throw new Error('No user access token in session.')
  await next()
}

const getHello = (user) => {
  if (!user) return ''
  return `Hello, <a href="https://facebook/${user.id}">` + user.name + '</a>.'
}

(async () => {
  const { app, router, url, middleware: { bodyparser } } = await core({
    session: { use: true, keys: [process.env.SESSION_KEY || 'dev'] },
    logger: { use: process.env != 'production' },
    bodyparser: {},
  }, { port: process.env.PORT || 5000 })
  router.get('/', async (ctx) => {
    const user = ctx.session.user
    const u = getHello(user)
    const l = user ? '' : '<a href="/auth/facebook">Log In</a>'
    ctx.body = `
<!doctype HTML>
<html>
${u} ${l}
  <ul>
  <li><a href="/list">Pages</a></li>
  <li><a href="/privacy">Privacy Policy</a></li>
${user ? '<li><a href="/signout">Sign Out</a></li>' : ''}
  </ul>
</html>
`
  })
  webhook(router, bodyparser)
  router.get('/privacy', async (ctx, next) => {
    ctx.body = 'Privacy Policy'
  })
  router.use('/pages', checkToken, async (ctx, next) => {
    const user = ctx.session.user
    // fetch /
    await next()
  })
  router.get('/signout', async (ctx) => {
    ctx.session = null
    ctx.redirect('/')
  })
  facebook(router, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.SECRET,
    scope: 'manage_pages,instagram_basic',
  })
  router.get('/list', checkToken, list)
  app.use(router.routes())
  console.log('Started on %s', url)
})()

const list = async (ctx) => {
  const { token } = ctx.session
  const pages = await graphGet('/me/accounts', token)
  // mutate with accounts and apps
  await Promise.all(pages.map(async (page) => {
    const { access_token, id } = page
    const d = await graphGet(id, access_token, {
      fields: 'subscribed_apps,instagram_accounts,page_backed_instagram_accounts',
    }, 1)
    const {
      subscribed_apps: { data: subscribed_apps } = { data: [] },
      instagram_accounts: { data: instagram_accounts } = { data: [] },
      page_backed_instagram_accounts: { data: page_backed_instagram_accounts = [] } = { data: [] } } = d
    const accs = [...instagram_accounts, ...page_backed_instagram_accounts]
    await Promise.all(accs.map(async (acc) => {
      const { id: accId } = acc
      const dd = await graphGet(accId, access_token, {
        fields: 'id,profile_pic,username',
      }, 1)
      Object.assign(acc, dd)
    }))
    Object.assign(page, {
      subscribed_apps,
      instagram_accounts,
      page_backed_instagram_accounts,
    })
    return page
  }))
  const html = pages.map(({
    instagram_accounts, page_backed_instagram_accounts,
    access_token, name, id, subscribed_apps,
  }) => {
    return `<div><h2><a href="https://facebook.com/${id}">${name}</a></h2>
    ${instagram_accounts.length ? '<h3>Instagram Business Accounts</h3>' : ''}
    ${instagram_accounts.map(({ profile_pic, username }) => {
    return `<img src="${profile_pic}" width="50">${username}`
  })}
    ${page_backed_instagram_accounts.length ? '<h3>Page Backed Accounts</h3>' : ''}
      ${page_backed_instagram_accounts.map(({ profile_pic, username }) => {
    return `<img src="${profile_pic}" width="50">${username}`
  })}
      ${subscribed_apps.length ? '<h3>Subscribed Apps</h3>' : ''}
      ${subscribed_apps.map((apps) => {
    const { id, name, subscribed_fields, category } = apps
    return `${category}: <a href="https://developers.facebook.com/apps/${id}">${name}</a> (${subscribed_fields.join(', ')})`
  })}
      <a class="subscribe" data-token="${access_token}" data-page="${id}" href="#">Subscribe</a>
    </div>`
  }).join(' ')
  ctx.body = temp({
    user: ctx.session.user,
    data: `<h1>Pages</h1>${html}`,
    script() {
      document.querySelectorAll('.subscribe').forEach(el => {
        el.onclick = async () => {
          const t = el.getAttribute('data-token')
          const p = el.getAttribute('data-page')
          const res = await fetch(`/subscribe?page=${p}&token=${t}`, {
            method: 'POST',
          })
          const j = await res.json()
          console.log(j)
          return false
        }
      })
    },
  })
}

const temp = ({ data, title = 'Demimonde.app', user, script = () => {} }) => {
  return `<!doctype html>
<html>
<head>
  <title>${title}</title>
</head>
<body>
  ${getHello(user)}
  <a href="/signout">Sign Out</a>
  ${data}
</body>
<script>
(function ${script.toString()})()
</script>
</html>`
}
