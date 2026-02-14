export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface PreKeyBundle {
  identityKey: string;
  signedPreKeyId: number;
  signedPreKey: string;
  signedPreKeySignature: string;
  preKeyId: number;
  preKey: string;
}

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
  senderPublicKey: string;
  recipientPublicKey: string;
  algorithm: 'x25519-xsalsa20-poly1305' | 'aes-256-gcm';
}

export interface SessionKeys {
  sessionId: string;
  sendingKey: string;
  receivingKey: string;
  chainIndex: number;
}

export interface EncryptedMediaKey {
  encryptedKey: string;
  iv: string;
  algorithm: 'aes-256-gcm';
}
