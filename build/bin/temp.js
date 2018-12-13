       const getHello = (user) => {
  if (!user) return ''
  return `Hello, <a href="https://facebook.com/${user.id}">` + user.name + '</a>.'
}

const temp = ({ data, title = 'Demimonde.app', user, script = () => {} }) => {
  return `<!doctype html>
<html>
<head>
  <title>${title}</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png">
</head>
<body>
  <a href="/"><img src="/logo.png"></a><br>
  ${getHello(user)}
  ${user ? '<a href="/signout">Sign out</a> <a href="/upload">Upload</a>' : '<a href="/auth/facebook"><img src="/fb.png"></a>'}
  ${data}
</body>
<script>
(function ${script.toString()})()
</script>
</html>`
}

module.exports=temp

module.exports.getHello = getHello