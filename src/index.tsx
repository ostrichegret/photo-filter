import 'babel-polyfill';
import * as PIXI from 'pixi.js';
import 'rc-slider/assets/index.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './components/Main';

PIXI.utils.skipHello();
import 'font-awesome/css/font-awesome.min.css';
import 'normalize.css/normalize.css';

import 'styles/reset.scss';

// Render the main component into the dom
ReactDOM.render(<App />, document.getElementById('app'));
