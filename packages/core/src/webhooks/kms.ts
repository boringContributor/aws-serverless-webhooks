import { randomBytes } from "node:crypto"
import { kms } from "../aws-clients";

export const generateWebhookSecret = () => {
  const randomData = randomBytes(32);
  return `whsec_${randomData.toString('base64')}`;
}

export const encryptSecret = async (secret: string, kmsKeyId: string) => {
  const response = await kms.encrypt({
    KeyId: kmsKeyId,
    Plaintext: Buffer.from(secret, 'utf-8')
  });

  if (!response.CiphertextBlob) {
    throw new Error('KMS encryption failed: no ciphertext returned');
  }

  return Buffer.from(response.CiphertextBlob).toString('base64');
}

export const decryptSecret = async (encryptedSecret: string) => {
  const response = await kms.decrypt({
    CiphertextBlob: Buffer.from(encryptedSecret, 'base64')
  });

  if (!response.Plaintext) {
    throw new Error('KMS decryption failed: no plaintext returned');
  }

  return Buffer.from(response.Plaintext).toString('utf-8');
}
