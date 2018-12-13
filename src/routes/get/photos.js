import { partitions, getCSS } from 'photo-partition'
import { getPhotos } from '../../lib'
import temp from '../../bin/temp'

async function getPhotosRoute(ctx) {
  const { id } = ctx.session.user
  const page = ctx.params.page ? parseInt(ctx.params.page) : 1
  const entries = await getPhotos(ctx.tableService, id, page)
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
  const data = `<style>
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
    title: 'User Photos',
    user: ctx.session.user,
  })
}

export default getPhotosRoute