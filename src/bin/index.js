require('alamode')()
process.env.NODE_ENV != 'production' && require('@demimonde/dotenv')()
require('./app')