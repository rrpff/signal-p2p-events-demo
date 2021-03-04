import './index.css'

import React from 'react'
import ReactDOM from 'react-dom'
import reportWebVitals from './reportWebVitals'

const App = () => {
  return (
    <span>testooooo</span>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

if (process.env.NODE_ENV === 'development') {
  reportWebVitals(console.log)
}
