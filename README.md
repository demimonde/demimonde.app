# @demimonde/demimonde.app

[![npm version](https://badge.fury.io/js/@demimonde/demimonde.app.svg)](https://npmjs.org/package/@demimonde/demimonde.app)

`@demimonde/demimonde.app`: The app where people can sell their Instagram photographs by tagging the Demimonde user.

## Web Server

The webserver can be started in development mode using the

```sh
node src/bin
```

command. The production version will be run using `build/bin/app.js`. The server is based off `@idio/core` and can be configured to serve static files and routes easily.

## Dokku Deploy

To deploy on a Dokku host, an app needs to be created first, and the `DOKKU_LETSENCRYPT_EMAIL` should be set. Locally, the following command will add a remote git repo that can be used for deploy:

```sh
git add remove dokku dokku@artd.eco:idio.co
```

On the host, the app need to be prepated first.

```sh
dokku apps:create idio.co
dokku config:set --no-restart idio.co DOKKU_LETSENCRYPT_EMAIL=ssh@adc.sh
# deploy from git
dokku letsencrypt idio.co
```

## Copyright

(c) [Demimonde][1] 2018

[1]: https://demimonde.cc
