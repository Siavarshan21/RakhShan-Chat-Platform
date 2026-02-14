import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly masterKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const masterKeyHex = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    if (masterKeyHex) {
      this.masterKey = Buffer.from(masterKeyHex, 'hex');
    } else {
      this.masterKey = crypto.randomBytes(32);
    }
  }

  generateKeyPair(): { publicKey: string; secretKey: string } {
    const keyPair = nacl.box.keyPair();
    return {
      publicKey: naclUtil.encodeBase64(keyPair.publicKey),
      secretKey: naclUtil.encodeBase64(keyPair.secretKey),
    };
  }

  generateSigningKeyPair(): { publicKey: string; secretKey: string } {
    const keyPair = nacl.sign.keyPair();
    return {
      publicKey: naclUtil.encodeBase64(keyPair.publicKey),
      secretKey: naclUtil.encodeBase64(keyPair.secretKey),
    };
  }

  encryptBox(
    message: string,
    recipientPublicKey: string,
    senderSecretKey: string,
  ): { ciphertext: string; nonce: string } {
    const messageBytes = naclUtil.decodeUTF8(message);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const recipientKey = naclUtil.decodeBase64(recipientPublicKey);
    const senderKey = naclUtil.decodeBase64(senderSecretKey);

    const encrypted = nacl.box(messageBytes, nonce, recipientKey, senderKey);
    if (!encrypted) throw new Error('Encryption failed');

    return {
      ciphertext: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce),
    };
  }

  decryptBox(
    ciphertext: string,
    nonce: string,
    senderPublicKey: string,
    recipientSecretKey: string,
  ): string {
    const ciphertextBytes = naclUtil.decodeBase64(ciphertext);
    const nonceBytes = naclUtil.decodeBase64(nonce);
    const senderKey = naclUtil.decodeBase64(senderPublicKey);
    const recipientKey = naclUtil.decodeBase64(recipientSecretKey);

    const decrypted = nacl.box.open(ciphertextBytes, nonceBytes, senderKey, recipientKey);
    if (!decrypted) throw new Error('Decryption failed');

    return naclUtil.encodeUTF8(decrypted);
  }

  encryptSymmetric(data: string): { ciphertext: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  decryptSymmetric(ciphertext: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.masterKey,
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  generateMediaKey(): { key: string; iv: string } {
    return {
      key: crypto.randomBytes(32).toString('base64'),
      iv: crypto.randomBytes(12).toString('base64'),
    };
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateSecureToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  generateOtp(length: number = 6): string {
    const max = Math.pow(10, length);
    const otp = crypto.randomInt(0, max);
    return otp.toString().padStart(length, '0');
  }
}
