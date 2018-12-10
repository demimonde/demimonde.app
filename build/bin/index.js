require('alamode')()
const { readFileSync } = require('fs')
try {
  const f = `${readFileSync('.env')}`
  const ff = f.split('\n')
  ff.forEach(env => {
    const [e, ...rest] = env.split('=')
    process.stdout.write(`[+] ${e} `)
    process.env[e] = rest.join('=')
  })
  process.stdout.write('\n')
} catch (err) { /* */
  console.log(err)
}
require('./app')