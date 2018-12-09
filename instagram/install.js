import rqt, { jqt } from 'rqt'
import core from '@idio/core'
import { stringify } from 'querystring'

const PAGE = '260589541284358'
const CLIENT_ID = '273790443337044'
const SECRET = process.env.SECRET

if (!SECRET) {
  console.log('Add the SECRET env var')
  process.exit(1)
}

const install = async (page, token) => {
  const res = await rqt(`https://graph.facebook.com/v3.2/${page}/subscribed_apps`, {
    method: 'POST',
    data: {
      access_token: token,
      subscribed_fields: ['feed', 'mention'],
    },
  })
  const j = JSON.parse(res)
  return j
}

async function checkToken(ctx, next) {
  const token = ctx.session.token
  if (!token) throw new Error('No user access token in session.')
  await next()
}

const getToken = async () => {
  const { url, router, app } = await core({
    session: { use: true, keys: ['local'] },
  })
  router.get('/', async (ctx) => {
    ctx.body = `<a href="/auth">Log In</a>
      <a href="/list">Pages</a>`
  })
  router.post('/subscribe', checkToken, async (ctx) => {
    const { token, page } = ctx.query
    const bb = await install(page, token)
    ctx.body = bb
  })
  router.get('/list', checkToken, async (ctx) => {
    const { token } = ctx.session
    const u = getUrl('https://graph.facebook.com/me/accounts', {
      access_token: token,
    })
    const res = await rqt(u)
    const { data } = JSON.parse(res)
    const d = await Promise.all(data.map(async (page) => {
      const { access_token, id } = page
      const r = await rqt(getUrl(`https://graph.facebook.com/${id}/page_backed_instagram_accounts`, {
        access_token,
      }))
      const { data: data2 } = JSON.parse(r)
      const accounts = await Promise.all(data2.map(async ({ id }) => {
        const r2 = await rqt(getUrl(`https://graph.facebook.com/${id}`, {
          access_token,
          fields: 'id,profile_pic,username',
        }))
        const rr2 = JSON.parse(r2)
        return rr2
      }))
      page.accounts = accounts
      const r3 = await rqt(getUrl(`https://graph.facebook.com/${id}/subscribed_apps`, {
        access_token,
      }))
      const { data: data3 } = JSON.parse(r3)
      page.linkedApps = data3
      return page
    }))
    const html = data.map(({
      access_token, name, id, accounts, linkedApps,
    }) => {
      return `<div><h2><a href="https://facebook.com/${id}">${name}</a></h2>
        ${accounts.length ? '<h3>Linked Accounts</h3>' : ''}
        ${accounts.map(({ profile_pic, username }) => {
          return `<img src="${profile_pic}" width="50">${username}`
        })}
        ${accounts.length ? '<h3>Subscribed Apps</h3>' : ''}
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
  router.get('/auth', async (ctx) => {
    const state = Math.floor(Math.random() * 10000)
    ctx.session.state = state
    const redirect = `http://${ctx.host}/redirect`
    const u = getUrl('https://www.facebook.com/v3.2/dialog/oauth', {
      client_id: CLIENT_ID,
      redirect_uri: redirect,
      state,
      scope: 'manage_pages',
    })
    ctx.redirect(u)
  })
  router.get('/redirect', async (ctx) => {
    const redirect = `http://${ctx.host}/redirect`
    const state = ctx.query.state
    if (state != ctx.session.state) {
      ctx.body = 'Wrong state'
      ctx.status = 500
      return
    }
    ctx.session.state = null

    const u = getUrl('https://graph.facebook.com/v3.2/oauth/access_token', {
      client_id: CLIENT_ID,
      redirect_uri: redirect,
      client_secret: SECRET,
      code: ctx.query.code,
    })

    const res = await jqt(u)
    const { access_token } = res
    if (!access_token) {
      ctx.body = res
    } else {
      ctx.session.token = access_token
      ctx.redirect('/list')
    }
  })
  app.use(router.routes())
  console.log(url)
}

const getUrl = (url, params = {}) => {
  const s = stringify(params)
  return `${url}?${s}`
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
