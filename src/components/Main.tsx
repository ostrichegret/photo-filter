import * as PIXI from 'pixi.js';
import Slider from 'rc-slider';
import * as React from 'react';
import { fragmentShader } from '../filters/pixelate';
import FileDropper from './FileDropper';
import Header from './Header';

import 'styles/main.scss';

const DEFAULT_RENDERER_WIDTH = 800;
const DEFAULT_RENDERER_HEIGHT = 600;
const WIDTH_HEIGTH_RATIO = DEFAULT_RENDERER_WIDTH / DEFAULT_RENDERER_HEIGHT;

let pixiAPP: PIXI.Application;
interface IComponentState {
  hasImg: boolean;
  pixelateX: number;
  pixelateY: number;
  blur: number;
  noise: number;
}

interface IFilterSetting {
  label: string;
  min: number;
  max: number;
  key: string;
}
const settingList: IFilterSetting[] = [{
  key: 'blur',
  label: 'Blur: ',
  max: 20,
  min: 0,
}, {
  key: 'noise',
  label: 'Noise: ',
  max: 8,
  min: 0,
}, {
  key: 'pixelateX',
  label: 'PixelateX: ',
  max: 20,
  min: 1,
}, {
  key: 'pixelateY',
  label: 'PixelateY: ',
  max: 20,
  min: 1,
}];

export default class Main extends React.Component<{}, IComponentState> {
  private sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
  private needUpdateDownloadLink = false;

  constructor() {
    super();
    this.state = { hasImg: false, pixelateX: 1, pixelateY: 1, blur: 1, noise: 0 };
  }

  componentDidMount() {
    pixiAPP = new PIXI.Application({ backgroundColor: 0xffffff });
    pixiAPP.renderer.autoResize = true;
    pixiAPP.renderer.resize(0, 0);
    (this.refs.pixi as HTMLElement).appendChild(pixiAPP.view);
    pixiAPP.stage.addChild(this.sprite);

    const blurFilter = new PIXI.filters.BlurFilter(3);
    const noiseFilter = new PIXI.filters.NoiseFilter(3);
    const customizedFilter = new PIXI.Filter(
      PIXI.Filter.defaultVertexSrc,
      fragmentShader,
    );
    this.sprite.filters = [
      noiseFilter,
      blurFilter,
      customizedFilter,
    ];

    pixiAPP.ticker.add(() => {
      const { blur, noise, pixelateX, pixelateY } = this.state;
      blurFilter.blur = blur;
      noiseFilter.noise = noise;
      (customizedFilter.uniforms as any).size = [pixelateX, pixelateY];
      pixiAPP.render();
      if (this.needUpdateDownloadLink) {
        (this.refs.link as HTMLElement).setAttribute(
          'href',
          pixiAPP.renderer.view.toDataURL(),
        );
        this.needUpdateDownloadLink = false;
      }
    });
  }

  handleImage = (img: HTMLImageElement) => {
    const process = ({ height, width, texture }) => {
      this.sprite.texture = texture;

      let ratio = 1;
      let rendererWidth = DEFAULT_RENDERER_WIDTH;
      let rendererHeight = DEFAULT_RENDERER_HEIGHT;
      pixiAPP.renderer.resize(rendererWidth, rendererHeight);
      if (width > DEFAULT_RENDERER_WIDTH || height > DEFAULT_RENDERER_HEIGHT) {
        const temp = height * WIDTH_HEIGTH_RATIO;

        if (temp > width) {
          ratio = DEFAULT_RENDERER_HEIGHT / height;
          rendererWidth = DEFAULT_RENDERER_WIDTH * width / temp;
        } else {
          ratio = DEFAULT_RENDERER_WIDTH / width;
          rendererHeight = DEFAULT_RENDERER_HEIGHT / (width / temp);
        }
      } else {
        rendererWidth = width < rendererWidth ? width : rendererWidth;
        rendererHeight = height < rendererHeight ? height : rendererHeight;
      }
      this.sprite.scale.set(ratio, ratio);
      (this.refs.pixi as HTMLElement).style.width = rendererWidth + 'px';
      (this.refs.pixi as HTMLElement).style.height = rendererHeight + 'px';

      pixiAPP.renderer.resize(rendererWidth, rendererHeight);
      this.setState({ hasImg: true });
      this.needUpdateDownloadLink = true;
    };
    const src = PIXI.loader.resources[img.src];
    if (src) {
      const { texture }  = src;
      process({ height: texture.height, width: texture.width, texture });
    } else {
      PIXI.loader
        .add(img.src)
        .load(() => {
          const { texture } = PIXI.loader.resources[img.src];
          process({ height: texture.height, width: texture.width, texture });
        });
    }
  }

  onSlideChangeGenerator = key => {
    return (value: number) => {
      this.needUpdateDownloadLink = true;
      this.setState({ [key]: value });
    };
  }

  render() {
    const { hasImg } = this.state;

    return (
      <div className="main">
        <Header handleImage={this.handleImage} />
        { hasImg && (
          <div className="control-panel">
          {
            settingList.map((d, i) => (
              <div key={i} className="setting-item">
                <span>{d.label}</span>
                <Slider
                  className="rc-slider"
                  min={d.min}
                  max={d.max}
                  value={this.state[d.key]}
                  onChange={this.onSlideChangeGenerator(d.key)}
                />
              </div>
            ))
          }
          </div>
        )}
        <div
          className={`pixi-container ${hasImg ? '' : 'default'}`}
          ref="pixi"
          style={{ height: DEFAULT_RENDERER_HEIGHT, width: DEFAULT_RENDERER_WIDTH }}
        >
          <FileDropper className="file-dropper" handleImage={this.handleImage} />
          {!hasImg && (
            <div className="file-mentor">
              <p>Upload your photo by dragging it to here or clicking the right-top button :)</p>
              <i className="fa fa-picture-o" />
            </div>
          )}
        </div>
        { hasImg && (
          <a ref="link" className="button" download="output.png" id="downloader">
            <i className="fa fa-download" />Download
          </a>
        )}
      </div>
    );
  }
}
