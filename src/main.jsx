import React from 'react'
import ReactDOM from 'react-dom/client'
import Root from './Root.jsx'
import Admin from './Admin.jsx'
import './index.css'

// Visiting /?admin=1 renders the private admin view (Supabase Auth login +
// list of received submissions) instead of the public workbook. Everything
// else goes through Root, which handles the home page / espace client /
// routing between the two volets (see Root.jsx for the exact logic,
// including the backward-compat path for a client already mid-volet-1
// under the previous, single-page version).
const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <Admin /> : <Root />}
  </React.StrictMode>
)
