import choo from 'choo'
import html from 'choo/html'
import ByteBuffer from 'bytebuffer'
import protobuf from 'protobufjs'
import { ISignal, ISignalPreKeyBundle, ISignalProtocolAddress, ISignalProtocolStore } from './interfaces'
import InMemorySignalProtocolStore from './modules/InMemorySignalProtocolStore'
import { bufferToString, bufferToArrayBuffer, buffersAreEqual } from './helpers/buffers'
import { generateIdentity, generateKeyId, generatePreKeyBundle } from './helpers/signal'

declare var libsignal: ISignal

const runExample = async () => {
  // Alice installs the app
  const aliceStore = new InMemorySignalProtocolStore()
  const aliceRegistrationId = await generateIdentity(aliceStore)
  const aliceDeviceId = 0
  const aliceAddress = new libsignal.SignalProtocolAddress(aliceRegistrationId, aliceDeviceId)

  // Bob installs the app
  const bobStore = new InMemorySignalProtocolStore()
  const bobRegistrationId = await generateIdentity(bobStore)
  const bobDeviceId = 0
  const bobAddress = new libsignal.SignalProtocolAddress(bobRegistrationId, bobDeviceId)

  // Bob generates a PreKey bundle to share with Alice
  const bobPreKeyId = 123
  const bobSignedKeyId = 456
  const bobPreKeyBundle = await generatePreKeyBundle(bobStore, bobPreKeyId, bobSignedKeyId)

  // Bob shares his address and PreKey bundle with Alice

  // Alice creates a session with Bob
  const builder = new libsignal.SessionBuilder(aliceStore, bobAddress)
  await builder.processPreKey(bobPreKeyBundle)

  // Alice encrypts a message for Bob
  const message1 = bufferToArrayBuffer('hey bob')
  const aliceSessionCipher = new libsignal.SessionCipher(aliceStore, bobAddress)
  const ciphertext1 = await aliceSessionCipher.encrypt(message1)

  // Alice sends the message and her signal address to Bob

  // Bob reads Alice's message using the bundled PreKey, implicitly creating a session with her
  if (ciphertext1.type !== 3) throw new Error('ciphertext did not include a PreKey bundle')
  const bobSessionCipher = new libsignal.SessionCipher(bobStore, aliceAddress)
  const plaintext1 = await bobSessionCipher.decryptPreKeyWhisperMessage(ciphertext1.body, 'binary')
  console.log(`> Alice to Bob: "${bufferToString(plaintext1)}"`)

  // Bob encrypts a response for Alice
  const message2 = bufferToArrayBuffer('hey alice!')
  const ciphertext2 = await bobSessionCipher.encrypt(message2)

  // Bob sends the message to Alice

  // Alice reads Bob's message using the existing Bob session she has created
  const plaintext2 = await aliceSessionCipher.decryptWhisperMessage(ciphertext2.body, 'binary')
  console.log(`> Bob to Alice: "${bufferToString(plaintext2)}"`)

  // Alice and Bob sit together and confirm their messages match, just for fun
  console.log(`Message #1 matches? ${buffersAreEqual(plaintext1, message1)}`)
  console.log(`Message #2 matches? ${buffersAreEqual(plaintext2, message2)}`)

  // Now Alice and Bob can send messages with their established sessions
  const ciphertext3 = await aliceSessionCipher.encrypt(bufferToArrayBuffer('have a great day'))
  const plaintext3 = await bobSessionCipher.decryptWhisperMessage(ciphertext3.body, 'binary')
  console.log(`> Alice to Bob: "${bufferToString(plaintext3)}"`)

  const ciphertext4 = await bobSessionCipher.encrypt(bufferToArrayBuffer('you too!'))
  const plaintext4 = await aliceSessionCipher.decryptWhisperMessage(ciphertext4.body, 'binary')
  console.log(`> Bob to Alice: "${bufferToString(plaintext4)}"`)
}

// ;(async () => {
//   const store = new InMemorySignalProtocolStore()

//   document.body.innerHTML = ''

//   ;[
//     { text: 'Install', handler: () => install(store).then(() => console.info('Installed')) },
//     { text: 'Run Console Example', handler: () => runExample() },
//   ].forEach(button => {
//     const buttonEl = document.createElement('button')
//     buttonEl.innerText = button.text
//     buttonEl.onclick = button.handler
//     buttonEl.style.display = 'block'
//     document.body.appendChild(buttonEl)
//   })
// })()

class SignalController {
  constructor(private store: ISignalProtocolStore) {}

  public async install() {
    const identityKeyPair = await this.store.getIdentityKeyPair()
    if (identityKeyPair === undefined) {
      await generateIdentity(this.store)
    }

    const deviceId = this.store.get('deviceId')
    if (deviceId === undefined) {
      this.store.put('deviceId', 1)
    }
  }

  public async getLocalRegistrationId(): Promise<number> {
    return await this.store.getLocalRegistrationId()
  }

  public async getLocalDeviceId(): Promise<number> {
    return this.store.get('deviceId')
  }

  public async getLocalAddress(): Promise<ISignalProtocolAddress> {
    return new libsignal.SignalProtocolAddress(await this.getLocalRegistrationId(), await this.getLocalDeviceId())
  }

  public async addInviteCode(inviteCode: string): Promise<void> {
    const bytes = new Uint8Array(ByteBuffer.wrap(inviteCode, 'binary').toArrayBuffer())
    const protobufRoot = await protobuf.load('assets/dist/types.proto')
    const PreKeyBundleMessage = protobufRoot.lookupType('signalEventsDemo.PreKeyBundleMessage')
    const bundle = PreKeyBundleMessage.decode(bytes)

    // do something
  }

  public async createInviteCode(): Promise<string> {
    const bundle = await this.createPreKeyBundle()
    const protobufRoot = await protobuf.load('assets/dist/types.proto')
    const PreKeyBundleMessage = protobufRoot.lookupType('signalEventsDemo.PreKeyBundleMessage')

    const payload = {
      IdentityPubKey: new Uint8Array(bundle.identityKey),
      RegistrationId: bundle.registrationId,
      DeviceId: await this.getLocalDeviceId(),
      PreKeyId: bundle.preKey.keyId,
      PreKeyPublicKey: new Uint8Array(bundle.preKey.publicKey),
      SignedPreKeyId: bundle.signedPreKey.keyId,
      SignedPreKeyPublicKey: new Uint8Array(bundle.signedPreKey.publicKey),
      SignedPreKeySignature: new Uint8Array(bundle.signedPreKey.signature)
    }

    const err = PreKeyBundleMessage.verify(payload)
    if (err) throw new Error(err)

    const message = PreKeyBundleMessage.create(payload)
    const bytes = PreKeyBundleMessage.encode(message).finish()

    return ByteBuffer.wrap(bytes).toString('binary')
  }

  private async createPreKeyBundle(): Promise<ISignalPreKeyBundle> {
    const preKeyId = await generateKeyId()
    const signedPreKeyId = await generateKeyId()

    return generatePreKeyBundle(this.store, preKeyId, signedPreKeyId)
  }
}

const app = new choo()

app.use(async function SignalMiddleware(state, emitter) {
  const signal = new SignalController(new InMemorySignalProtocolStore())

  await signal.install()

  state.installed = true
  state.registrationId = await signal.getLocalRegistrationId()
  state.deviceId = await signal.getLocalDeviceId()
  state.address = await signal.getLocalAddress()
  state.readyInviteCode = await signal.createInviteCode()

  await signal.addInviteCode(state.readyInviteCode)

  state.actions = {
    handleInviteCode: (inviteCode: string) => signal.addInviteCode(inviteCode)
  }

  emitter.emit('render')
})

app.route('/', (state) => {
  const handleSubmit = (e: any) => {
    e.preventDefault()
    const inviteCode = e.target[0].value
    state.actions.handleInviteCode(inviteCode)
  }

  if (!state.installed)
    return html`
      <div>
        <h1>signal<em>ish</em></h1>
        <span>installing...</span>
      </div>
    `

  return html`
    <div>
      <h1>signal<em>ish</em></h1>
      <span>local address is ${state.address.toString()}</span>

      <form onsubmit="${handleSubmit}">
        <h2>Either paste an invite code...</h2>
        <input type="text" name="inviteCode" />

        <h2>...or share yours</h2>
        <pre><code>${state.readyInviteCode}</code></pre>
      </form>
    </div>
  `
})

app.mount('#root')
