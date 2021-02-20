import choo from 'choo'
import html from 'choo/html'
import ByteBuffer from 'bytebuffer'
import { ulid } from 'ulid'
import { ISignal, ISignalCiphertext, ISignalCiphertextType, ISignalPreKeyBundle, ISignalProtocolAddress, ISignalProtocolStore } from './interfaces'
import InMemorySignalProtocolStore from './modules/InMemorySignalProtocolStore'
import { bufferToString, bufferToArrayBuffer, buffersAreEqual } from './helpers/buffers'
import { generateIdentity, generateKeyId, generatePreKeyBundle } from './helpers/signal'
import UsernameGenerator from './modules/UsernameGenerator'
import { PeerInviteMessage } from './protos/PeerInviteMessage'

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

class ChatController {
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

    const username = this.store.get('username')
    if (username === undefined) {
      this.store.put('username', UsernameGenerator.generate())
    }

    const userId = this.store.get('userId')
    if (userId === undefined) {
      this.store.put('userId', ulid())
    }
  }

  public async getLocalRegistrationId(): Promise<number> {
    return await this.store.getLocalRegistrationId()
  }

  public async getLocalDeviceId(): Promise<number> {
    return this.store.get('deviceId')
  }

  public async getLocalUsername(): Promise<string> {
    return this.store.get('username')
  }

  public async getLocalUserId(): Promise<string> {
    return this.store.get('userId')
  }

  public async getLocalAddress(): Promise<ISignalProtocolAddress> {
    return new libsignal.SignalProtocolAddress(await this.getLocalRegistrationId(), await this.getLocalDeviceId())
  }

  public async addInviteCode(inviteCode: string): Promise<void> {
    const bytes = new Uint8Array(ByteBuffer.wrap(inviteCode, 'base64').toArrayBuffer())
    const invite = PeerInviteMessage.decode(bytes)

    console.log(invite)

    // do something
  }

  public async createInviteCode(): Promise<string> {
    const bundle = await this.createPreKeyBundle()
    const message = PeerInviteMessage.encode({
      UserId: await this.getLocalUserId(),
      Username: await this.getLocalUsername(),
      PreKeyBundle: {
        IdentityPublicKey: new Uint8Array(bundle.identityKey),
        RegistrationId: bundle.registrationId,
        DeviceId: await this.getLocalDeviceId(),
        PreKeyId: bundle.preKey.keyId,
        PreKeyPublicKey: new Uint8Array(bundle.preKey.publicKey),
        SignedPreKeyId: bundle.signedPreKey.keyId,
        SignedPreKeyPublicKey: new Uint8Array(bundle.signedPreKey.publicKey),
        SignedPreKeySignature: new Uint8Array(bundle.signedPreKey.signature)
      }
    })

    const bytes = message.finish()
    return ByteBuffer.wrap(bytes).toString('base64')
  }

  private async createPreKeyBundle(): Promise<ISignalPreKeyBundle> {
    const preKeyId = await generateKeyId()
    const signedPreKeyId = await generateKeyId()

    return generatePreKeyBundle(this.store, preKeyId, signedPreKeyId)
  }
}

const app = new choo()

app.use(async function SignalMiddleware(state, emitter) {
  const chat = new ChatController(new InMemorySignalProtocolStore())

  await chat.install()

  state.installed = true
  state.registrationId = await chat.getLocalRegistrationId()
  state.deviceId = await chat.getLocalDeviceId()
  state.address = await chat.getLocalAddress()
  state.username = await chat.getLocalUsername()
  state.userId = await chat.getLocalUserId()
  state.readyInviteCode = await chat.createInviteCode()

  await chat.addInviteCode(state.readyInviteCode)

  state.actions = {
    handleInviteCode: (inviteCode: string) => chat.addInviteCode(inviteCode)
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
      <p>logged in as <strong>~${state.username}</strong> (${state.userId})</p>
      <p>local address is ${state.address.toString()}</p>

      <form onsubmit="${handleSubmit}">
        <h2>Either paste an invite code...</h2>
        <input type="text" name="inviteCode" />

        <h2>...or share yours</h2>
        <textarea cols="40" rows="6">${state.readyInviteCode}</textarea>
      </form>
    </div>
  `
})

app.mount('#root')
