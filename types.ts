type ByteArray = Uint8Array;

// Account keys
interface AccountKeys {
  accountKeyMaster: ByteArray;
  accountKeyIdentityPrivate: ByteArray;
  accountKeyIdentityPublic: ByteArray;
  accountKeyEnc: ByteArray;
}

// Passphrase stretching
interface PassphraseData {
  passphrase: string;
  passphraseSalt: ByteArray;
  passphrasePBKDF2Iterations: number;
  secretKey: ByteArray;
}

// Master key encryption
interface EncryptedMasterKey {
  secretIv: ByteArray;
  secretCiphertext: ByteArray;
}

// Registration token
interface RegistrationToken {
  tokenId: string;
  tokenNonce: ByteArray;
}

// Token signature
type TokenSignature = ByteArray;

// Account creation payload
interface AccountCreationPayload {
  accountKeyIdentityPublic: ByteArray;
  passphraseSalt: ByteArray;
  passphrasePBKDF2Iterations: number;
  secretIv: ByteArray;
  secretCiphertext: ByteArray;
  tokenSignature: TokenSignature;
  // Additional account information like username and email.
}

// Encrypted private key response from API
interface EncryptedPrivateKeyResponse {
  secretCiphertext: ByteArray;
  secretIv: ByteArray;
  passphraseSalt: ByteArray;
  passphrasePBKDF2Iterations: number;
}

// Nonce signing
type Nonce = ByteArray;
type NonceSignature = ByteArray;

// Session creation payload
interface SessionCreationPayload {
  nonceSignature: NonceSignature;
}
