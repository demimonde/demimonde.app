export default (ctx) => {
  ctx.session = null
  ctx.redirect('/')
}