let core = require('@idio/core'); if (core && core.__esModule) core = core.default;
let facebook = require('@idio/facebook'); if (facebook && facebook.__esModule) facebook = facebook.default;
const webhook = require('./webhook');
const { getPhotos } = require('../lib');
const temp = require('./temp');
const uploadPost = require('../routes/post/upload');
const { ExiftoolProcess } = require('node-exiftool');
let exiftoolBin = require('dist-exiftool'); if (exiftoolBin && exiftoolBin.__esModule) exiftoolBin = exiftoolBin.default;
const { partitions, getCSS } = require('photo-partition');

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
  router.get('/photos/:user/:page*', async (ctx) => {
    if (!ctx.params.user) throw new Error('no user')
    const page = ctx.params.page ? parseInt(ctx.params.page) : 0
    const { entries } = await getPhotos(ctx.params.user, page)
    const newList = entries.map((r) => {
      const aspect = r.ImageWidth._ / r.ImageHeight._
      return {
        width: r.ImageWidth._,
        height: r.ImageHeight._,
        aspect,
        url: r.ThumbUrl._,
      }
    })
    const pp = partitions({
      1200: 1140,
      992: 940,
      768: 720,
    }, newList, 250)
    const outputList = newList
      .map((photo, index) => ({
        url: photo.url,
        class: `s${index}`,
      }))
    const css = getCSS(pp)
    const data = `<style>
img.preview {
  width: 100%;
  height: 100%;
}
div.preview-div {
  float: left;
  padding: 0.1em;
}
${css}
</style>
<div>
${outputList.map(({ class: cl, url }) => `  <div class="preview-div ${cl}"><img class="preview" src="${url}"/></div>` ).join('')}
</div>
`
    ctx.body = temp({
      data,
      title: 'User Photos',
      user: ctx.session.user,
    })
  })
  facebook(router, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.SECRET,
  })
  app.use(router.routes())
  console.log('Started on %s', url)
})()
