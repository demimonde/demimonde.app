// import temp from '../../bin/temp'

// export default async (ctx) => {
//   const user = ctx.session.user
//   const data = `<h1>Add Album Form</h1>
//     <form method="POST">
//       <input type="hidden" name="_csrf" value="${ctx.csrf}">
//       <input name="name" required placeholder="name">
//       <input type="submit">
//     </form>
// `
//   ctx.body = temp({ data, title: 'Add Album', user })
// }