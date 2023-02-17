import React from 'react';
import ReactDOM from 'react-dom/client';
// Components
import App from './App';
// Utils
import { BrowserRouter } from "react-router-dom";
import { CookiesProvider } from 'react-cookie';
import reportWebVitals from './reportWebVitals';
// Styles
import './index.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

require('dotenv').config()

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <CookiesProvider>
        <App />
      </CookiesProvider>
    </BrowserRouter>
  </React.StrictMode>
  );

reportWebVitals();
