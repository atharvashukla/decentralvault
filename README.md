<h1 align="center">DecentralVault</h1>

<p align="center">
  <img src="https://user-images.githubusercontent.com/33644308/225613244-b37f960c-bd1a-4e4b-a82d-0b86a9ff76e2.png" />
</p>

Welcome to my web-based non-custodial wallet called DecentralVault, inspired by the design philosophy of the now-defunct peer-to-peer crypto exchange, Localcryptos!

Despite the unfortunate closure of Localcryptos, I have drawn inspiration from their innovative approach to building secure and user-friendly interfaces for cryptocurrency management.

---

## Design Spec

### Creating an account:

When a user creates an account, a cryptographic key is generated on the device of the user, known as a "master key". This "master key" is later used to derive other keys — such as a key for encrypting other private keys used to store cryptocurrency, or a key for signing information.

When creating an account, the first step is to generate a securely random 32-byte "master key" (`AccountKeyMaster`) using the Web Cryptography API.

Once the `AccountKeyMaster` is created, two more keys can be derived from it:

1.  `AccountKeyIdentityPrivate` is the function of `SHA256(AccountKeyMaster, "identity")`. This will be used for digitally signing messages using elliptic curve cryptography.
2.  `AccountKeyEnc` is the function of `SHA256(AccountKeyMaster, "enc")`. This key will be used to encrypt other keys using AES symmetric encryption.

The `AccountKeyMaster` key must be encrypted using the user-inputted password. However, the password alone will not suffice: it must be first transformed into a secure key suitable for encryption using the key derivation function PBKDF2. This process, known as *"key stretching"*, adds complex computational work to make password cracking very difficult. `Passphrase` is stretched using PBKDF2 using at least 100,000 iterations with the salt `PassphraseSalt` to create `SecretKey`.

Once `SecretKey` is derived, `AccountKeyMaster` is encrypted using it with AES-256-CBC. The initialization vector (16 random bytes) is kept as `SecretIv`.

Before the sign up process can be completed, we requires a unique message to be signed to prove that you know the private key. The browser needs to obtain the unique message needed to be signed from our API. This is known as an ephemeral registration “token” and it contains:

- `TokenId` — A unique identifier to the registration token.
- `TokenNonce` — The message needed to be signed with the new key pair you are about to create.

Once obtained, a digital signature of the registration token is created using the `AccountKeyIdentityPrivate` key. `TokenSignature` is an ECDSA signature of the Keccak-256 hash of `TokenNonce`.

The non-sensitive information is then submitted to the API and a new account is created. (Everything marked "secret" below is *not* uploaded.)

- `Passphrase` *(secret)* — User-inputted plain password.
- `SecretKey` *(secret)* — A more secure 32-byte key derived from *stretching* `Passphrase` using PBKDF2 with the salt `PassphraseSalt` using at least 100,000 iterations.
- `AccountKeyMaster` *(secret)* — A randomly generated 32-byte account master key. This is the seed to everything in your account; it's crucial to keep this secure.
- `AccountKeyIdentityPrivate` *(secret)* — A key that is the SHA-256 hash of the concatenation of `AccountKeyMaster` and "identity". Used for signing and authentication.
- `AccountKeyEnc` *(secret)* — A key that is the SHA-256 hash of the concatenation of `AccountKeyMaster` and "enc". Used for encryption.
- `AccountKeyIdentityPublic` — Using the secp256k1 curve, an ECDSA public key that corresponds to `AccountKeyIdentityPrivate`. Uniqueness is enforced here; no two users can have the same `AccountKeyIdentityPublic`.
- `PassphraseSalt` — The random 16-byte salt used for the PBKDF2 process.
- `PassphrasePBKDF2Iterations` — The number of PBKDF2 iterations to use to stretch the `Passphrase` to more secure key material. A higher number results in a slower key stretching process, weakening brute-force attempts.
- `SecretIv` — The randomly generated 16-byte initialization vector used to encrypt `AccountKeyMaster`.
- `SecretCiphertext` — The ciphertext of `AccountKeyMaster` encrypted to `SecretKey` using AES-256-CBC.
- `TokenSignature` — A digital signature of the Keccak-256 hash of `TokenNonce` by `AccountKeyIdentityPrivate`, to verify ownership of `AccountKeyIdentityPublic`.
- Any other account information (e.g. username and e-mail address).

### Logging into an account:

Logging into an account requires two-factor authentication. E‐mail is the default two‐factor authentication method and there is optional support for time-synchronized OTP (e.g. apps like Google Authenticator). SMS is not supported as a two-factor method because SMS is not safe.

Two-factor authentication is necessary to protect the encrypted version of `AccountKeyMaster` (i.e. `SecretCiphertext` and `SecretIv`). Although the decryption process has been slowed by the key stretching process, passwords are still theoretically susceptible to brute‐force attacks (especially dictionary‐based attacks on extremely weak passwords). Hiding the key behind a two‐factor method virtually eliminates the hypothetical attack vector of another user obtaining your passphrase by brute-force.

The two-factor authentication process is executed by the API, meaning that there is a small element of trust here. If the database were to be hacked, an attacker could get all the encrypted private keys. Still, these passwords are salted and stretched so rainbow-table attacks aren't possible and other brute-force attacks are very hard. In this hypothetical hack scenario, it would be difficult for the hacker to obtain passwords except those that are very weak (e.g. "password", or a re-used password from a separate compromised database).

This is the log-in process for two-factor authentication by e-mail:

1.  The user enters their username and password.
2.  The username is delivered to the API in a request for the associated encrypted private key. The password is ignored for now.
3.  An e‐mail is sent to the e‐mail address associated with the username, containing a secure link to progress the login request to the next stage.
4.  Once the link in the e-mail is clicked, the original log-in window receives `SecretCiphertext`, `SecretIv`, `PassphraseSalt`, and `PassphrasePBKDF2Iterations`.
5.  The user‐entered password is salted and stretched as required to derive `SecretKey`. The stretching process must be exactly the same as the process used when signing up.
6.  If the `SecretKey` can be used to calculate `AccountKeyMaster` correctly and hence `AccountKeyIdentityPublic`, then the login attempt was successful. If not, the user is prompted to try another password and step 5 is repeated.
7.  A nonce provided by the API is signed by `AccountKeyIdentityPrivate` to prove ownership of the key pair, and a new session is issued.
8.  `AccountKeyMaster` is stored in the browser's storage for the duration of the session.

### Changing your password:

Changing an account password involves re-encrypting `AccountKeyMaster` with a new `SecretKey`. The `AccountKeyMaster` key can never be changed, hence neither can the identity key or account encryption key be changed.
