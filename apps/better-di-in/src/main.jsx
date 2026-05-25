import React from 'react'
import ReactDOM from 'react-dom/client'
import 'titan-compositions/styles'
import './index.css'
import App from './App.jsx'

document.documentElement.dataset.theme ||= 'linkedin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
