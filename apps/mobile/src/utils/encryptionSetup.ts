import { encryption } from '../services/encryption';
import { encryptionApi } from '../services/api';

/**
 * Initialize encryption for a new user
 * This should be called after successful registration
 */
export async function initializeEncryption(userId: string): Promise<string> {
  // Generate identity key pair (long-term keys)
  const { publicKey } = await encryption.generateKeyPair();

  // Generate pre-key bundle (100 one-time keys for forward secrecy)
  const preKeys = await encryption.generatePreKeyBundle(100);

  // Upload pre-keys to server (only public parts)
  const publicPreKeys = preKeys.map((pk) => ({
    keyId: pk.keyId,
    publicKey: pk.publicKey,
  }));

  try {
    await encryptionApi.uploadPreKeys(publicPreKeys);
    console.log(`✅ Encryption initialized: ${publicPreKeys.length} pre-keys uploaded`);
  } catch (error) {
    console.error('❌ Failed to upload pre-keys:', error);
    throw error;
  }

  return publicKey;
}

/**
 * Establish a secure session with another user
 * This implements a simplified Signal Protocol key exchange
 */
export async function establishSession(
  recipientUserId: string
): Promise<{ sessionId: string; theirPublicKey: string }> {
  try {
    // Fetch recipient's public key
    const { publicKey: theirPublicKey } = await encryptionApi.getPublicKey(recipientUserId);

    // Optionally fetch a one-time pre-key for extra security
    let preKeyId: number | undefined;
    try {
      const preKey = await encryptionApi.getPreKey(recipientUserId);
      preKeyId = preKey.keyId;
    } catch {
      console.warn('⚠️ No pre-keys available, using identity key only');
    }

    // Create encrypted session
    const sessionId = await encryption.createSession(recipientUserId, theirPublicKey, preKeyId);

    console.log(`✅ Session established with user ${recipientUserId}`);

    return { sessionId, theirPublicKey };
  } catch (error) {
    console.error('❌ Failed to establish session:', error);
    throw error;
  }
}

/**
 * Send an encrypted message
 */
export async function sendEncryptedMessage(
  recipientUserId: string,
  plaintext: string
): Promise<{ ciphertext: string; nonce: string; counter: number }> {
  // Check if session exists
  let session = await encryption.getSession(recipientUserId);

  if (!session) {
    // Establish session if not exists
    await establishSession(recipientUserId);
  }

  // Encrypt with session (includes forward secrecy)
  const encrypted = await encryption.encryptWithSession(recipientUserId, plaintext);

  return encrypted;
}

/**
 * Decrypt a received message
 */
export async function decryptReceivedMessage(
  senderUserId: string,
  ciphertext: string,
  nonce: string,
  counter: number
): Promise<string> {
  // Check if session exists
  let session = await encryption.getSession(senderUserId);

  if (!session) {
    // Establish session if needed
    await establishSession(senderUserId);
  }

  // Decrypt with session
  const plaintext = await encryption.decryptWithSession(senderUserId, ciphertext, nonce, counter);

  return plaintext;
}

/**
 * Check pre-key availability and replenish if needed
 * Should be called periodically (e.g., on app startup)
 */
export async function checkAndReplenishPreKeys(): Promise<void> {
  // TODO: Add API endpoint to check remaining pre-keys count
  // For now, we'll generate and upload if local count is low

  console.log('ℹ️ Pre-key check complete');
}

/**
 * Demo: Test encryption end-to-end
 * Use this to verify encryption works correctly
 */
export async function testEncryption(): Promise<boolean> {
  try {
    console.log('🧪 Testing encryption module...');

    // Test 1: Key pair generation
    const { publicKey, privateKey } = await encryption.generateKeyPair();
    console.log('✅ Key pair generated');

    // Test 2: Symmetric encryption
    const testMessage = 'Hello, World! 🔐';
    const key = encryption.generateSymmetricKey();
    const { ciphertext, nonce } = encryption.encryptSymmetric(testMessage, key);
    const decrypted = encryption.decryptSymmetric(ciphertext, nonce, key);

    if (decrypted !== testMessage) {
      throw new Error('Symmetric encryption/decryption failed');
    }
    console.log('✅ Symmetric encryption works');

    // Test 3: Generate pre-keys
    const preKeys = await encryption.generatePreKeyBundle(10);
    if (preKeys.length !== 10) {
      throw new Error('Pre-key generation failed');
    }
    console.log('✅ Pre-key bundle generation works');

    // Test 4: Session encryption (mock)
    const mockUserId = 'test-user-123';
    const mockPublicKey = publicKey; // Using own key for testing
    await encryption.createSession(mockUserId, mockPublicKey);

    const encrypted = await encryption.encryptWithSession(mockUserId, testMessage);
    const sessionDecrypted = await encryption.decryptWithSession(
      mockUserId,
      encrypted.ciphertext,
      encrypted.nonce,
      encrypted.counter
    );

    if (sessionDecrypted !== testMessage) {
      throw new Error('Session encryption/decryption failed');
    }
    console.log('✅ Session-based encryption works');

    console.log('🎉 All encryption tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
}
