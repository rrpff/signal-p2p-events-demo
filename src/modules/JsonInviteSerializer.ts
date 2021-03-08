import { IInvite, ISerializer } from '../interfaces'
import { PeerInviteMessage } from '../protos/PeerInviteMessage'

export default class JsonInviteSerializer implements ISerializer<IInvite, string> {
  serialize(invite: IInvite): string {
    return JSON.stringify(PeerInviteMessage.toJSON({
      UserId: invite.user.identifier,
      PreKeyBundle: {
        IdentityPublicKey: new Uint8Array(invite.preKeyBundle.identityKey),
        RegistrationId: invite.user.registrationId,
        DeviceId: invite.user.deviceId,
        PreKeyId: invite.preKeyBundle.preKey.keyId,
        PreKeyPublicKey: new Uint8Array(invite.preKeyBundle.preKey.publicKey),
        SignedPreKeyId: invite.preKeyBundle.signedPreKey.keyId,
        SignedPreKeyPublicKey: new Uint8Array(invite.preKeyBundle.signedPreKey.publicKey),
        SignedPreKeySignature: new Uint8Array(invite.preKeyBundle.signedPreKey.signature)
      }
    }))
  }

  deserialize(serialized: string): IInvite {
    const message = PeerInviteMessage.fromJSON(JSON.parse(serialized))
    return {
      user: {
        identifier: message.UserId,
        registrationId: message.PreKeyBundle!.RegistrationId,
        deviceId: message.PreKeyBundle!.DeviceId,
      },
      preKeyBundle: {
        identityKey: message.PreKeyBundle!.IdentityPublicKey.buffer,
        registrationId: message.PreKeyBundle!.RegistrationId,
        preKey: {
          keyId: message.PreKeyBundle!.PreKeyId,
          publicKey: message.PreKeyBundle!.PreKeyPublicKey.buffer
        },
        signedPreKey: {
          keyId: message.PreKeyBundle!.SignedPreKeyId,
          publicKey: message.PreKeyBundle!.SignedPreKeyPublicKey.buffer,
          signature: message.PreKeyBundle!.SignedPreKeySignature.buffer
        }
      }
    }
  }
}
