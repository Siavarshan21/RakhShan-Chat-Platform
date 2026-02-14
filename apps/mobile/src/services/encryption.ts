import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { secureStorage } from '../utils/storage';

class EncryptionService {
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = nacl.box.keyPair();
    const publicKey = naclUtil.encodeBase64(keyPair.publicKey);
    const privateKey = naclUtil.encodeBase64(keyPair.secretKey);

    await secureStorage.setPrivateKey(privateKey);

    return { publicKey, privateKey };
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
}

export const encryption = new EncryptionService();
