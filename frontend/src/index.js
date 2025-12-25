import "./polyfills.js";
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { Buffer } from "buffer";
import process from 'process';

window.Buffer = Buffer;
window.global = window;
window.process = process;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
);
