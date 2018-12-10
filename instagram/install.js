import core from '@idio/core'
import { graphGet, graphPost } from '@demimonde/graph'
import facebook from '@idio/facebook'

const CLIENT_ID = process.env.CLIENT_ID
const SECRET = process.env.SECRET

if (!CLIENT_ID) {
  console.warn('Add the CLIENT_ID env var')
}
if (!SECRET) {
  console.log('Add the SECRET env var')
  process.exit(1)
}

const install = async (page, token) => {
  return graphPost(page, token, {
    subscribed_fields: ['feed', 'mention'],
  })
}

async function checkToken(ctx, next) {
  const token = ctx.session.token
  if (!token) throw new Error('No user access token in session.')
  await next()
}

const getToken = async () => {
  const { url, router, app } = await core({
    session: { use: true, keys: ['local'] },
    logger: { use: true },
  })
  router.get('/', async (ctx) => {
    const user = ctx.session.user
    const u = user ? `hello <a href="https://facebook/${user.id}">` + user.name + '</a>' : ''
    const l = user ? '' : '<a href="/auth/facebook">Log In</a>'
    ctx.body = `
<!doctype HTML>
<html>
${u} ${l}
  <ul><li><a href="/list">Pages</a></li></ul>
</html>
`
  })
  router.post('/subscribe', checkToken, async (ctx) => {
    const { token, page } = ctx.query
    const bb = await install(page, token)
    ctx.body = bb
  })
  router.get('/list', checkToken, async (ctx) => {
    const { token } = ctx.session
    const pages = await graphGet('/me/accounts', token)
    // mutate with accounts and apps
    await Promise.all(pages.map(async (page) => {
      const { access_token, id } = page
      const a = await graphGet(`${id}/page_backed_instagram_accounts`, access_token)
      const pp = a.map(async ({ id }) => {
        const ac = await graphGet(id, access_token, {
          fields: 'id,profile_pic,username',
        }, 1)
        return ac
      })
      const l = await graphGet(`${id}/subscribed_apps`, access_token)
      const [accounts, linkedApps] = await Promise.all([
        Promise.all(pp),
        l,
      ])
      page.accounts = accounts
      page.linkedApps = linkedApps
      return page
    }))
    const html = pages.map(({
      access_token, name, id, accounts, linkedApps,
    }) => {
      return `<div><h2><a href="https://facebook.com/${id}">${name}</a></h2>
        ${accounts.length ? '<h3>Page Backed Accounts</h3>' : ''}
        ${accounts.map(({ profile_pic, username }) => {
          return `<img src="${profile_pic}" width="50">${username}`
        })}
        ${linkedApps.length ? '<h3>Subscribed Apps</h3>' : ''}
        ${linkedApps.map((apps) => {
          const { id, name, subscribed_fields, category } = apps
        return `${category}: <a href="https://developers.facebook.com/apps/${id}">${name}</a> (${subscribed_fields.join(', ')})`
        })}
        <a class="subscribe" data-token="${access_token}" data-page="${id}" href="#">Subscribe</a>
      </div>`
    }).join(' ')
    ctx.body = temp({
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
  })
  facebook(router, {
    client_id: CLIENT_ID,
    client_secret: SECRET,
    scope: 'manage_pages',
  })
  app.use(router.routes())
  console.log(url)
}

const temp = ({ data, title = 'Demimonde.app', script = () => {} }) => {
  return `<!doctype html>
<html>
<head>
  <title>${title}</title>
</head>
<body>
  ${data}
</body>
<script>
(function ${script.toString()})()
</script>
</html>`
}

;(async () => {
  await getToken()
})()
