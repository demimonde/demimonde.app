export default (ctx) => {
  // ctx.session.csrf
  if (ctx.query.token !== ctx.session.csrf) {
    ctx.status = 403
    ctx.body = 'invalid token'
    return
  }
  ctx.session = null
  ctx.redirect('/')
}