import { partitions, getCSS } from 'photo-partition'
import { getPhotos } from '../../src/lib'
import Layout from '../../src/Layout'

const App = ({ photoList }) => {
  const outputList = photoList
    .map((photo, index) => ({
      url: photo.url,
      class: `s${index}`,
    }))

  return (
    <div className="Container">
      {outputList.map(({ class: cl, url }) =>
        <div key={url} className={`preview-div ${cl}`}>
          <img className="preview" src={url} />
        </div> )}
    </div>
  )
}
export default async (ctx) => {
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

  const css = getCSS(pp)
  const style = `img.preview {
  width: 100%;
  height: 100%;
}
div.preview-div {
  display: inline-block;
}
.Container {
  text-align: center;
}
${css}`
  ctx.body = Layout({
    App: <App photoList={newList} />,
    title: 'User Photos',
    user: ctx.session.user,
    style,
  })
}