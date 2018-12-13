import core from '@idio/core'
import facebook from '@idio/facebook'
import webhook from './webhook'
import temp from './temp'
import uploadPost from '../routes/post/upload'
import { ExiftoolProcess } from 'node-exiftool'
import exiftoolBin from 'dist-exiftool'
import getPhotos from '../routes/get/photos'

async function startExiftool() {
  const ep = new ExiftoolProcess(exiftoolBin)
  await ep.open()
  return ep
}

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
  const { app, router, url, middleware: { bodyparser, multer, csrf } } = await core({
    session: { use: true, keys: [process.env.SESSION_KEY || 'dev'] },
    logger: { use: process.env != 'production' },
    bodyparser: {},
    static: { use: true, root: 'static' },
    multer: { config: {
      dest: 'upload',
    } },
    csrf: {},
  }, { port: process.env.PORT || 5000 })
  const ep = await startExiftool()
  app.context.exiftool = ep
  app.context.storage = process.env.STORAGE
  app.context.container = process.env.CONTAINER
  router.get('/', async (ctx) => {
    const user = ctx.session.user
    const data = `
<p>
Demimonde allows to publish images online.
</p>
  <ul>
${user ? '<li><a href="/upload">Upload</a></li>' : ''}
${user ? `<li><a href="/photos/${user.id}">My Photos</a></li>` : ''}
  <li><a href="/privacy">Privacy Policy</a></li>
${user ? '<li><a href="/signout">Sign Out</a></li>' : ''}
  </ul>
</html>
`
    const t = temp({ data, title: 'Demimonde.app', user: ctx.session.user })
    ctx.body = t
  })
  webhook(router, bodyparser)
  router.get('/privacy', async (ctx, next) => {
    ctx.body = 'Privacy Policy'
  })
  router.get('/upload', checkToken, csrf, async (ctx) => {
    const user = ctx.session.user
    // action="http://localhost:7071/api/HttpTrigger"
    const data = `
<form method="post" enctype="multipart/form-data">
    <input type="hidden" name="_csrf" value="${ctx.csrf}">
    <input type="text" name="caption" placeholder="caption">
    <input type="file" name="file" required>
    <input name="id" value="${ctx.session.user.id}" type="hidden">
    <input type="submit">
</form>`
    ctx.body = temp({ data, title: 'Upload', user })
    // fetch /
  })
  router.post('/upload', checkToken, multer.single('file'), async (ctx, next) => {
    ctx.request.body = ctx.request.body || {}
    ctx.request.body._csrf = ctx.req.body._csrf
    await next()
  }, csrf, uploadPost)
  router.get('/signout', async (ctx) => {
    ctx.session = null
    ctx.redirect('/')
  })
  router.get('/photos/:user/:page*', getPhotos)
  facebook(router, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.SECRET,
  })
  app.use(router.routes())
  console.log('Started on %s', url)
})()
