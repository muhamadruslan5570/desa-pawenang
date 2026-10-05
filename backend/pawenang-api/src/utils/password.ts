const ITERATIONS = 100_000;
const HASH_LENGTH = 32;

function toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function deriveKey(
    password: string,
    salt: Uint8Array
): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();

    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    return crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: ITERATIONS,
            hash: "SHA-256",
        },
        passwordKey,
        HASH_LENGTH * 8
    );
}

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = new Uint8Array(await deriveKey(password, salt));

    return `pbkdf2_sha256$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(
    password: string,
    storedHash: string
): Promise<boolean> {
    const parts = storedHash.split("$");

    if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") {
        return false;
    }

    const iterations = Number(parts[1]);
    const salt = fromBase64(parts[2]);
    const expectedHash = fromBase64(parts[3]);

    if (!Number.isInteger(iterations) || iterations <= 0) {
        return false;
    }

    const actualHash = new Uint8Array(
        await deriveKey(password, salt)
    );

    if (actualHash.length !== expectedHash.length) {
        return false;
    }

    let difference = 0;

    for (let i = 0; i < actualHash.length; i++) {
        difference |= actualHash[i] ^ expectedHash[i];
    }

    return difference === 0;
}
