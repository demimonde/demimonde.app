const { partitions, getCSS } = require('photo-partition');
const temp = require('../../bin/temp');
const { queryAlbum, getAlbumPhotos } = require('../../lib');

async function getAlbum(ctx) {
  const { id } = ctx.session.user
  const { albumId } = ctx.params

  const album = await queryAlbum(ctx.tableService, id, albumId)
  if (!album) {
    ctx.status = 404
    ctx.body = '<h1>Album Not Found</h1>'
    return
  }

  const page = ctx.params.page ? parseInt(ctx.params.page) : 1
  const entries = await getAlbumPhotos(ctx.tableService, albumId, id, page)
  const newList = entries.map((r) => {
    const aspect = r.ImageWidth._ / r.ImageHeight._
    return {
      width: r.ImageWidth._,
      height: r.ImageHeight._,
      aspect,
      url: r.ThumbUrl._,
    }
  })
  const pp = partitions({
    1200: 1140,
    992: 940,
    768: 720,
  }, newList, 250)

  const outputList = newList
    .map((photo, index) => ({
      url: photo.url,
      class: `s${index}`,
    }))
  const css = getCSS(pp)
  const data = `
    <h1>Album ${album.Name._}</h1>
    <style>
    img.preview {
      width: 100%;
      height: 100%;
    }
    div.preview-div {
      display: inline-block;
    }
    .Container {
      text-align: center;
    }
    ${css}
    </style>
    <div class="Container">
    ${outputList.map(({ class: cl, url }) => `  <div class="preview-div ${cl}"><img class="preview" src="${url}"/></div>` ).join('')}
    </div>
`
  ctx.body = temp({
    data,
    title: 404,
    user: ctx.session.user,
  })
}

module.exports=getAlbum