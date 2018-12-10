       const getHello = (user) => {
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
  <a href="/signout">Sign Out</a>
  ${data}
</body>
<script>
(function ${script.toString()})()
</script>
</html>`
}

module.exports=temp

module.exports.getHello = getHello