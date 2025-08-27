import * as crypto from 'crypto';
import { Config } from '../config';

/**
 * Utility class for encrypting and decrypting private keys securely (AES-256-GCM)
 */
export class EncryptionUtils {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly IV_LENGTH = 12;

    /**
     * Encrypts a private key using the encryption key from environment variables
     * @param privateKey The private key to encrypt
     * @returns The encrypted private key as a hex string
     */
    public static encryptPrivateKey(
        privateKey: string,
        encryptionKey: string
    ): string {
        if (!encryptionKey) {
            throw new Error(
                'Encryption key not found in environment variables'
            );
        }

        const key = crypto
            .createHash('sha256')
            .update(String(encryptionKey))
            .digest();
        const iv = crypto.randomBytes(this.IV_LENGTH);

        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag
        const authTag = cipher.getAuthTag();

        // Store IV and authTag with ciphertext (format: iv:authTag:ciphertext)
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypts an encrypted private key using the encryption key from environment variables
     * @param encryptedPrivateKey The encrypted private key to decrypt
     * @returns The decrypted private key
     */
    public static decryptPrivateKey(
        encryptedPrivateKey: string,
        encryptionKey: string
    ): string {
        try {
            if (!encryptionKey) {
                throw new Error(
                    'Encryption key not found in environment variables'
                );
            }

            const key = crypto
                .createHash('sha256')
                .update(String(encryptionKey))
                .digest();

            // Split the IV, authTag, and encrypted data
            const parts = encryptedPrivateKey.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted private key format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encryptedText = parts[2];

            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (e: any) {
            throw e;
        }
    }
}
