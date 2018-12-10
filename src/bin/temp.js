export const getHello = (user) => {
  if (!user) return ''
  return `Hello, <a href="https://facebook/${user.id}">` + user.name + '</a>.'
}

const temp = ({ data, title = 'Demimonde.app', user, script = () => {} }) => {
  return `<!doctype html>
<html>
<head>
  <title>${title}</title>
</head>
<body>
  ${getHello(user)}
  ${user ? '<a href="/signout">Sign out</a> <a href="/upload">Upload</a>' : '<a href="/auth/facebook"><img src="/fb.png"></a>'}
  ${data}
</body>
<script>
(function ${script.toString()})()
</script>
</html>`
}

export default temp