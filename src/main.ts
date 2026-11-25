import 'barrel.css/dist/barrel.min.css';
import 'barrel.css/dist/themes/basic.min.css';
import './styles.css';

import { app } from './app.js';
import { CalcApp } from './framework/components/calc-app.js';

const widget = document.querySelector('calc-app');
if (!(widget instanceof CalcApp)) {
  throw new Error('The page must contain a <calc-app> element.');
}
widget.app = app;
