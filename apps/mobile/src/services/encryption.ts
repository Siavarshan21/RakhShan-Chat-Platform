import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { secureStorage, localStorage } from '../utils/storage';

interface PreKey {
  keyId: number;
  publicKey: string;
  privateKey: string;
}

interface SessionKey {
  sessionId: string;
  sharedSecret: string;
  sendChainKey: string;
  receiveChainKey: string;
  sendCounter: number;
  receiveCounter: number;
}

class EncryptionService {
  private sessionKeys: Map<string, SessionKey> = new Map();

  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = nacl.box.keyPair();
    const publicKey = naclUtil.encodeBase64(keyPair.publicKey);
    const privateKey = naclUtil.encodeBase64(keyPair.secretKey);

    await secureStorage.setPrivateKey(privateKey);

    return { publicKey, privateKey };
  }

  async generatePreKeyBundle(count: number = 100): Promise<PreKey[]> {
    const preKeys: PreKey[] = [];

    for (let i = 0; i < count; i++) {
      const keyPair = nacl.box.keyPair();
      preKeys.push({
        keyId: i,
        publicKey: naclUtil.encodeBase64(keyPair.publicKey),
        privateKey: naclUtil.encodeBase64(keyPair.secretKey),
      });
    }

    await localStorage.setJson('preKeys', preKeys);
    return preKeys;
  }

  async getPreKey(keyId: number): Promise<PreKey | null> {
    const preKeys = await localStorage.getJson<PreKey[]>('preKeys');
    if (!preKeys) return null;
    return preKeys.find(pk => pk.keyId === keyId) || null;
  }

  async createSession(
    userId: string,
    theirPublicKey: string,
    preKeyId?: number
  ): Promise<string> {
    const sessionId = `session_${userId}`;
    const privateKeyStr = await secureStorage.getPrivateKey();
    if (!privateKeyStr) throw new Error('No private key found');

    const myPrivateKey = naclUtil.decodeBase64(privateKeyStr);
    const theirPubKey = naclUtil.decodeBase64(theirPublicKey);

    const sharedSecret = nacl.box.before(theirPubKey, myPrivateKey);
    const sharedSecretB64 = naclUtil.encodeBase64(sharedSecret);

    const rootKey = nacl.hash(sharedSecret).slice(0, 32);
    const sendChainKey = naclUtil.encodeBase64(rootKey.slice(0, 32));
    const receiveChainKey = naclUtil.encodeBase64(rootKey.slice(0, 32));

    const session: SessionKey = {
      sessionId,
      sharedSecret: sharedSecretB64,
      sendChainKey,
      receiveChainKey,
      sendCounter: 0,
      receiveCounter: 0,
    };

    this.sessionKeys.set(sessionId, session);
    await localStorage.setJson(`session_${userId}`, session);

    return sessionId;
  }

  async getSession(userId: string): Promise<SessionKey | null> {
    const sessionId = `session_${userId}`;

    if (this.sessionKeys.has(sessionId)) {
      return this.sessionKeys.get(sessionId)!;
    }

    const stored = await localStorage.getJson<SessionKey>(`session_${userId}`);
    if (stored) {
      this.sessionKeys.set(sessionId, stored);
      return stored;
    }

    return null;
  }

  private deriveMessageKey(chainKey: string, counter: number): Uint8Array {
    const chainKeyBytes = naclUtil.decodeBase64(chainKey);
    const counterBytes = new Uint8Array(4);
    new DataView(counterBytes.buffer).setUint32(0, counter, false);

    const combined = new Uint8Array(chainKeyBytes.length + counterBytes.length);
    combined.set(chainKeyBytes);
    combined.set(counterBytes, chainKeyBytes.length);

    return nacl.hash(combined).slice(0, 32);
  }

  async encryptWithSession(
    userId: string,
    message: string
  ): Promise<{ ciphertext: string; nonce: string; counter: number }> {
    const session = await this.getSession(userId);
    if (!session) throw new Error('No session found. Create a session first.');

    const messageKey = this.deriveMessageKey(session.sendChainKey, session.sendCounter);
    const messageBytes = naclUtil.decodeUTF8(message);
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(messageBytes, nonce, messageKey);

    if (!encrypted) throw new Error('Encryption failed');

    session.sendCounter++;
    this.sessionKeys.set(session.sessionId, session);
    await localStorage.setJson(`session_${userId}`, session);

    return {
      ciphertext: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce),
      counter: session.sendCounter - 1,
    };
  }

  async decryptWithSession(
    userId: string,
    ciphertext: string,
    nonce: string,
    counter: number
  ): Promise<string> {
    const session = await this.getSession(userId);
    if (!session) throw new Error('No session found');

    const messageKey = this.deriveMessageKey(session.receiveChainKey, counter);
    const ciphertextBytes = naclUtil.decodeBase64(ciphertext);
    const nonceBytes = naclUtil.decodeBase64(nonce);

    const decrypted = nacl.secretbox.open(ciphertextBytes, nonceBytes, messageKey);
    if (!decrypted) throw new Error('Decryption failed');

    if (counter >= session.receiveCounter) {
      session.receiveCounter = counter + 1;
      this.sessionKeys.set(session.sessionId, session);
      await localStorage.setJson(`session_${userId}`, session);
    }

    return naclUtil.encodeUTF8(decrypted);
  }

  async encrypt(message: string, recipientPublicKey: string): Promise<{
    ciphertext: string;
    nonce: string;
  }> {
    const privateKeyStr = await secureStorage.getPrivateKey();
    if (!privateKeyStr) throw new Error('No private key found');

    const messageBytes = naclUtil.decodeUTF8(message);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const recipientKey = naclUtil.decodeBase64(recipientPublicKey);
    const senderKey = naclUtil.decodeBase64(privateKeyStr);

    const encrypted = nacl.box(messageBytes, nonce, recipientKey, senderKey);
    if (!encrypted) throw new Error('Encryption failed');

    return {
      ciphertext: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce),
    };
  }

  async decrypt(ciphertext: string, nonce: string, senderPublicKey: string): Promise<string> {
    const privateKeyStr = await secureStorage.getPrivateKey();
    if (!privateKeyStr) throw new Error('No private key found');

    const ciphertextBytes = naclUtil.decodeBase64(ciphertext);
    const nonceBytes = naclUtil.decodeBase64(nonce);
    const senderKey = naclUtil.decodeBase64(senderPublicKey);
    const recipientKey = naclUtil.decodeBase64(privateKeyStr);

    const decrypted = nacl.box.open(ciphertextBytes, nonceBytes, senderKey, recipientKey);
    if (!decrypted) throw new Error('Decryption failed');

    return naclUtil.encodeUTF8(decrypted);
  }

  encryptMedia(data: Uint8Array): { encrypted: Uint8Array; key: string; nonce: string } {
    const key = nacl.randomBytes(nacl.secretbox.keyLength);
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(data, nonce, key);

    if (!encrypted) throw new Error('Media encryption failed');

    return {
      encrypted,
      key: naclUtil.encodeBase64(key),
      nonce: naclUtil.encodeBase64(nonce),
    };
  }

  decryptMedia(encrypted: Uint8Array, key: string, nonce: string): Uint8Array {
    const keyBytes = naclUtil.decodeBase64(key);
    const nonceBytes = naclUtil.decodeBase64(nonce);
    const decrypted = nacl.secretbox.open(encrypted, nonceBytes, keyBytes);

    if (!decrypted) throw new Error('Media decryption failed');
    return decrypted;
  }

  encryptSymmetric(data: string, key: Uint8Array): { ciphertext: string; nonce: string } {
    const messageBytes = naclUtil.decodeUTF8(data);
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(messageBytes, nonce, key);

    return {
      ciphertext: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce),
    };
  }

  decryptSymmetric(ciphertext: string, nonce: string, key: Uint8Array): string {
    const ciphertextBytes = naclUtil.decodeBase64(ciphertext);
    const nonceBytes = naclUtil.decodeBase64(nonce);
    const decrypted = nacl.secretbox.open(ciphertextBytes, nonceBytes, key);
    if (!decrypted) throw new Error('Symmetric decryption failed');

    return naclUtil.encodeUTF8(decrypted);
  }

  generateSymmetricKey(): Uint8Array {
    return nacl.randomBytes(nacl.secretbox.keyLength);
  }

  generateSecureId(): string {
    return naclUtil.encodeBase64(nacl.randomBytes(16));
  }

  async clearAllSessions(): Promise<void> {
    this.sessionKeys.clear();
  }
}

export const encryption = new EncryptionService();
