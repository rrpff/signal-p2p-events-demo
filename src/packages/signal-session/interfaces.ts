export type ByteBufferCompatible = string | ByteBuffer | Buffer | ArrayBuffer | Uint8Array

export type IPublicKey = ArrayBuffer
export type IPrivateKey = ArrayBuffer

export interface IKeyPair {
  pubKey: IPublicKey
  privKey: IPrivateKey
}

export interface ISignalPreKeyBundle {
  identityKey: IPublicKey,
  registrationId: number,
  preKey: {
    keyId: number,
    publicKey: IPublicKey
  },
  signedPreKey: {
    keyId: number,
    publicKey: IPublicKey,
    signature: ArrayBuffer
  }
}

export enum ISignalCiphertextType {
  WhisperMessage = 1,
  PreKeyWhisperMessage = 3
}

export interface ISignalCiphertext {
  type: ISignalCiphertextType
  body: ByteBufferCompatible
  registrationId: number
}

export interface ISignalSessionRecord {
  // ???
}

export interface ISignalProtocolAddress {
  new (registrationId: number, deviceId: number): ISignalProtocolAddress
  getName(): string
  getDeviceId(): number
  fromString(encodedAddress: string): ISignalProtocolAddress
}

export interface ISignalSessionBuilder {
  new (store: ISignalProtocolStore, address: ISignalProtocolAddress): ISignalSessionBuilder
  processPreKey(preKey: ISignalPreKeyBundle): Promise<void>
}

export interface ISignalSessionCipher {
  new (store: ISignalProtocolStore, address: ISignalProtocolAddress): ISignalSessionCipher
  encrypt(buffer: ByteBufferCompatible): Promise<ISignalCiphertext>
  decryptPreKeyWhisperMessage(buffer: ByteBufferCompatible, encoding: 'binary'): Promise<ByteBufferCompatible>
  decryptWhisperMessage(buffer: ByteBufferCompatible, encoding: 'binary'): Promise<ByteBufferCompatible>
}

export interface ISignalKeyHelper {
  generateIdentityKeyPair(): Promise<IKeyPair>
  generateRegistrationId(): Promise<number>
  generatePreKey(preKeyId: number): Promise<{
    keyPair: IKeyPair
  }>
  generateSignedPreKey(identity: IKeyPair, signedPreKeyId: number): Promise<{
    keyPair: IKeyPair
    signature: ArrayBuffer
  }>
}

export interface ISignal {
  KeyHelper: ISignalKeyHelper
  SignalProtocolAddress: ISignalProtocolAddress
  SessionBuilder: ISignalSessionBuilder
  SessionCipher: ISignalSessionCipher
}

export interface ISignalProtocolStore {
  Direction: { SENDING: number, RECEIVING: number }

  put<T>(key: string, value: T): void
  get<T>(key: string, defaultValue?: T): T
  remove(key: string): void
  getIdentityKeyPair(): Promise<IKeyPair>
  getLocalRegistrationId(): Promise<number>
  isTrustedIdentity(identifier: string, identityKey: IPublicKey, _direction: unknown): Promise<boolean>
  loadIdentityKey(identifier: string): Promise<IPublicKey>
  saveIdentity(identifier: string, identityKey: IPublicKey): Promise<boolean>
  loadPreKey(keyId: number): Promise<IKeyPair>
  storePreKey(keyId: number, keyPair: IKeyPair): Promise<void>
  removePreKey(keyId: number): Promise<void>
  loadSignedPreKey(keyId: number): Promise<IKeyPair>
  storeSignedPreKey(keyId: number, keyPair: IKeyPair): Promise<void>
  removeSignedPreKey(keyId: number): Promise<void>
  loadSession(identifier: string): Promise<ISignalSessionRecord>
  storeSession(identifier: string, record: ISignalSessionRecord): Promise<void>
  removeSession(identifier: string): Promise<void>
  removeAllSessions(identifier: string): Promise<void>
}

export interface ISignalSignator<TAddress, TCiphertext> {
  createPreKeyBundle(): Promise<ISignalPreKeyBundle>
  createSession(address: ISignalProtocolAddress, preKeyBundle: ISignalPreKeyBundle): Promise<void>
  encrypt(address: TAddress, plaintext: ByteBufferCompatible): Promise<TCiphertext>
  decrypt(address: TAddress, message: TCiphertext): Promise<string>
}

export interface ISignalUser {
  identifier: string
  registrationId: number
  deviceId: number
}

export interface ISignalUserInstaller<TUser> {
  install(): Promise<void>
  getLocalUser(): Promise<TUser>
}
