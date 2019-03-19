import { ExiftoolProcess } from 'node-exiftool'
import exiftoolBin from 'dist-exiftool'
import { c, b } from 'erte'
import Server from './server'
import { createTableService } from 'azure-storage'

async function startExiftool() {
  const ep = new ExiftoolProcess(exiftoolBin)
  const pid = await ep.open()
  return { ep, pid }
}

(async () => {
  // const { MONGO_URL, STORAGE, ELASTIC_SEARCH: elastic } = process.env
  // if (!MONGO_URL) {
  //   console.log('No Mongo connection string.')
  //   process.exit(1)
  // }
  // if (!STORAGE) {
  //   console.log('Azure Storage name not provided.')
  //   process.exit(1)
  // }
  const { url, addContext } = await Server({
    port: process.env.PORT,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.SECRET,
    // storage: STORAGE,
    // storageDomain: process.env.STORAGE_DOMAIN,
    // cdn: process.env.CDN_ENDPOINT,
    PROD: process.env.NODE_ENV == 'production',
    frontendUrl: process.env.FRONT_END || 'https://demimonde.app',
    // elastic,
  })
  console.log('Started on %s', c(url, 'green'),
    // :: %s c(`${url}/admin`, 'blue')
  )

  const { ep, pid } = await startExiftool()
  console.log('Opened %s %s', c(b('exiftool', 'yellow'), 'red'), pid)

  const tableService = createTableService()
  addContext({ exiftool: ep, tableService })

  // OK LETS GO

  // const database = new Database()
  // await database.connect(MONGO_URL)
  // console.log('Connected to %s', b('Mongo', 'green'))
  // addContext({ database })
  // if (elastic) {
  //   await ping(elastic)
  //   console.log('Pinged %s', b(elastic, 'cyan'))
  // }
})()