## .env

The local environment can be setup using the `.env` file:

```sh
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=ex;AccountKey=asdf78123ghjs/ahsjdgf765asd54==;EndpointSuffix=core.windows.net"
STORAGE=storage
CONTAINER=container
SECRET=facebook-secret
```

It is available when running the app both via `src/bin` and via `build/bin` directories, however the production entry is `build/bin/app.js`.
