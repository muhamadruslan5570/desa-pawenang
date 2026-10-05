import { hashPassword } from "../../utils/password";

interface RegisterBody {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
}

export async function register(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
        return Response.json(
            { success: false, message: "Method tidak diizinkan." },
            { status: 405 }
        );
    }

    let body: RegisterBody;

    try {
        body = await request.json();
    } catch {
        return Response.json(
            { success: false, message: "Format JSON tidak valid." },
            { status: 400 }
        );
    }

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const phone = body.phone?.trim() || null;

    if (!name || !email || !password) {
        return Response.json(
            {
                success: false,
                message: "Nama, email, dan password wajib diisi."
            },
            { status: 400 }
        );
    }

    if (name.length < 2) {
        return Response.json(
            { success: false, message: "Nama minimal 2 karakter." },
            { status: 400 }
        );
    }

    if (password.length < 8) {
        return Response.json(
            { success: false, message: "Password minimal 8 karakter." },
            { status: 400 }
        );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return Response.json(
            { success: false, message: "Format email tidak valid." },
            { status: 400 }
        );
    }

    try {
        const existingUser = await env.pawenang_db
            .prepare("SELECT id FROM users WHERE email = ?")
            .bind(email)
            .first();

        if (existingUser) {
            return Response.json(
                {
                    success: false,
                    message: "Email sudah terdaftar."
                },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);

        const result = await env.pawenang_db
            .prepare(`
                INSERT INTO users (
                    name,
                    email,
                    password_hash,
                    phone
                )
                VALUES (?, ?, ?, ?)
            `)
            .bind(name, email, passwordHash, phone)
            .run();

        return Response.json(
            {
                success: true,
                message: "Pendaftaran berhasil. Silakan verifikasi email Anda.",
                user: {
                    id: result.meta.last_row_id,
                    name,
                    email,
                    phone
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register error:", error);

        return Response.json(
            {
                success: false,
                message: "Terjadi kesalahan saat membuat akun."
            },
            { status: 500 }
        );
    }
}
