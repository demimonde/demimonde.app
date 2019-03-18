import { partitions, getCSS } from 'photo-partition'

const Container = ({ photoList }) => {
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

const photos = (entries) => {
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

  const style = getCSS(pp)
  return {
    Container: <Container photoList={newList} />,
    style,
  }
}

export default photos