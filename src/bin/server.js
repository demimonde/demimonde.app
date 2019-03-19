import core from '@idio/core'
import facebook from '@idio/facebook'
import initRoutes, { watchRoutes } from '@idio/router'
import Layout from '../Layout'

// import webhook from './webhook'
// import uploadPost from '../routes/post/upload'
// import getUploadRoute from '../routes/get/upload'
// import getPhotos from '../routes/get/photos'
// import getAlbums from '../routes/get/albums'
// import getAlbum from '../routes/get/album'
// import getAddAlbum from '../routes/get/add-album'
// import postAddAlbum from '../routes/post/add-album'

async function checkToken(ctx, next) {
  const token = ctx.session.token
  if (!token) throw new Error('No user access token in session.')
  await next()
}

const maxage = PROD => PROD ? 1000 * 60 * 60 * 60 * 24 : 0

export default async (opts) => {
  const {
    port = 5000, PROD, watch = !PROD,
    // storage, storageDomain,
    client_id, client_secret,
    // cdn, frontendUrl, exiftool, elastic,
  } = opts
  const { app, router, url, middleware } = await core({
    session: {
      use: true, keys: [process.env.SESSION_KEY || 'dev'],
    },
    // logger: { use: process.env != 'production' },
    bodyparser: {},
    static: { use: true, root: 'static', maxage },
    multer: { config: {
      dest: 'upload',
    } },
    checkauth: {},
    // csrf: {},
  }, { port })
  // app.context.storage = process.env.STORAGE
  // app.context.container = process.env.CONTAINER

  const w = await initRoutes(router, 'routes', {
    middleware,
  })
  if (watch) await watchRoutes(w)

  // webhook(router, bodyparser)
  // router.get('/privacy', async (ctx) => {
  //   ctx.body = temp({
  //     data: '<h1>Privacy Policy</h1>',
  //     title: 'Privacy Policy',
  //     user: ctx.session.user,
  //   })
  // })
  // router.get('/add-album', checkauth, csrf, getAddAlbum)
  // router.post('/add-album', checkauth, bodyparser, csrf, postAddAlbum)
  // router.get('/album/:albumId', checkauth, csrf, getAlbum)
  // router.get('/albums', checkauth, csrf, getAlbums)
  // router.get('/upload', checkauth, csrf, getUploadRoute)
  // router.post('/upload', checkauth, multer.single('file'), async (ctx, next) => {
  //   ctx.request.body = ctx.request.body || {}
  //   ctx.request.body._csrf = ctx.req.body._csrf
  //   await next()
  // }, csrf, uploadPost)
  // router.get('/photos/:page*', async (ctx, next) => {
  //   if (!ctx.session.user) {
  //     ctx.body = temp({
  //       data: 'Please sign in to see your photos',
  //       title: 'Please sign in',
  //     })
  //     return
  //   }
  //   await next()
  // }, getPhotos)
  facebook(router, {
    client_id,
    client_secret,
  })
  app.use(router.routes())
  // console.log('Started on %s', url)
  app.context.Layout = ({ session = {}, App, script, style, title }) => {
    return Layout({
      user: session.user,
      csrf: session.token,
      App, script, style, title,
    })
  }
  return {
    app, url, addContext(item) {
      console.log('> Adding App Context %s', Object.keys(item).join(' '))
      Object.assign(app.context, item)
    },
  }
}