import InMemorySignalProtocolStore from '../packages/signal-session/InMemorySignalProtocolStore'
import SignalSignator from '../packages/signal-session/SignalSignator'
import SignalUserInstaller from '../packages/signal-session/SignalUserInstaller'
import { PeerInviteMessage } from '../protos/PeerInviteMessage'
import JsonInviteSerializer from './JsonInviteSerializer'

test('serializes invites to protobufs', async () => {
  const invite = await generateInvite()
  const serializer = new JsonInviteSerializer()

  expect(serializer.serialize(invite.deserialized)).toEqual(invite.serialized)
})

test('deserializes invites from protobufs', async () => {
  const invite = await generateInvite()
  const serializer = new JsonInviteSerializer()

  expect(serializer.deserialize(invite.serialized)).toEqual(invite.deserialized)
})

test('can read what it writes', async () => {
  const invite = await generateInvite()
  const serializer = new JsonInviteSerializer()

  const serialized = serializer.serialize(invite.deserialized)
  const deserialized = serializer.deserialize(serialized)

  expect(deserialized).toEqual(invite.deserialized)
})

const generateInvite = async () => {
  const store = new InMemorySignalProtocolStore()
  const installer = new SignalUserInstaller(store)
  const signator = new SignalSignator(store)

  await installer.install()
  const user = await installer.getLocalUser()
  const preKeyBundle = await signator.createPreKeyBundle()

  return {
    deserialized: { user, preKeyBundle },
    serialized: JSON.stringify(PeerInviteMessage.toJSON({
      UserId: user.identifier,
      PreKeyBundle: {
        IdentityPublicKey: new Uint8Array(preKeyBundle.identityKey),
        RegistrationId: user.registrationId,
        DeviceId: user.deviceId,
        PreKeyId: preKeyBundle.preKey.keyId,
        PreKeyPublicKey: new Uint8Array(preKeyBundle.preKey.publicKey),
        SignedPreKeyId: preKeyBundle.signedPreKey.keyId,
        SignedPreKeyPublicKey: new Uint8Array(preKeyBundle.signedPreKey.publicKey),
        SignedPreKeySignature: new Uint8Array(preKeyBundle.signedPreKey.signature)
      }
    }))
  }
}
