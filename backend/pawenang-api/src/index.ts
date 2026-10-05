import { register } from "./api/auth/register";

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/api/auth/register") {
            return register(request, env);
        }

        if (url.pathname === "/api/health") {
            try {
                const result = await env.pawenang_db
                    .prepare("SELECT 1 AS ok")
                    .first();

                return Response.json({
                    success: true,
                    message: "Pawenang API dan D1 terhubung",
                    database: result
                });
            } catch (error) {
                return Response.json({
                    success: false,
                    message: "D1 gagal terhubung",
                    error: error instanceof Error ? error.message : String(error)
                }, { status: 500 });
            }
        }

        return new Response("Pawenang API aktif");
    },
} satisfies ExportedHandler<Env>;
