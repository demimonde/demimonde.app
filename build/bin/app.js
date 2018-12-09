let core = require('@idio/core'); if (core && core.__esModule) core = core.default;

(async () => {
  const { app, router, url, middleware: { bodyparser } } = await core({
    logger: { use: true },
    bodyparser: {},
  }, { port: process.env.PORT || 5000 })
  router.get('/', async (ctx, next) => {
    ctx.body = 'hello world'
    await next()
  })
  router.get('/webhook', async (ctx, next) => {
    const token = ctx.query['hub.verify_token']
    const c = ctx.query['hub.challenge']
    if (token != 'test') ctx.body = ctx.query
    else ctx.body = c
  })
  router.post('/webhook', bodyparser, async (ctx, next) => {
    console.log(ctx.request.body)
    ctx.body = ctx.request.body
  })
  router.get('/privacy', async (ctx, next) => {
    ctx.body = 'Privacy Policy'
  })
  app.use(router.routes())
  console.log('Started on %s', url)
})()