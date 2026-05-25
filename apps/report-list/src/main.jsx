import React from 'react'
import ReactDOM from 'react-dom/client'
import 'titan-compositions/styles'
import './index.css'
import App from './App'
import { normalizePrototypeEntryUrl } from './prototypeEntryUrl.js'

document.documentElement.dataset.theme ||= 'audiense'
normalizePrototypeEntryUrl()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
