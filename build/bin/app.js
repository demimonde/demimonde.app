let core = require('@idio/core'); if (core && core.__esModule) core = core.default;
let facebook = require('@idio/facebook'); if (facebook && facebook.__esModule) facebook = facebook.default;
const webhook = require('./webhook');
const temp = require('./temp');
const uploadPost = require('../routes/post/upload');
const { ExiftoolProcess } = require('node-exiftool');
let exiftoolBin = require('dist-exiftool'); if (exiftoolBin && exiftoolBin.__esModule) exiftoolBin = exiftoolBin.default;
const getPhotos = require('../routes/get/photos');
const getUploadRoute = require('../routes/get/upload');
const { createTableService } = require('azure-storage');
const getAlbums = require('../routes/get/albums');
const getAlbum = require('../routes/get/album');
const getAddAlbum = require('../routes/get/add-album');
const postAddAlbum = require('../routes/post/add-album');

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
  const { app, router, url, middleware: { bodyparser, multer, csrf, checkauth } } = await core({
    session: { use: true, keys: [process.env.SESSION_KEY || 'dev'] },
    logger: { use: process.env != 'production' },
    bodyparser: {},
    static: { use: true, root: 'static' },
    multer: { config: {
      dest: 'upload',
    } },
    checkauth: {},
    csrf: {},
  }, { port: process.env.PORT || 5000 })
  const ep = await startExiftool()
  app.context.exiftool = ep
  app.context.tableService = createTableService()
  app.context.storage = process.env.STORAGE
  app.context.container = process.env.CONTAINER
  router.get('/', async (ctx) => {
    const user = ctx.session.user
    const data = `
<p>
Demimonde allows to publish images online.
</p>
  <ul>
${user ? '<li><a href="/upload">Upload New</a></li>' : ''}
${user ? '<li><a href="/photos">My Photos</a></li>' : ''}
${user ? '<li><a href="/albums">Photo Albums</a></li>' : ''}
  <li><a href="/privacy">Privacy Policy</a></li>
${user ? '<li><a href="/signout">Sign Out</a></li>' : ''}
  </ul>
</html>
`
    const t = temp({ data, title: 'Demimonde.app', user: ctx.session.user })
    ctx.body = t
  })
  webhook(router, bodyparser)
  router.get('/privacy', async (ctx) => {
    ctx.body = temp({
      data: '<h1>Privacy Policy</h1>',
      title: 'Privacy Policy',
      user: ctx.session.user,
    })
  })
  router.get('/add-album', checkauth, csrf, getAddAlbum)
  router.post('/add-album', checkauth, bodyparser, csrf, postAddAlbum)
  router.get('/album/:albumId', checkauth, csrf, getAlbum)
  router.get('/albums', checkauth, csrf, getAlbums)
  router.get('/upload', checkauth, csrf, getUploadRoute)
  router.post('/upload', checkauth, multer.single('file'), async (ctx, next) => {
    ctx.request.body = ctx.request.body || {}
    ctx.request.body._csrf = ctx.req.body._csrf
    await next()
  }, csrf, uploadPost)
  router.get('/signout', async (ctx) => {
    ctx.session = null
    ctx.redirect('/')
  })
  router.get('/photos/:page*', async (ctx, next) => {
    if (!ctx.session.user) {
      ctx.body = temp({
        data: 'Please sign in to see your photos',
        title: 'Please sign in',
      })
      return
    }
    await next()
  }, getPhotos)
  facebook(router, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.SECRET,
  })
  app.use(router.routes())
  console.log('Started on %s', url)
})()
