import React, {Component, PropTypes} from 'react'
import _get from 'lodash/get'
import {computed, autorun, action, observable, runInAction} from 'mobx'
import {observer} from 'mobx-react'
import FineUploaderTraditional from 'react-fine-uploader'
import FileInput from 'react-fine-uploader/file-input'
import DropZone from 'react-fine-uploader/dropzone'
import ReactDOM from 'react-dom'
import MDSpinner from 'react-md-spinner'
import _uniq from 'lodash/uniq'
import $ from 'jquery'

import s from './Uploader.sass'


@observer
class Gallery extends Component {
  static propTypes = {
    files: PropTypes.arrayOf(PropTypes.shape({
      image    : PropTypes.string,
      type     : PropTypes.string,
      link     : PropTypes.string,
      href     : PropTypes.string,
      title    : PropTypes.string,
      download : PropTypes.string,
    })).isRequired,
    onRemove: PropTypes.func,
  }
  @observable windowWidth = $(window).width()

  componentWillMount () {
    $(window).on('keydown', this.onKeyDown)
    $(window).on('resize', this.onResize)
  }

  componentWillUnmount () {
    $(window).off('keydown', this.onKeyDown)
    $(window).off('resize', this.onResize)
  }

  onKeyDown = e => {
    if (!this.fullscreen) return
    switch (e.keyCode) {
      case 13: // enter
      case 27:
        this.exitFullScreen()
        break
      case 32: // space
      case 39: // right
        this.next()
        break
      case 37: // left
        this.prev()
        break
    }
  }

  @action onResize = () => {
    this.windowWidth = $(window).width()
  }


  @observable images = observable.map()

  toHref = src => src

  @observable fullscreen = false
  @observable current = null

  @action onLoad = (image, e) => {
    this.images.set(image, {
      ok     : true,
      width  : e.target.width,
      height : e.target.height,
    })
  }
  @action onError = (image, e) => {
    this.images.set(image, {
      ok: false,
    })
  }
  @computed get hiddenImages () {
    return _uniq(this.props.files.map(f => f.image)).filter(img => !this.images.get(img))
  }
  @computed get showedImages () {
    return this.props.files.filter(f => {
      let image = this.images.get(f.image)
      return image && image.ok
    })
  }

  @computed get width () {
    this.hiddenImages
    this.windowWidth
    if (!this.refs.gallery) return 600

    return ReactDOM.findDOMNode(this.refs.gallery).getBoundingClientRect().width
  }

  @action enterFullScreen = f => {
    this.current = f
    this.fullscreen = true
  }
  @action exitFullScreen = f => {
    this.fullscreen = false
  }

  @action next = () => {
    if (!this.fullscreen) return
    let images = [...this.showedImages].reverse().filter(f => f.type === 'IMAGE')
    let i = -1
    images.forEach((f, ni) => {
      if (f.link === this.current.link) i = ni
    })
    i++
    if (i >= images.length) i = 0
    this.current = images[i]
  }
  @action prev = () => {
    if (!this.fullscreen) return
    let images = [...this.showedImages].reverse().filter(f => f.type === 'IMAGE')
    let i = 1
    images.forEach((f, ni) => {
      if (f.link === this.current.link) i = ni
    })
    i--
    if (i < 0) i = images.length - 1
    this.current = images[i]
  }

  @computed.struct get rows () {
    let rows = []
    let W = this.width
    let MINH = 100
    let MAXH = 160
    let p = 4
    let row = {
      a      : 0,
      images : [],
    };
    [...this.showedImages].reverse().forEach(f => {
      let o = this.images.get(f.image)
      let na = row.a + (o.width + p) / (o.height + p)
      let nh = W / na
      if (nh >= MINH || !row.a) {
        row.a = na
        row.images.push(f)
      } else {
        rows.push(row)
        row = {
          a      : (o.width + p) / (o.height + p),
          images : [f],
        }
      }
    })
    if (row.images.length) rows.push(row)
    rows.forEach(row => {
      row.h = Math.min(MAXH, W / row.a)
    })
    return rows
  }

  remove = link => {
    this.props.onRemove && this.props.onRemove(link)
  }

  imgTags = {}

  render () {
    return (
      <div className={s.gallery} ref='gallery'>
        {this.fullscreen ? (
          <div className={s.full}>
            <div className={s.fullBackground} />
            <div
              className={s.fullImage}
              onClick={this.next}
              key={this.current.image}
              style={{
                background     : `url(${this.current.image}) no-repeat center center`,
                backgroundSize : 'contain',
              }}
            />
            <div className={s.exitFullScreen} onClick={this.exitFullScreen}>×</div>
          </div>
        ) : null}
        <div className={s.rows}>
          {this.rows.map((row, i) =>
            <div
              key={i}
              style={{
                height: row.h,
              }}
              className={s.row}>
              {row.images.map((f, i) => {
                let o = this.images.get(f.image)
                let p = 4
                return (
                  <div
                    key={i}
                    title={f.title || f.download}
                    style={{
                      marginLeft  : p,
                      marginRight : p,
                      height      : row.h - p * 2,
                      width       : row.h * (o.width + p) / (o.height + p) - p * 2,
                    }}
                    className={s.rowItem}>
                    {f.type === 'IMAGE'
                      ? (
                        <div className={s.imgWrap} onClick={this.enterFullScreen.bind(this, f)}>
                          {(() => {
                            if (!this.imgTags[f.image]) {
                              this.imgTags[f.image] = <img key={this.toHref(f.image)} src={this.toHref(f.image)} />
                            }
                            return this.imgTags[f.image]
                          })()}
                        </div>
                      ) : (
                        <a
                          href={f.href}
                          download={f.download}
                          title={f.title || f.download}
                          className={s.imgWrap}
                        >
                          {(() => {
                            if (!this.imgTags[f.image]) {
                              this.imgTags[f.image] = <img key={this.toHref(f.image)} src={this.toHref(f.image)} />
                            }
                            return this.imgTags[f.image]
                          })()}
                        </a>
                      )
                    }
                    <div className={s.remove} onClick={this.remove.bind(this, f.link)}>×</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div hidden>
          {[...this.hiddenImages].reverse().slice(0, 1).map(image =>
            <img
              key={image}
              src={this.toHref(image)}
              onLoad={this.onLoad.bind(this, image)}
              onError={this.onError.bind(this, image)} />
          )}
        </div>
      </div>
    )
  }
}

export default
@observer
class Uploader extends Component {
  static propTypes = {
    store : PropTypes.object.isRequired,
    field : PropTypes.string.isRequired,
  }
  @computed get store () {
    return _get(this.props, ['store', ...this.props.field.split('.').reverse().slice(1).reverse()])
  }
  @computed get field () {
    return this.props.field.split('.').slice(-1)[0]
  }
  @computed get value () {
    return this.store[this.field] || []
  }
  set value (v) {
    let arr = _uniq(v || []).sort()
    this.store[this.field] = arr
  }

  toHref = src => src.match(/^http/) ? src : '/9r/files/download/' + src
  toImage = src => {
    let metadata = this.metadata.get(src)
    switch (metadata.type) {
      case 'IMAGE':
        return this.toHref(src)
      case 'WORD':
        return '/9r/telephonist/word_logo.png'
      case 'EXCEL':
        return '/9r/telephonist/excel_logo.png'
      case 'PDF':
        return '/9r/telephonist/pdf_logo.png'
    }
  }

  @action addFile (...files) {
    let arr = [...this.value]
    arr.unshift(...files)
    this.value = arr
  }
  @observable uploading = false
  disposers = []
  @observable metadata = observable.map({})
  @observable uploaderkey = 0
  componentWillMount () {
    this.uploader = new FineUploaderTraditional({
      options: {
        request: {
          endpoint: '/9r/files/upload'
        },
        validation: {
          stopOnFirstInvalidFile: false,
        },
        callbacks: {
          onComplete: (id, name, response) => {
            try {
              if (response && response.filesMetadata) {
                this.addFile(...response.filesMetadata.map(f => f.filePath))
              }
            } catch (e) { console.warn(e.stack) }
          },
          onUpload: action(() => {
            this.uploading = true
          }),
          onAllComplete: action(() => {
            this.uploading = false
            try { this.uploader.methods.cancelAll() } catch (e) { console.warn(e.stack) }
            try { this.uploader.methods.clearStoredFiles() } catch (e) { console.warn(e.stack) }
            try { this.uploader.methods.reset() } catch (e) { console.warn(e.stack) }
            this.uploaderkey++
          }),
          onError: (e) => {
            console.warn(e)
          }
        }
      }
    })
    this.disposers.push(autorun(this.loadFiles))
  }

  componentWillUnmount () {
    try { this.uploader.methods.cancelAll() } catch (e) { console.warn(e.stack) }
    try { this.uploader.methods.clearStoredFiles() } catch (e) { console.warn(e.stack) }
    try { this.uploader.methods.reset() } catch (e) { console.warn(e.stack) }
  }

  loadFiles = () => {
    this.value.filter(src => !this.metadata.get(src))
    .forEach(this.loadFile)
  }

  @action loadFile = async src => {
    this.metadata.set(src, {type: 'LOADING'})
    var metadata = {}
    try {
      let response = await fetch(this.toHref(src), {
        method      : 'HEAD',
        credentials : 'same-origin',
      })
      runInAction(() => {
        let contentType = response.headers.get('content-type') || ''
        let contentDescription = response.headers.get('content-disposition') || ''
        let type = (contentType + contentDescription)
        if (type.match(/image/)) metadata.type = 'IMAGE'
        else if (type.match(/\.pdf/))  metadata.type = 'PDF'
        else if (type.match(/\.doc|\.docx/))  metadata.type = 'WORD'
        else if (type.match(/\.xls|\.xlsx/))  metadata.type = 'EXCEL'
        else if (type.match(/excel|sheet/))  metadata.type = 'EXCEL'
        else if (type.match(/word/))  metadata.type = 'WORD'
        if (!response.ok || !metadata.type) throw new Error('Bad response')
        metadata.filename = contentDescription.match(/filename=(.*)$/)
        metadata.filename = metadata.filename && metadata.filename[1].replace(/^"|"$/, '') || undefined
        if (metadata.filename.match(/\?/) || metadata.filename.replace(/\.\w+$/, '').replace(/[\W_]/g, '') === '') {
          metadata.filename = metadata.filename.replace(
            /^(.*)(\.\w+)$/,
            src.match(/([^/]+\/[^/]+)\/[^/]+$/)[1].replace(/\//g, '-') + '$2'
          )
        }
        if (!metadata.filename) {
          metadata.filename = src.match(/[^/]+$/)[1]
        }
      })
      metadata.ok = true
    } catch (e) {
      runInAction(() => {
        this.remove(src)
        this.metadata.set(src, {type: 'FAILED'})
      })
      console.error(e.stack)
      return
    }
    runInAction(() => {
      this.metadata.set(src, metadata)
    })
  }

  @action remove = (src, e) => {
    e && e.preventDefault()
    e && e.stopPropagation()
    let i = this.value.indexOf(src)
    if (i >= 0) {
      let arr = [...this.value]
      arr.splice(i, 1)
      this.value = arr
    }
  }

  render () {
    return (
      <div className={s.root}>
        <DropZone multiple accept='*' className={s.dropzone} uploader={this.uploader}>
          <div className={s.header}>
            <div className={s.title}>Изображения и документы</div>
            <div className={s.upload}>
              <FileInput key={this.uploaderkey} multiple accept='*' uploader={this.uploader}>
                {(this.uploading) && <MDSpinner size={14} />}
                Добавить
                <i className='fa fa-plus' aria-hidden='true' />
              </FileInput>
            </div>
          </div>
          <Gallery
            ref='gallery'
            onRemove={this.remove}
            files={this.value.filter(src => this.metadata.get(src).ok).map(src => {
              return {
                image    : this.toImage(src),
                type     : this.metadata.get(src).type,
                link     : src,
                href     : this.toHref(src),
                title    : this.metadata.get(src).filename,
                download : this.metadata.get(src).filename,
              }
            })}
          />
        </DropZone>
      </div>
    )
  }
}
