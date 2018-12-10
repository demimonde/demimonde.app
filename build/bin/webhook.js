module.exports=(router, bodyparser) => {
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
}
