import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // service role para bypassar RLS
    );

    // Data de hoje + 2 dias no formato YYYY-MM-DD
    const alvo = new Date();
    alvo.setDate(alvo.getDate() + 2);
    const ano = alvo.getFullYear();
    const mes = String(alvo.getMonth() + 1).padStart(2, "0");
    const dia = String(alvo.getDate()).padStart(2, "0");
    const dataAlvo = `${ano}-${mes}-${dia}`;

    console.log(`[verificar-cobrancas] Buscando empréstimos com prazo em ${dataAlvo}`);

    // Busca empréstimos ativos com prazo = hoje + 2 dias
    // que ainda NÃO têm notificação de cobrança registrada
    const { data: emprestimos, error: erroEmprestimos } = await supabase
      .from("emprestimo")
      .select(`
        id_emprestimo,
        id_cliente,
        prazo_devolucao,
        livro (titulo, isbn),
        cliente (
          pessoa (nome, email)
        )
      `)
      .eq("status", "ativo")
      .eq("prazo_devolucao", dataAlvo);

    if (erroEmprestimos) throw erroEmprestimos;
    if (!emprestimos || emprestimos.length === 0) {
      console.log("[verificar-cobrancas] Nenhum empréstimo encontrado para hoje.");
      return new Response(JSON.stringify({ ok: true, enviados: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Filtra empréstimos que já receberam notificação de cobrança
    const ids = emprestimos.map(e => e.id_emprestimo);
    const { data: jaNotificados, error: erroNotif } = await supabase
      .from("notificacao")
      .select("id_emprestimo")
      .in("id_emprestimo", ids);

    if (erroNotif) throw erroNotif;

    const idsJaNotificados = new Set((jaNotificados || []).map(n => n.id_emprestimo));
    const pendentes = emprestimos.filter(e => !idsJaNotificados.has(e.id_emprestimo));

    console.log(`[verificar-cobrancas] ${pendentes.length} empréstimo(s) para notificar.`);

    let enviados = 0;

    for (const emprestimo of pendentes) {
      const nome  = emprestimo.cliente?.pessoa?.nome  ?? "Leitor";
      const email = emprestimo.cliente?.pessoa?.email ?? null;
      const titulo = emprestimo.livro?.titulo ?? "livro";
      const isbn   = emprestimo.livro?.isbn   ?? "—";
      const [anoP, mesP, diaP] = emprestimo.prazo_devolucao.split("-");
      const prazoFormatado = `${diaP}/${mesP}/${anoP}`;

      if (!email) {
        console.warn(`[verificar-cobrancas] Empréstimo ${emprestimo.id_emprestimo} sem email, pulando.`);
        continue;
      }

      // Envia email via Edge Function enviar-email já existente
      const resEmail = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/enviar-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            tipo: "cobranca_devolucao",
            para: email,
            dados: { nome, titulo, isbn, prazo: prazoFormatado },
          }),
        }
      );

      if (!resEmail.ok) {
        const err = await resEmail.text();
        console.error(`[verificar-cobrancas] Falha ao enviar email para ${email}:`, err);
        continue; // não registra notificação se o email falhou
      }

      // Registra notificação para não enviar de novo
      const { error: erroInsert } = await supabase.from("notificacao").insert({
        id_cliente:    emprestimo.id_cliente,
        id_emprestimo: emprestimo.id_emprestimo,
        conteudo:      `Lembrete de devolução enviado para "${titulo}" com prazo em ${prazoFormatado}.`,
        enviado:       true,
        data_envio:    new Date().toISOString(),
      });

      if (erroInsert) {
        console.error(`[verificar-cobrancas] Erro ao registrar notificação:`, erroInsert);
      } else {
        enviados++;
      }
    }

    return new Response(JSON.stringify({ ok: true, enviados }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });

  } catch (err) {
    console.error("[verificar-cobrancas] Erro geral:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});