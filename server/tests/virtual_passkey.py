"""Software authenticator used to exercise the WebAuthn ceremonies in tests."""

import hashlib
import json
import secrets

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from webauthn.helpers.bytes_to_base64url import bytes_to_base64url
from webauthn.helpers.cose import COSECRV, COSEKTY, COSEAlgorithmIdentifier, COSEKey
from webauthn.helpers.encode_cbor import encode_cbor


class VirtualPasskey:
    def __init__(self, user_handle: str):
        self.private_key = ec.generate_private_key(ec.SECP256R1())
        self.credential_id = secrets.token_bytes(32)
        self.user_handle = user_handle
        self.sign_count = 0

    def registration_credential(self, options: dict, origin: str) -> dict:
        auth_data = self._authenticator_data(
            rp_id=options["rp"]["id"],
            sign_count=0,
            attested=True,
        )
        return self._credential(
            client_type="webauthn.create",
            challenge=options["challenge"],
            origin=origin,
            auth_data=auth_data,
            attestation=True,
        )

    def authentication_credential(self, options: dict, origin: str, sign_count: int | None = None) -> dict:
        if sign_count is None:
            self.sign_count += 1
            sign_count = self.sign_count
        auth_data = self._authenticator_data(rp_id=options["rpId"], sign_count=sign_count, attested=False)
        return self._credential(
            client_type="webauthn.get",
            challenge=options["challenge"],
            origin=origin,
            auth_data=auth_data,
            attestation=False,
        )

    def _credential(self, client_type: str, challenge: str, origin: str, auth_data: bytes, attestation: bool) -> dict:
        client_data = json.dumps(
            {
                "type": client_type,
                "challenge": challenge,
                "origin": origin,
                "crossOrigin": False,
            },
            separators=(",", ":"),
        ).encode()
        credential_id = bytes_to_base64url(self.credential_id)
        if attestation:
            response = {
                "clientDataJSON": bytes_to_base64url(client_data),
                "attestationObject": bytes_to_base64url(
                    encode_cbor({"fmt": "none", "attStmt": {}, "authData": auth_data})
                ),
                "transports": ["internal"],
            }
        else:
            signature = self.private_key.sign(
                auth_data + hashlib.sha256(client_data).digest(), ec.ECDSA(hashes.SHA256())
            )
            response = {
                "clientDataJSON": bytes_to_base64url(client_data),
                "authenticatorData": bytes_to_base64url(auth_data),
                "signature": bytes_to_base64url(signature),
                "userHandle": self.user_handle,
            }
        return {
            "id": credential_id,
            "rawId": credential_id,
            "type": "public-key",
            "authenticatorAttachment": "platform",
            "response": response,
        }

    def _authenticator_data(self, rp_id: str, sign_count: int, attested: bool) -> bytes:
        flags = 0x01 | 0x04
        attested_data = b""
        if attested:
            flags |= 0x40
            public_numbers = self.private_key.public_key().public_numbers()
            cose_key = encode_cbor(
                {
                    int(COSEKey.KTY): int(COSEKTY.EC2),
                    int(COSEKey.ALG): int(COSEAlgorithmIdentifier.ECDSA_SHA_256),
                    int(COSEKey.CRV): int(COSECRV.P256),
                    int(COSEKey.X): public_numbers.x.to_bytes(32, "big"),
                    int(COSEKey.Y): public_numbers.y.to_bytes(32, "big"),
                }
            )
            attested_data = bytes(16) + len(self.credential_id).to_bytes(2, "big") + self.credential_id + cose_key
        return hashlib.sha256(rp_id.encode()).digest() + bytes([flags]) + sign_count.to_bytes(4, "big") + attested_data
