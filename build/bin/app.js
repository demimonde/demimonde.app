let core = require('@idio/core'); if (core && core.__esModule) core = core.default;

(async () => {
  const { app, router, url } = await core({

  }, { port: process.env.PORT || 5000 })
  router.get('/', async (ctx, next) => {
    ctx.body = 'hello world'
    await next()
  })
  app.use(router.routes())
  console.log('Started on %s', url)
})()