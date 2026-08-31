import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Admin from './Admin.jsx'
import './index.css'

// Visiting /?admin=1 renders the private admin view (Supabase Auth login +
// list of received submissions) instead of the public workbook.
const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <Admin /> : <App />}
  </React.StrictMode>
)
