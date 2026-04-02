import { useEffect, useMemo, useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "-";
  }
}

function isRetiradaPedido(pedido = {}) {
  const tipoEntrega = String(pedido?.tipoEntrega || "").toLowerCase().trim();
  const nomeFrete = String(pedido?.freteSelecionado?.nome || "")
    .toLowerCase()
    .trim();

  return (
    tipoEntrega.includes("retirada") ||
    tipoEntrega.includes("retirar") ||
    tipoEntrega.includes("pickup") ||
    nomeFrete.includes("retirada") ||
    nomeFrete.includes("retirar") ||
    nomeFrete.includes("pickup")
  );
}

function normalizarStatus(status, pedido = {}) {
  const valor = String(status || "").toLowerCase().trim();
  const isRetirada = isRetiradaPedido(pedido);

  if (isRetirada) {
    if (valor === "recebido") return "retirada_recebido";
    if (valor === "chegou") return "retirada_recebido";
    if (valor === "para_confirmar") return "retirada_recebido";
    if (valor === "retirada_recebido") return "retirada_recebido";
    if (valor === "retirada_preparando") return "retirada_preparando";
    if (valor === "retirada_pronto") return "retirada_pronto";
    if (valor === "retirada_concluido") return "retirada_concluido";
    return "retirada_recebido";
  }

  if (valor === "recebido") return "para_confirmar";
  if (valor === "chegou") return "para_confirmar";
  if (valor === "para_confirmar") return "para_confirmar";
  if (valor === "a_emitir") return "a_emitir";
  if (valor === "emitido") return "emitido";
  if (valor === "enviado") return "enviado";

  return "para_confirmar";
}

function tituloStatus(status) {
  if (status === "para_confirmar") return "Novo pedido";
  if (status === "a_emitir") return "Ação necessária";
  if (status === "emitido") return "Em preparo";
  if (status === "enviado") return "Enviado";

  if (status === "retirada_recebido") return "Novo pedido";
  if (status === "retirada_preparando") return "Em preparo";
  if (status === "retirada_pronto") return "Pronto para retirada";
  if (status === "retirada_concluido") return "Retirado";

  return "Todos";
}

function corStatus(status) {
  if (status === "para_confirmar" || status === "retirada_recebido") {
    return "bg-violet-100 text-violet-800 border-violet-200";
  }

  if (status === "a_emitir") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (status === "emitido" || status === "retirada_preparando") {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }

  if (status === "enviado" || status === "retirada_pronto") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }

  if (status === "retirada_concluido") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function textoStatusPagamento(status) {
  const valor = String(status || "").toLowerCase();

  if (valor === "approved") return "Pagamento aprovado";
  if (valor === "pending") return "Pagamento pendente";
  if (valor === "rejected") return "Pagamento recusado";
  if (valor === "cancelled") return "Pagamento cancelado";
  if (valor === "in_process") return "Pagamento em análise";

  return valor ? `Pagamento: ${valor}` : "Sem pagamento";
}

function classeStatusPagamento(status) {
  const valor = String(status || "").toLowerCase();

  if (valor === "approved") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  if (valor === "pending" || valor === "in_process") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (valor === "rejected" || valor === "cancelled") {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function textoStatusEtiqueta(pedido) {
  if (isRetiradaPedido(pedido)) return "Retirada no local";
  if (pedido?.etiquetaEmitida) return "Etiqueta emitida";
  if (pedido?.etiquetaGerada) return "Etiqueta gerada";
  return "Sem etiqueta";
}

function classeStatusEtiqueta(pedido) {
  if (isRetiradaPedido(pedido)) {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }

  if (pedido?.etiquetaEmitida) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  if (pedido?.etiquetaGerada) {
    return "bg-sky-100 text-sky-800 border-sky-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function statusPagamentoNormalizado(status) {
  return String(status || "").toLowerCase().trim();
}

function pagamentoAprovado(pedido = {}) {
  return statusPagamentoNormalizado(pedido?.status) === "approved";
}

function pagamentoPendenteOuBloqueado(pedido = {}) {
  const status = statusPagamentoNormalizado(pedido?.status);

  return ["pending", "in_process", "rejected", "cancelled"].includes(status);
}

function normalizarTelefoneWhatsApp(telefone) {
  const numeros = String(telefone || "").replace(/\D/g, "");

  if (!numeros) return "";

  if (numeros.startsWith("55")) return numeros;

  return `55${numeros}`;
}

function construirMensagemConfirmacao(pedido) {
  const cliente = pedido?.dadosCliente || {};
  const nome = cliente.nome ? cliente.nome.split(" ")[0] : "cliente";
  const codigoPedido = pedido?.pedidoLocalId || pedido?.id || "sem código";
  const itens = Array.isArray(pedido?.carrinho) ? pedido.carrinho : [];

  const resumoItens = itens.length
    ? itens
        .map((item) => `- ${item?.nome || "Produto"} x${item?.quantidade || 0}`)
        .join("\n")
    : "- Itens do pedido";

  return [
    `Olá, ${nome}!`,
    "",    
    "Seu pedido *#${codigoPedido}* foi recebido com sucesso e já estamos preparando tudo para a confecção",
    "",
    "O prazo para envio é de *5 dias úteis*.",
    "",
    "*Resumo do pedido:*",
    resumoItens,
    "",
    "Assim que avançarmos para a próxima etapa, avisaremos você.",
    "Obrigado pela preferência :)",
  ].join("\n");
}

function construirMensagemEmbalando(pedido) {
  const cliente = pedido?.dadosCliente || {};
  const nome = cliente.nome ? cliente.nome.split(" ")[0] : "cliente";
  const codigoPedido = pedido?.pedidoLocalId || pedido?.id || "sem código";

  return [
    `Olá, ${nome}! Passando para avisar que o seu pedido *#${codigoPedido}* já está em fase de embalagem`,
    "",
    "Estamos preparando tudo com carinho e cuidado para você.",
    "Assim que houver a próxima atualização, avisaremos por aqui.",
    "",
    "Obrigado pela preferência :)",
  ].join("\n");
}

function construirMensagemRetiradaRecebido(pedido) {
  const cliente = pedido?.dadosCliente || {};
  const nome = cliente.nome ? cliente.nome.split(" ")[0] : "cliente";
  const codigoPedido = pedido?.pedidoLocalId || pedido?.id || "sem código";
  const itens = Array.isArray(pedido?.carrinho) ? pedido.carrinho : [];

  const resumoItens = itens.length
    ? itens
        .map((item) => `- ${item?.nome || "Produto"} x${item?.quantidade || 0}`)
        .join("\n")
    : "- Itens do pedido";

  return [
    `Olá, ${nome}! Seu pedido *#${codigoPedido}* foi recebido com sucesso`,
    "",
    "*Resumo do pedido:*",
    resumoItens,
    "",
    "Em breve avisaremos você sobre o andamento da preparação.",
    "",
    "Obrigado pela preferência :)",
  ].join("\n");
}

function construirMensagemRetiradaPreparando(pedido) {
  const cliente = pedido?.dadosCliente || {};
  const nome = cliente.nome ? cliente.nome.split(" ")[0] : "cliente";
  const codigoPedido = pedido?.pedidoLocalId || pedido?.id || "sem código";

  return [
    `Olá, ${nome}! Seu pedido *#${codigoPedido}* já está sendo preparado`,
    "",
    "Estamos cuidando de tudo para deixar seu pedido pronto.",
    "",
    "Assim que estiver disponível para retirada, avisaremos você por aqui.",
    "",
    "Obrigado pela preferência :)",
  ].join("\n");
}

function construirMensagemRetiradaPronto(pedido) {
  const cliente = pedido?.dadosCliente || {};
  const nome = cliente.nome ? cliente.nome.split(" ")[0] : "cliente";
  const codigoPedido = pedido?.pedidoLocalId || pedido?.id || "sem código";

  return [
    `Olá, ${nome}! Seu pedido *#${codigoPedido}* já está pronto para retirada`,
    "",
    "Pode me chamar por aqui para combinarmos a retirada.",
    "",
    "Obrigado pela preferência :)",
  ].join("\n");
}

function construirMensagemContatoDireto(pedido) {
  const cliente = pedido?.dadosCliente || {};
  const nome = cliente.nome ? cliente.nome.split(" ")[0] : "cliente";
  const codigoPedido = pedido?.pedidoLocalId || pedido?.id || "sem código";

  return [
    `Olá, ${nome}! Tudo bem?`,
    "",
    `Estou entrando em contato sobre o seu pedido *#${codigoPedido}*.`,
    "",
    "Assim que puder, me responda por aqui :)",
  ].join("\n");
}

function gerarLinkWhatsApp(pedido) {
  const telefone = normalizarTelefoneWhatsApp(pedido?.dadosCliente?.telefone);

  if (!telefone) return "";

  const mensagem = construirMensagemConfirmacao(pedido);

  const mensagemSegura = encodeURIComponent(
    mensagem.replace(/[\u2705]/g, "✔")
  );

  return `https://wa.me/${telefone}?text=${mensagemSegura}`;
}

function gerarLinkWhatsAppEmbalando(pedido) {
  const telefone = normalizarTelefoneWhatsApp(pedido?.dadosCliente?.telefone);

  if (!telefone) return "";

  const mensagem = construirMensagemEmbalando(pedido);
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function gerarLinkWhatsAppRetiradaRecebido(pedido) {
  const telefone = normalizarTelefoneWhatsApp(pedido?.dadosCliente?.telefone);

  if (!telefone) return "";

  const mensagem = construirMensagemRetiradaRecebido(pedido);
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function gerarLinkWhatsAppRetiradaPreparando(pedido) {
  const telefone = normalizarTelefoneWhatsApp(pedido?.dadosCliente?.telefone);

  if (!telefone) return "";

  const mensagem = construirMensagemRetiradaPreparando(pedido);
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function gerarLinkWhatsAppRetiradaPronto(pedido) {
  const telefone = normalizarTelefoneWhatsApp(pedido?.dadosCliente?.telefone);

  if (!telefone) return "";

  const mensagem = construirMensagemRetiradaPronto(pedido);
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function gerarLinkWhatsAppContatoDireto(pedido) {
  const telefone = normalizarTelefoneWhatsApp(pedido?.dadosCliente?.telefone);

  if (!telefone) return "";

  const mensagem = construirMensagemContatoDireto(pedido);
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function obterPacotePedido(pedido = {}) {
  return (
    pedido?.superfretePackage ||
    pedido?.freteSelecionado?.package ||
    pedido?.freteSelecionado?.pacoteAdditiveHub ||
    null
  );
}

function obterNomeEmbalagem(pedido = {}, pacote = null) {
  const pacoteBase = pacote || obterPacotePedido(pedido);

  return (
    pacoteBase?.embalagemUtilizada?.nome ||
    pacoteBase?.name ||
    pedido?.freteSelecionado?.name ||
    pedido?.freteSelecionado?.nome ||
    "Embalagem"
  );
}

function isPacoteOtimizado(pedido = {}, pacote = null) {
  const pacoteBase = pacote || obterPacotePedido(pedido);
  const nomeEmbalagem = String(obterNomeEmbalagem(pedido, pacoteBase) || "")
    .toLowerCase()
    .trim();

  return (
    Boolean(pacoteBase?.embalagemUtilizada) ||
    nomeEmbalagem.includes("pacote consolidado") ||
    nomeEmbalagem.includes("pacote único") ||
    nomeEmbalagem.includes("pacote unico") ||
    nomeEmbalagem.includes("otimizado")
  );
}

function calcularVolumeItem(item = {}) {
  const altura = Number(item?.altura || 0);
  const largura = Number(item?.largura || 0);
  const comprimento = Number(item?.comprimento || 0);
  const quantidade = Math.max(1, Number(item?.quantidade || 1));

  if (altura <= 0 || largura <= 0 || comprimento <= 0) return 0;

  return altura * largura * comprimento * quantidade;
}

function calcularVolumeOcupadoPedido(pedido = {}) {
  const itens = Array.isArray(pedido?.carrinho) ? pedido.carrinho : [];

  return itens.reduce((total, item) => total + calcularVolumeItem(item), 0);
}

function calcularVolumePacote(pacote = {}) {
  const altura = Number(pacote?.height || 0);
  const largura = Number(pacote?.width || 0);
  const comprimento = Number(pacote?.length || 0);

  if (altura <= 0 || largura <= 0 || comprimento <= 0) return 0;

  return altura * largura * comprimento;
}

function calcularOcupacaoPacote(pedido = {}, pacote = null) {
  const pacoteBase = pacote || obterPacotePedido(pedido);

  if (!pacoteBase) return null;

  const volumePacote = calcularVolumePacote(pacoteBase);
  const volumeItens = calcularVolumeOcupadoPedido(pedido);

  if (volumePacote <= 0 || volumeItens <= 0) return null;

  const percentual = (volumeItens / volumePacote) * 100;
  return Math.max(0, Math.min(100, percentual));
}

function formatarNumeroDimensao(valor) {
  const numero = Number(valor || 0);

  if (!Number.isFinite(numero) || numero <= 0) return "-";

  return Number.isInteger(numero)
    ? String(numero)
    : numero.toFixed(1).replace(".", ",");
}

function BadgeEmbalagem({ pedido }) {
  const pacote = obterPacotePedido(pedido);

  if (!pacote || isRetiradaPedido(pedido)) return null;

  const nomeEmbalagem = obterNomeEmbalagem(pedido, pacote);
  const otimizado = isPacoteOtimizado(pedido, pacote);
  const ocupacao = calcularOcupacaoPacote(pedido, pacote);
  const dimensoes = `${formatarNumeroDimensao(pacote.length)}×${formatarNumeroDimensao(
    pacote.width
  )}×${formatarNumeroDimensao(pacote.height)} cm`;

  return (
    <div
      className={`mt-3 rounded-2xl border p-3 ${
        otimizado
          ? "border-[#f4b400] bg-[#fff8db]"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
            otimizado
              ? "border-[#f4b400] bg-[#ffe58f] text-[#7a5600]"
              : "border-zinc-300 bg-white text-zinc-700"
          }`}
        >
          <span aria-hidden="true">🟨</span>
          {nomeEmbalagem}
        </span>

        {otimizado && (
          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Pacote otimizado
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 text-sm text-zinc-700">
        <p>
          <span className="font-semibold text-zinc-900">Caixa:</span> {dimensoes}
        </p>

        {pacote?.weight ? (
          <p>
            <span className="font-semibold text-zinc-900">Peso:</span>{" "}
            {String(Number(pacote.weight).toFixed(3)).replace(".", ",")} kg
          </p>
        ) : null}

        {ocupacao != null && (
          <div className="pt-1">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="font-semibold text-zinc-900">Ocupação</span>
              <span className="text-xs font-bold text-zinc-700">
                {ocupacao.toFixed(1).replace(".", ",")}%
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-black/5">
              <div
                className={`h-full rounded-full ${
                  ocupacao >= 80
                    ? "bg-emerald-500"
                    : ocupacao >= 55
                    ? "bg-amber-400"
                    : "bg-zinc-400"
                }`}
                style={{ width: `${ocupacao}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PedidoCard({
  pedido,
  atualizando,
  gerandoEtiqueta,
  emitindoEtiqueta,
  confirmandoPedido,
  onConfirmarPedido,
  onGerarEtiqueta,
  onEmitirEtiqueta,
  onAvisarRetiradaRecebido,
  onAvisarRetiradaPreparando,
  onAvisarRetiradaPronto,
  onConcluirRetirada,
}) {
  const statusOperacional = normalizarStatus(
    pedido.statusInterno || pedido.status,
    pedido
  );

  const itens = Array.isArray(pedido.carrinho) ? pedido.carrinho : [];
  const totalItens = pedido.totalItensCarrinho || 0;
  const total = Number(pedido.totalComFrete || 0);
  const subtotal = Number(pedido.subtotalProdutos || 0);
  const frete = Number(pedido?.freteSelecionado?.preco || 0);
  const desconto = Number(pedido?.descontoCupom || 0);
  const cupom = pedido?.cupomAplicado?.codigo || "";
  const isRetirada = isRetiradaPedido(pedido);

  const cliente = pedido.dadosCliente || {};
  const entrega = pedido.enderecoEntrega || {};
  const linkWhatsAppEmbalando = gerarLinkWhatsAppEmbalando(pedido);
  const linkWhatsAppContatoDireto = gerarLinkWhatsAppContatoDireto(pedido);

  const pagamentoLiberado = pagamentoAprovado(pedido);
  const pagamentoBloqueado = !pagamentoLiberado;

  const podeGerarEtiqueta =
    !isRetirada &&
    !pedido?.etiquetaGerada &&
    !!entrega?.cep &&
    !!entrega?.rua &&
    !!entrega?.numero &&
    !!entrega?.bairro &&
    !!entrega?.cidade &&
    !!entrega?.estado;

  const podeEmitirEtiqueta =
    !isRetirada &&
    !!pedido?.etiquetaGerada &&
    !pedido?.etiquetaEmitida;

  function renderBotaoPrincipal() {
    if (pagamentoBloqueado) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
            Aguardando aprovação do pagamento
          </span>
        </div>
      );
    }

    if (isRetirada && statusOperacional === "retirada_recebido") {
      return (
        <button
          type="button"
          onClick={() => onAvisarRetiradaRecebido(pedido)}
          disabled={
            atualizando || gerandoEtiqueta || emitindoEtiqueta || confirmandoPedido
          }
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Avisar que recebemos o pedido
        </button>
      );
    }

    if (isRetirada && statusOperacional === "retirada_preparando") {
      return (
        <button
          type="button"
          onClick={() => onAvisarRetiradaPreparando(pedido)}
          disabled={
            atualizando || gerandoEtiqueta || emitindoEtiqueta || confirmandoPedido
          }
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Avisar que o produto está sendo preparado
        </button>
      );
    }

    if (isRetirada && statusOperacional === "retirada_pronto") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onAvisarRetiradaPronto(pedido)}
            disabled={
              atualizando ||
              gerandoEtiqueta ||
              emitindoEtiqueta ||
              confirmandoPedido
            }
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Avisar que pode retirar
          </button>

          <button
            type="button"
            onClick={() => onConcluirRetirada(pedido)}
            disabled={
              atualizando ||
              gerandoEtiqueta ||
              emitindoEtiqueta ||
              confirmandoPedido
            }
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {atualizando ? "Concluindo..." : "Marcar como retirado"}
          </button>
        </div>
      );
    }

    if (isRetirada && statusOperacional === "retirada_concluido") {
      return (
        <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
          Pedido finalizado
        </span>
      );
    }

    if (statusOperacional === "para_confirmar") {
      return (
        <button
          type="button"
          onClick={() => onConfirmarPedido(pedido)}
          disabled={
            atualizando || gerandoEtiqueta || emitindoEtiqueta || confirmandoPedido
          }
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {confirmandoPedido ? "Confirmando..." : "Confirmar recebimento"}
        </button>
      );
    }

    if (
      statusOperacional === "a_emitir" &&
      !pedido?.etiquetaGerada &&
      !isRetirada
    ) {
      return (
        <button
          type="button"
          onClick={() => onGerarEtiqueta(pedido)}
          disabled={
            !podeGerarEtiqueta ||
            atualizando ||
            gerandoEtiqueta ||
            emitindoEtiqueta ||
            confirmandoPedido
          }
          className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {gerandoEtiqueta ? "Gerando etiqueta..." : "Gerar etiqueta"}
        </button>
      );
    }

    if (
      statusOperacional === "a_emitir" &&
      pedido?.etiquetaGerada &&
      !pedido?.etiquetaEmitida &&
      !isRetirada
    ) {
      return (
        <button
          type="button"
          onClick={() => onEmitirEtiqueta(pedido)}
          disabled={
            !podeEmitirEtiqueta ||
            atualizando ||
            gerandoEtiqueta ||
            emitindoEtiqueta ||
            confirmandoPedido
          }
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {emitindoEtiqueta ? "Emitindo..." : "Emitir etiqueta"}
        </button>
      );
    }

    if (statusOperacional === "emitido" && linkWhatsAppEmbalando) {
      return (
        <a
          href={linkWhatsAppEmbalando}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800"
        >
          Avisar que está embalando
        </a>
      );
    }

    if (statusOperacional === "enviado") {
      return (
        <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
          Pedido finalizado
        </span>
      );
    }

    return (
      <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-700">
        Sem ação disponível
      </span>
    );
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Pedido
          </p>
          <h3 className="mt-1 text-lg font-bold text-zinc-900">
            {pedido.pedidoLocalId || pedido.id || "Sem código"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Criado em: {formatarData(pedido.criadoEm)}
          </p>
          {pedido.atualizadoEm ? (
            <p className="mt-1 text-xs text-zinc-400">
              Atualizado em: {formatarData(pedido.atualizadoEm)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${corStatus(
              statusOperacional
            )}`}
          >
            {tituloStatus(statusOperacional)}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatusPagamento(
              pedido.status
            )}`}
          >
            {textoStatusPagamento(pedido.status)}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatusEtiqueta(
              pedido
            )}`}
          >
            {textoStatusEtiqueta(pedido)}
          </span>
        </div>
      </div>

      {pagamentoPendenteOuBloqueado(pedido) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Este pedido está bloqueado para preparo e logística até a aprovação do
          pagamento.
        </div>
      )}

      <div className="mt-4 grid gap-3 text-sm text-zinc-700 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="font-semibold text-zinc-900">Cliente</p>
          <div className="mt-2 space-y-1">
            <p className="truncate">{cliente.nome || "-"}</p>
            <p className="truncate">{cliente.email || "-"}</p>
            <p>{cliente.telefone || "-"}</p>
            <p>{cliente.cpf || "-"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="font-semibold text-zinc-900">
            {isRetirada ? "Retirada" : "Entrega"}
          </p>
          <div className="mt-2 space-y-1">
            <p>CEP: {entrega.cep || pedido.cepDestino || "-"}</p>
            <p className="truncate">
              {entrega.rua || "-"}, {entrega.numero || "-"}
            </p>
            <p className="truncate">
              {entrega.bairro || "-"} - {entrega.cidade || "-"} /{" "}
              {entrega.estado || "-"}
            </p>
            {entrega.complemento ? (
              <p className="truncate">Comp.: {entrega.complemento}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="font-semibold text-zinc-900">Frete</p>

          <div className="mt-2 space-y-1">
            <p className="truncate">
              {pedido?.freteSelecionado?.nome || "Sem frete"}
            </p>

            {pedido?.freteSelecionado?.prazo ? (
              <p>Prazo: {pedido.freteSelecionado.prazo}</p>
            ) : null}

            {pedido?.freteSelecionado?.preco !== undefined ? (
              <p>Valor: {formatarMoeda(pedido.freteSelecionado.preco)}</p>
            ) : (
              <p>Valor: -</p>
            )}
          </div>

          <BadgeEmbalagem pedido={pedido} />
        </div>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="font-semibold text-zinc-900">Resumo</p>
          <div className="mt-2 space-y-1">
            <p>Itens: {totalItens}</p>
            <p>Subtotal: {formatarMoeda(subtotal)}</p>
            <p>Frete: {formatarMoeda(frete)}</p>
            {cupom ? <p className="truncate">Cupom: {cupom}</p> : null}
            {cupom || desconto > 0 || pedido?.descontoCupom != null ? (
              <p>Desconto: - {formatarMoeda(desconto)}</p>
            ) : null}
            <p className="font-semibold text-zinc-900">
              Total: {formatarMoeda(total)}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-zinc-900">Produtos</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
              {itens.length} item(ns)
            </span>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {itens.length === 0 && (
              <p className="text-sm text-zinc-500">Nenhum item encontrado.</p>
            )}

            {itens.map((item, index) => (
              <div
                key={`${item?.id || item?.nome || "item"}-${index}`}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-3"
              >
                <p className="line-clamp-2 font-medium text-zinc-900">
                  {item?.nome || "Produto"}
                </p>

                <p className="mt-1 text-sm text-zinc-600">
                  Qtd: {item?.quantidade || 0}
                </p>

                <p className="text-sm text-zinc-600">
                  Unit.: {formatarMoeda(item?.preco || 0)}
                </p>

                {Array.isArray(item?.resumoVariacoes) &&
                  item.resumoVariacoes.length > 0 && (
                    <div className="mt-2 rounded-lg bg-zinc-50 px-2 py-2 text-sm text-zinc-600">
                      {item.resumoVariacoes.map((variacao, i) => (
                        <p
                          key={`${item?.id || item?.nome || "item"}-${
                            variacao?.nome || i
                          }`}
                        >
                          <span className="font-medium text-zinc-800">
                            {variacao?.nome || "Opção"}:
                          </span>{" "}
                          {variacao?.valor || "-"}
                        </p>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>

        {pedido?.urlEtiqueta && !isRetirada ? (
          <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="font-semibold text-zinc-900">Etiqueta</p>
            <a
              href={pedido.urlEtiqueta}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-blue-700 underline"
            >
              Abrir etiqueta
            </a>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {renderBotaoPrincipal()}

        {linkWhatsAppContatoDireto ? (
          <a
            href={linkWhatsAppContatoDireto}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800"
          >
            Falar com comprador
          </a>
        ) : (
          <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-500">
            Comprador sem telefone válido
          </span>
        )}
      </div>
    </article>
  );
}

export default function Painel() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizandoId, setAtualizandoId] = useState(null);
  const [gerandoEtiquetaId, setGerandoEtiquetaId] = useState(null);
  const [emitindoEtiquetaId, setEmitindoEtiquetaId] = useState(null);
  const [confirmandoPedidoId, setConfirmandoPedidoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const apiPedidosUrl = `${apiBaseUrl}/api/pedidos`;
  const token = localStorage.getItem("adminTokenAdditiveHub");

  const headersAutenticados = {
    Authorization: `Bearer ${token}`,
  };

  const sair = () => {
    localStorage.removeItem("adminTokenAdditiveHub");
    localStorage.removeItem("adminUsuarioAdditiveHub");
    window.location.href = "/#/login";
  };

  const tratarRespostaNaoAutorizada = (response) => {
    if (response.status === 401 || response.status === 403) {
      sair();
      return true;
    }

    return false;
  };

  const carregarPedidos = async () => {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(apiPedidosUrl, {
        headers: headersAutenticados,
      });

      if (tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Não foi possível carregar os pedidos."
        );
      }

      const lista = Array.isArray(data) ? data : data?.pedidos || [];

      setPedidos(
        lista.map((pedido) => ({
          ...pedido,
          statusInterno: normalizarStatus(
            pedido.statusInterno || pedido.status,
            pedido
          ),
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setErro(error.message || "Erro ao carregar pedidos.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const confirmarPedido = async (pedido) => {
    const pedidoId = pedido.id || pedido.pedidoLocalId;

    if (!pedidoId) {
      alert("Esse pedido não possui ID para confirmação.");
      return;
    }

    if (!pagamentoAprovado(pedido)) {
      alert("Não é possível confirmar o pedido antes da aprovação do pagamento.");
      return;
    }

    const linkWhatsApp = gerarLinkWhatsApp(pedido);

    if (!linkWhatsApp) {
      alert("Esse pedido não possui telefone válido para abrir o WhatsApp.");
      return;
    }

    const abaWhatsApp = window.open(linkWhatsApp, "_blank");

    try {
      setConfirmandoPedidoId(pedidoId);

      const response = await fetch(`${apiPedidosUrl}/${pedidoId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headersAutenticados,
        },
        body: JSON.stringify({
          status: "a_emitir",
        }),
      });

      if (tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Não foi possível confirmar o pedido."
        );
      }

      setPedidos((anterior) =>
        anterior.map((item) =>
          (item.id || item.pedidoLocalId) === pedidoId
            ? {
                ...item,
                ...data?.pedido,
                statusInterno: "a_emitir",
              }
            : item
        )
      );

      if (!abaWhatsApp) {
        alert(
          "Pedido confirmado, mas o navegador bloqueou a abertura do WhatsApp."
        );
      }
    } catch (error) {
      console.error("Erro ao confirmar pedido:", error);
      alert(error.message || "Erro ao confirmar pedido.");
    } finally {
      setConfirmandoPedidoId(null);
    }
  };

  const atualizarStatusRetiradaComWhatsApp = async ({
    pedido,
    novoStatus,
    gerarLink,
    mensagemErroPadrao,
  }) => {
    const pedidoId = pedido.id || pedido.pedidoLocalId;

    if (!pedidoId) {
      alert("Esse pedido não possui ID.");
      return;
    }

    if (!pagamentoAprovado(pedido)) {
      alert("Não é possível avançar o pedido enquanto o pagamento não estiver aprovado.");
      return;
    }

    const linkWhatsApp = gerarLink(pedido);

    if (!linkWhatsApp) {
      alert("Esse pedido não possui telefone válido para abrir o WhatsApp.");
      return;
    }

    const abaWhatsApp = window.open(linkWhatsApp, "_blank");

    try {
      setAtualizandoId(pedidoId);

      const response = await fetch(`${apiPedidosUrl}/${pedidoId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headersAutenticados,
        },
        body: JSON.stringify({
          status: novoStatus,
        }),
      });

      if (tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || mensagemErroPadrao);
      }

      setPedidos((anterior) =>
        anterior.map((item) =>
          (item.id || item.pedidoLocalId) === pedidoId
            ? {
                ...item,
                ...data?.pedido,
                statusInterno: novoStatus,
              }
            : item
        )
      );

      if (!abaWhatsApp) {
        alert(
          "Status atualizado, mas o navegador bloqueou a abertura do WhatsApp."
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar retirada:", error);
      alert(error.message || mensagemErroPadrao);
    } finally {
      setAtualizandoId(null);
    }
  };

  const avisarRetiradaRecebido = async (pedido) => {
    await atualizarStatusRetiradaComWhatsApp({
      pedido,
      novoStatus: "retirada_preparando",
      gerarLink: gerarLinkWhatsAppRetiradaRecebido,
      mensagemErroPadrao: "Erro ao avisar que o pedido foi recebido.",
    });
  };

  const avisarRetiradaPreparando = async (pedido) => {
    await atualizarStatusRetiradaComWhatsApp({
      pedido,
      novoStatus: "retirada_pronto",
      gerarLink: gerarLinkWhatsAppRetiradaPreparando,
      mensagemErroPadrao: "Erro ao avisar que o pedido está sendo preparado.",
    });
  };

  const avisarRetiradaPronto = async (pedido) => {
    const pedidoId = pedido.id || pedido.pedidoLocalId;

    if (!pedidoId) {
      alert("Esse pedido não possui ID.");
      return;
    }

    if (!pagamentoAprovado(pedido)) {
      alert("Não é possível avisar retirada antes da aprovação do pagamento.");
      return;
    }

    const linkWhatsApp = gerarLinkWhatsAppRetiradaPronto(pedido);

    if (!linkWhatsApp) {
      alert("Esse pedido não possui telefone válido para abrir o WhatsApp.");
      return;
    }

    const abaWhatsApp = window.open(linkWhatsApp, "_blank");

    if (!abaWhatsApp) {
      alert("O navegador bloqueou a abertura do WhatsApp.");
    }
  };

  const concluirRetirada = async (pedido) => {
    const pedidoId = pedido.id || pedido.pedidoLocalId;

    if (!pedidoId) {
      alert("Esse pedido não possui ID.");
      return;
    }

    if (!pagamentoAprovado(pedido)) {
      alert("Não é possível concluir retirada antes da aprovação do pagamento.");
      return;
    }

    try {
      setAtualizandoId(pedidoId);

      const response = await fetch(`${apiPedidosUrl}/${pedidoId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headersAutenticados,
        },
        body: JSON.stringify({
          status: "retirada_concluido",
        }),
      });

      if (tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Erro ao concluir retirada."
        );
      }

      setPedidos((anterior) =>
        anterior.map((item) =>
          (item.id || item.pedidoLocalId) === pedidoId
            ? {
                ...item,
                ...data?.pedido,
                statusInterno: "retirada_concluido",
              }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao concluir retirada:", error);
      alert(error.message || "Erro ao concluir retirada.");
    } finally {
      setAtualizandoId(null);
    }
  };

  const gerarEtiqueta = async (pedido) => {
    if (isRetiradaPedido(pedido)) {
      alert("Pedidos de retirada não podem gerar etiqueta.");
      return;
    }

    if (!pagamentoAprovado(pedido)) {
      alert("Não é possível gerar etiqueta antes da aprovação do pagamento.");
      return;
    }

    const pedidoId = pedido.id || pedido.pedidoLocalId;

    if (!pedidoId) {
      alert("Esse pedido não possui ID para gerar etiqueta.");
      return;
    }

    try {
      setGerandoEtiquetaId(pedidoId);

      const response = await fetch(`${apiPedidosUrl}/${pedidoId}/gerar-etiqueta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headersAutenticados,
        },
      });

      if (tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Não foi possível gerar a etiqueta."
        );
      }

      setPedidos((anterior) =>
        anterior.map((item) =>
          (item.id || item.pedidoLocalId) === pedidoId
            ? {
                ...item,
                ...data?.pedido,
                statusInterno: "a_emitir",
                etiquetaGerada: true,
              }
            : item
        )
      );

      if (data?.urlEtiqueta) {
        window.open(data.urlEtiqueta, "_blank");
      }
    } catch (error) {
      console.error("Erro ao gerar etiqueta:", error);
      alert(error.message || "Erro ao gerar etiqueta.");
    } finally {
      setGerandoEtiquetaId(null);
    }
  };

  const emitirEtiqueta = async (pedido) => {
    if (isRetiradaPedido(pedido)) {
      alert("Pedidos de retirada não podem emitir etiqueta.");
      return;
    }

    if (!pagamentoAprovado(pedido)) {
      alert("Não é possível emitir etiqueta antes da aprovação do pagamento.");
      return;
    }

    const pedidoId = pedido.id || pedido.pedidoLocalId;

    if (!pedidoId) {
      alert("Esse pedido não possui ID para emitir etiqueta.");
      return;
    }

    try {
      setEmitindoEtiquetaId(pedidoId);

      const response = await fetch(`${apiPedidosUrl}/${pedidoId}/emitir-etiqueta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headersAutenticados,
        },
      });

      if (tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Não foi possível emitir a etiqueta."
        );
      }

      setPedidos((anterior) =>
        anterior.map((item) =>
          (item.id || item.pedidoLocalId) === pedidoId
            ? {
                ...item,
                ...data?.pedido,
                statusInterno: "emitido",
                etiquetaGerada: true,
                etiquetaEmitida: true,
              }
            : item
        )
      );

      if (data?.urlEtiqueta) {
        window.open(data.urlEtiqueta, "_blank");
      }
    } catch (error) {
      console.error("Erro ao emitir etiqueta:", error);
      alert(error.message || "Erro ao emitir etiqueta.");
    } finally {
      setEmitindoEtiquetaId(null);
    }
  };

  const pedidosFiltrados = useMemo(() => {
    const termo = String(busca || "").toLowerCase().trim();

    let lista = pedidos;

    if (termo) {
      lista = lista.filter((pedido) => {
        const cliente = pedido.dadosCliente || {};
        const entrega = pedido.enderecoEntrega || {};
        const itens = Array.isArray(pedido.carrinho) ? pedido.carrinho : [];

        const texto = [
          pedido.id,
          pedido.pedidoLocalId,
          pedido.status,
          pedido.statusInterno,
          pedido.codigoRastreio,
          pedido.metodo_pagamento,
          pedido.status_detail,
          pedido.cupomAplicado?.codigo,
          pedido.descontoCupom,
          pedido.tipoEntrega,
          cliente.nome,
          cliente.email,
          cliente.telefone,
          cliente.cpf,
          entrega.cep,
          entrega.rua,
          entrega.bairro,
          entrega.cidade,
          entrega.estado,
          entrega.numero,
          entrega.complemento,
          pedido.freteSelecionado?.nome,
          ...itens.map((item) => item?.nome),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return texto.includes(termo);
      });
    }

    if (filtroStatus !== "todos") {
      lista = lista.filter((pedido) => {
        const status = normalizarStatus(
          pedido.statusInterno || pedido.status,
          pedido
        );

        if (filtroStatus === "novos") {
          return status === "para_confirmar" || status === "retirada_recebido";
        }

        if (filtroStatus === "acao_necessaria") {
          return status === "a_emitir";
        }

        if (filtroStatus === "em_preparo") {
          return status === "emitido" || status === "retirada_preparando";
        }

        if (filtroStatus === "prontos") {
          return status === "retirada_pronto" || status === "enviado";
        }

        if (filtroStatus === "concluidos") {
          return status === "retirada_concluido";
        }

        return status === filtroStatus;
      });
    }

    return lista;
  }, [pedidos, busca, filtroStatus]);

  const contagem = useMemo(() => {
    return {
      todos: pedidos.length,
      novos: pedidos.filter((pedido) => {
        const status = normalizarStatus(
          pedido.statusInterno || pedido.status,
          pedido
        );
        return status === "para_confirmar" || status === "retirada_recebido";
      }).length,
      acao_necessaria: pedidos.filter((pedido) => {
        const status = normalizarStatus(
          pedido.statusInterno || pedido.status,
          pedido
        );
        return status === "a_emitir";
      }).length,
      em_preparo: pedidos.filter((pedido) => {
        const status = normalizarStatus(
          pedido.statusInterno || pedido.status,
          pedido
        );
        return status === "emitido" || status === "retirada_preparando";
      }).length,
      prontos: pedidos.filter((pedido) => {
        const status = normalizarStatus(
          pedido.statusInterno || pedido.status,
          pedido
        );
        return status === "retirada_pronto" || status === "enviado";
      }).length,
      concluidos: pedidos.filter((pedido) => {
        const status = normalizarStatus(
          pedido.statusInterno || pedido.status,
          pedido
        );
        return status === "retirada_concluido";
      }).length,
    };
  }, [pedidos]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
              Painel interno
            </p>
            <h1 className="mt-2 text-3xl font-bold">Controle de pedidos</h1>
            <p className="mt-2 text-zinc-600">
              Visualize pedidos, confirme no WhatsApp e avance o fluxo sem
              precisar de várias guias.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:max-w-md md:flex-row">
  <input
    type="text"
    placeholder="Buscar por cliente, pedido, produto, cidade..."
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
  />

  <a
    href="/#/ordem-producao"
    className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-900"
  >
    Ordem de produção
  </a>

  <button
    type="button"
    onClick={sair}
    className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800"
  >
    Sair
  </button>
</div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <button
            type="button"
            onClick={() => setFiltroStatus("todos")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "todos"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-900"
            }`}
          >
            <p className="text-sm opacity-80">Todos</p>
            <p className="mt-2 text-3xl font-black">{contagem.todos}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("novos")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "novos"
                ? "border-violet-700 bg-violet-700 text-white"
                : "border-violet-200 bg-violet-50 text-violet-900"
            }`}
          >
            <p className="text-sm opacity-80">Novos</p>
            <p className="mt-2 text-3xl font-black">{contagem.novos}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("acao_necessaria")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "acao_necessaria"
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <p className="text-sm opacity-80">Ação necessária</p>
            <p className="mt-2 text-3xl font-black">{contagem.acao_necessaria}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("em_preparo")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "em_preparo"
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-orange-200 bg-orange-50 text-orange-900"
            }`}
          >
            <p className="text-sm opacity-80">Em preparo</p>
            <p className="mt-2 text-3xl font-black">{contagem.em_preparo}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("prontos")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "prontos"
                ? "border-blue-700 bg-blue-700 text-white"
                : "border-blue-200 bg-blue-50 text-blue-900"
            }`}
          >
            <p className="text-sm opacity-80">Prontos / enviados</p>
            <p className="mt-2 text-3xl font-black">{contagem.prontos}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("concluidos")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "concluidos"
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <p className="text-sm opacity-80">Concluídos</p>
            <p className="mt-2 text-3xl font-black">{contagem.concluidos}</p>
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={carregarPedidos}
            className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800"
          >
            Atualizar lista
          </button>

          {filtroStatus !== "todos" && (
            <button
              type="button"
              onClick={() => setFiltroStatus("todos")}
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800"
            >
              Limpar filtro
            </button>
          )}
        </div>

        {carregando && (
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm">
            Carregando pedidos...
          </div>
        )}

        {!carregando && erro && (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!carregando && !erro && (
          <div className="space-y-4">
            {pedidosFiltrados.length === 0 ? (
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm">
                Nenhum pedido encontrado.
              </div>
            ) : (
              pedidosFiltrados.map((pedido) => {
                const pedidoId = pedido.id || pedido.pedidoLocalId;

                return (
                  <PedidoCard
                    key={pedidoId}
                    pedido={pedido}
                    atualizando={atualizandoId === pedidoId}
                    gerandoEtiqueta={gerandoEtiquetaId === pedidoId}
                    emitindoEtiqueta={emitindoEtiquetaId === pedidoId}
                    confirmandoPedido={confirmandoPedidoId === pedidoId}
                    onConfirmarPedido={confirmarPedido}
                    onGerarEtiqueta={gerarEtiqueta}
                    onEmitirEtiqueta={emitirEtiqueta}
                    onAvisarRetiradaRecebido={avisarRetiradaRecebido}
                    onAvisarRetiradaPreparando={avisarRetiradaPreparando}
                    onAvisarRetiradaPronto={avisarRetiradaPronto}
                    onConcluirRetirada={concluirRetirada}
                  />
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}