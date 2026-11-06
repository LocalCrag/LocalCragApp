/**
 * Browser helpers for the WebAuthn registration and authentication ceremonies.
 * The server sends base64url JSON options from py_webauthn.
 */

export interface PasskeyCredentialSummary {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  backedUp: boolean;
}

export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function'
  );
}

export async function isConditionalMediationAvailable(): Promise<boolean> {
  if (
    !isPasskeySupported() ||
    typeof window.PublicKeyCredential.isConditionalMediationAvailable !==
      'function'
  ) {
    return false;
  }
  return window.PublicKeyCredential.isConditionalMediationAvailable();
}

export function isPasskeyCancellation(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'AbortError')
  );
}

export async function createPasskey(
  options: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const credential = (await navigator.credentials.create({
    publicKey: decodeCreationOptions(options),
  })) as PublicKeyCredential | null;
  if (!credential) {
    throw new DOMException('Passkey creation was cancelled', 'NotAllowedError');
  }
  return serializeRegistration(credential);
}

export async function getPasskey(
  options: Record<string, unknown>,
  mediation?: CredentialMediationRequirement,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const credential = (await navigator.credentials.get({
    publicKey: decodeRequestOptions(options),
    mediation,
    signal,
  })) as PublicKeyCredential | null;
  if (!credential) {
    throw new DOMException('Passkey login was cancelled', 'NotAllowedError');
  }
  return serializeAuthentication(credential);
}

function decodeCreationOptions(
  options: Record<string, unknown>,
): PublicKeyCredentialCreationOptions {
  const user = options['user'] as Record<string, unknown>;
  const exclude = options['excludeCredentials'] as
    Record<string, unknown>[] | undefined;
  return {
    ...(options as unknown as PublicKeyCredentialCreationOptions),
    challenge: base64urlToBuffer(options['challenge'] as string),
    user: {
      ...(user as unknown as PublicKeyCredentialUserEntity),
      id: base64urlToBuffer(user['id'] as string),
    },
    excludeCredentials: exclude?.map((credential) => ({
      ...(credential as unknown as PublicKeyCredentialDescriptor),
      id: base64urlToBuffer(credential['id'] as string),
    })),
  };
}

function decodeRequestOptions(
  options: Record<string, unknown>,
): PublicKeyCredentialRequestOptions {
  const allow = options['allowCredentials'] as
    Record<string, unknown>[] | undefined;
  return {
    ...(options as unknown as PublicKeyCredentialRequestOptions),
    challenge: base64urlToBuffer(options['challenge'] as string),
    allowCredentials: allow?.map((credential) => ({
      ...(credential as unknown as PublicKeyCredentialDescriptor),
      id: base64urlToBuffer(credential['id'] as string),
    })),
  };
}

function serializeRegistration(
  credential: PublicKeyCredential,
): Record<string, unknown> {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    ...(credential.authenticatorAttachment
      ? { authenticatorAttachment: credential.authenticatorAttachment }
      : {}),
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      attestationObject: bufferToBase64url(response.attestationObject),
      transports: response.getTransports?.() ?? [],
    },
  };
}

function serializeAuthentication(
  credential: PublicKeyCredential,
): Record<string, unknown> {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    ...(credential.authenticatorAttachment
      ? { authenticatorAttachment: credential.authenticatorAttachment }
      : {}),
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      authenticatorData: bufferToBase64url(response.authenticatorData),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle
        ? bufferToBase64url(response.userHandle)
        : null,
    },
  };
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64urlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLength));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}
