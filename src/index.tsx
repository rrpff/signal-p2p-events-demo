import './index.css'

import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import reportWebVitals from './reportWebVitals'
import InMemorySignalProtocolStore from './packages/signal-session/InMemorySignalProtocolStore'
import SignalUserInstaller from './packages/signal-session/SignalUserInstaller'
import PeerjsEncryptedEventStream from './modules/PeerjsEncryptedEventStream'
import SignalSignator from './packages/signal-session/SignalSignator'
import InMemoryStore from './modules/InMemoryStore'
import { IEvent } from './interfaces'
import { IEventStream } from './packages/event-stream/interfaces'

const appStore = new InMemoryStore()
const store = new InMemorySignalProtocolStore()
const installer = new SignalUserInstaller(store)
const signator = new SignalSignator(store)
const peer = new PeerjsEncryptedEventStream(appStore, installer, signator)

const useEventStream = (stream: IEventStream<IEvent>) => {
  const [events, setEvents] = useState([] as IEvent[])

  useEffect(() => {
    stream.subscribe(event => setEvents(e => [...e, event]))
  }, [stream])

  return events
}

const App = () => {
  const [localConnectionString, setLocalConnectionString] = useState('')
  const [remoteConnectionString, setRemoteConnectionString] = useState('')
  const [typing, setTyping] = useState('')
  const stream = useEventStream(peer)

  const connect = async () => {
    await peer.setup()
    setLocalConnectionString(peer.inviteCode!)
  }

  useEffect(() => { connect() }, [])

  return (
    <div>
      <pre><code>{localConnectionString}</code></pre>

      <form onSubmit={e => {
        e.preventDefault()
        peer.sync(remoteConnectionString)
      }}>
        <input type="text" value={remoteConnectionString} onChange={e => setRemoteConnectionString(e.target.value)} />
        <input type="submit" value="send invite" />
      </form>

      <form onSubmit={e => {
        e.preventDefault()
        peer.push({ id: '123', 'type': 'TEST-MESSAGE', value: typing })
        setTyping('')
      }}>
        <input type="text" value={typing} onChange={e => setTyping(e.target.value)} />
      </form>

      <pre><code>{stream.map(e => JSON.stringify(e)).join('\n\n')}</code></pre>
    </div>
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
