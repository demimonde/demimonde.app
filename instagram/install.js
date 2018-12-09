import rqt, { jqt } from 'rqt'
import core from '@idio/core'

const PAGE = '260589541284358'
const CLIENT_ID = '273790443337044'
const SECRET = process.env.SECRET

if (!SECRET) {
  console.log('Add the SECRET env var')
  process.exit(1)
}

const install = async (token) => {
  const res = await rqt(`https://graph.facebook.com/v3.2/${PAGE}/subscribed_apps`, {
    method: 'POST',
    data: {
      access_token: token,
      subscribed_fields: ['mention'],
    },
  })
  return res
}

const getToken = async () => {
  const { url, router, app } = await core({

  })
  const state = Math.floor(Math.random() * 10000)
  router.get('/', async (ctx, next) => {
    ctx.body = '<a href="/auth">Log In</a>'
  })
  router.get('/add', async (ctx, next) => {
    const { token } = ctx.query
    const pp = await rqt(`https://graph.facebook.com/${PAGE}?access_token=${token}&fields=access_token`)
    console.log(pp)
    const jj = JSON.parse(pp)
    const t = jj.access_token
    if (!t) {
      ctx.body = pp
      return
    }
    const bb = await install(t)
    ctx.body = bb
  })
  router.get('/auth', async (ctx, next) => {
    const redirect = `http://${ctx.host}/redirect`
    const url = `https://www.facebook.com/v3.2/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${redirect}&state=${state}&scope=manage_pages`
    ctx.redirect(url)
  })
  router.get('/redirect', async (ctx, next) => {
    const redirect = `http://${ctx.host}/redirect`

    const url = `https://graph.facebook.com/v3.2/oauth/access_token?client_id=${CLIENT_ID}&redirect_uri=${redirect}&client_secret=${SECRET}&code=${ctx.query.code}`

    const res = await jqt(url)
    const { access_token } = res
    if (!access_token) {
      ctx.body = res
    } else {
      ctx.redirect(`/add?token=${access_token}`)
    }
  })
  app.use(router.routes())
  console.log(url)
}


;(async () => {
  await getToken()
})()
