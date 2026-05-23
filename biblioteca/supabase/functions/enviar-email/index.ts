import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, (dados: Record<string, string>) => { assunto: string; html: string }> = {

  cadastro_aprovado: ({ nome }) => ({
    assunto: "Seu cadastro foi aprovado — Bibliotheca+",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; color: #f1f5f9; border-radius: 12px;">
        <h1 style="color: #60a5fa; font-size: 22px; margin-bottom: 8px;">Bibliotheca+</h1>
        <h2 style="font-size: 18px; margin-bottom: 16px;">Cadastro aprovado! 🎉</h2>
        <p style="color: #cbd5e1; line-height: 1.6;">
          Olá, <strong>${nome}</strong>!
        </p>
        <p style="color: #cbd5e1; line-height: 1.6;">
          Seu cadastro foi <strong style="color: #4ade80;">aprovado</strong> pelo bibliotecário.
          Você já pode acessar o sistema e realizar empréstimos de livros.
        </p>
        <a href="${Deno.env.get("SITE_URL") ?? "#"}"
           style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #2563eb; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Acessar o sistema
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #475569;">
          Se você não esperava este e-mail, ignore-o.
        </p>
      </div>
    `,
  }),

  // Exemplos de templates futuros — descomente e adapte quando precisar:
  // cadastro_rejeitado: ({ nome }) => ({ ... }),
  // conta_suspensa: ({ nome }) => ({ ... }),
  // devolucao_atrasada: ({ nome, titulo }) => ({ ... }),

};

// ─── HANDLER ─────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { tipo, para, dados } = await req.json() as {
      tipo: string;
      para: string;
      dados: Record<string, string>;
    };

    const template = TEMPLATES[tipo];
    if (!template) {
      return new Response(
        JSON.stringify({ error: `Tipo de email desconhecido: "${tipo}"` }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const { assunto, html } = template(dados);
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Bibliotheca+",
          email: Deno.env.get("REMETENTE_EMAIL"), // cadastrado como secret no Supabase
        },
        to: [{ email: para }],
        subject: assunto,
        htmlContent: html,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      console.error("Erro no Brevo:", resData);
      return new Response(JSON.stringify({ error: resData }), {
        status: res.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    return new Response(JSON.stringify({ ok: true, messageId: resData.messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });

  } catch (err) {
    console.error("Erro na Edge Function:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
