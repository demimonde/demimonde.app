let core = require('@idio/core'); if (core && core.__esModule) core = core.default;
let facebook = require('@idio/facebook'); if (facebook && facebook.__esModule) facebook = facebook.default;
const { graphGet } = require('@demimonde/graph');
const webhook = require('./webhook');

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
    static: { use: true, root: 'static' },
  }, { port: process.env.PORT || 5000 })
  router.get('/', async (ctx) => {
    const user = ctx.session.user
    const u = getHello(user)
    const l = user ? '<a href="/signout">Sing out</a>' : '<a href="/auth/facebook"><img src="fb.png"></a>'
    ctx.body = `
<!doctype HTML>
<html>
${u} ${l}
<p>
Demimonde allows to publish media on Instagram from online.
</p>
  <ul>
${user ? '<li><a href="/list">Pages</a></li>' : ''}
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
  router.get('/media', checkToken, media)
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
      fields: 'subscribed_apps,instagram_accounts,page_backed_instagram_accounts,instagram_business_account',
    }, 1)
    const {
      subscribed_apps: { data: subscribed_apps } = { data: [] },
      instagram_accounts: { data: instagram_accounts } = { data: [] },
      page_backed_instagram_accounts: { data: page_backed_instagram_accounts = [] } = { data: [] },
      instagram_business_account: { id: instagram_business } = {} } = d
    const accs = [...instagram_accounts, ...page_backed_instagram_accounts]
    await Promise.all(accs.map(async (acc) => {
      const { id: accId } = acc
      const dd = await graphGet(accId, access_token, {
        fields: 'id,profile_pic,username',
      }, 1)
      if (dd.error) {
        throw new Error(dd.error.message)
      }
      Object.assign(acc, dd)
    }))
    Object.assign(page, {
      subscribed_apps,
      instagram_accounts,
      page_backed_instagram_accounts,
      instagram_business,
    })
    return page
  }))
  const html = pages.map(({
    instagram_accounts, page_backed_instagram_accounts,
    access_token, name, id, subscribed_apps, instagram_business,
  }) => {
    return `<div><h2><a href="https://facebook.com/${id}">${name}</a></h2>
    ${instagram_business ? `
    <a href="/media?id=${instagram_business}">Media</a>` : ''}
    ${instagram_accounts.length ? '<h3>Instagram Linked Accounts</h3>' : ''}
    ${instagram_accounts.map(({ profile_pic, username, id }) => {
    return `<img src="${profile_pic}" width="50">${username}`
  })}
    ${page_backed_instagram_accounts.length ? '<h3>Page Backed Accounts</h3>' : ''}
      ${page_backed_instagram_accounts.map(({ profile_pic, username, id }) => {
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

const media = async (ctx) => {
  const { token } = ctx.session
  const { id } = ctx.query

  const med = await graphGet(`${id}/media`, token, {
    fields: 'caption,media_url,media_type,like_count,permalink',
  })
  // mutate with accounts and apps
  // <h1>Media for <a href="https://facebook.com/${id}">${id}</a></h1>
  const html = med.map(({
    caption = '', media_url, media_type, like_count, permalink,
  }) => {
    return `<div style="display:block;">
  <a href="${permalink}"><img src="${media_url}" width="250"></a><br>
  ${caption}
    </div>`
  }).join(' ')
  ctx.body = temp({
    user: ctx.session.user,
    data: html,
    title: 'Media',
  })
  // ctx.body = temp({
  //   user: ctx.session.user,
  //   data: `<h1>Pages</h1>${html}`,
  //   script() {
  //     document.querySelectorAll('.subscribe').forEach(el => {
  //       el.onclick = async () => {
  //         const t = el.getAttribute('data-token')
  //         const p = el.getAttribute('data-page')
  //         const res = await fetch(`/subscribe?page=${p}&token=${t}`, {
  //           method: 'POST',
  //         })
  //         const j = await res.json()
  //         console.log(j)
  //         return false
  //       }
  //     })
  //   },
  // })
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
