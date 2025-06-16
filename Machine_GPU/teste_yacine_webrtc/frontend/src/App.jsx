import React from 'react'

export default function App() {
  const host = window.location.hostname

  return (
    <iframe
      // on pointe directement vers go2rtc sur le port 1984
      src={`http://${host}:1984/webrtc.html?src=cam1&media=video+audio`}
      style={{
        position: 'fixed',
        top:      0,
        left:     0,
        width:    '100vw',
        height:   '100vh',
        border:   0,
        margin:   0,
        padding:  0,
      }}
      allow="autoplay; camera; microphone; encrypted-media"
    />
  )
}
