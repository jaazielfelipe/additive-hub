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

function normalizarStatus(status) {
  const valor = String(status || "").toLowerCase().trim();

  if (valor === "recebido") return "para_confirmar";
  if (valor === "chegou") return "para_confirmar";
  if (valor === "para_confirmar") return "para_confirmar";
  if (valor === "a_emitir") return "a_emitir";
  if (valor === "emitido") return "emitido";
  if (valor === "enviado") return "enviado";

  return "para_confirmar";
}

function tituloStatus(status) {
  if (status === "para_confirmar") return "Para confirmar";
  if (status === "a_emitir") return "A emitir";
  if (status === "emitido") return "Emitido";
  if (status === "enviado") return "Enviado";
  return "Todos";
}

function corStatus(status) {
  if (status === "para_confirmar") {
    return "bg-violet-100 text-violet-800 border-violet-200";
  }
  if (status === "a_emitir") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "emitido") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "enviado") return "bg-emerald-100 text-emerald-800 border-emerald-200";
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
  if (pedido?.etiquetaEmitida) return "Etiqueta emitida";
  if (pedido?.etiquetaGerada) return "Etiqueta gerada";
  return "Sem etiqueta";
}

function classeStatusEtiqueta(pedido) {
  if (pedido?.etiquetaEmitida) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  if (pedido?.etiquetaGerada) {
    return "bg-sky-100 text-sky-800 border-sky-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
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
    `Olá, ${nome}! Seu pedido *#${codigoPedido}* foi recebido com sucesso ✅`,
    "",
    "Já estamos preparando tudo para a confecção.",
    "O prazo é de *3 dias úteis* para produção.",
    "",
    "*Resumo do pedido:*",
    resumoItens,
    "",
    "Assim que avançarmos para a próxima etapa, avisaremos você.",
    "Obrigado pela preferência 💛",
  ].join("\n");
}

function construirMensagemEmbalando(pedido) {
  const cliente = pedido?.dadosCliente || {};
  const nome = cliente.nome ? cliente.nome.split(" ")[0] : "cliente";
  const codigoPedido = pedido?.pedidoLocalId || pedido?.id || "sem código";

  return [
    `Olá, ${nome}! Passando para avisar que o seu pedido *#${codigoPedido}* já está em fase de embalagem 📦`,
    "",
    "Estamos preparando tudo com cuidado para envio.",
    "Assim que houver a próxima atualização, avisaremos você.",
    "",
    "Obrigado pela preferência 💛",
  ].join("\n");
}

function gerarLinkWhatsApp(pedido) {
  const telefone = normalizarTelefoneWhatsApp(pedido?.dadosCliente?.telefone);

  if (!telefone) return "";

  const mensagem = construirMensagemConfirmacao(pedido);
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function gerarLinkWhatsAppEmbalando(pedido) {
  const telefone = normalizarTelefoneWhatsApp(pedido?.dadosCliente?.telefone);

  if (!telefone) return "";

  const mensagem = construirMensagemEmbalando(pedido);
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
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
}) {
  const statusOperacional = normalizarStatus(
    pedido.statusInterno || pedido.status
  );

  const itens = Array.isArray(pedido.carrinho) ? pedido.carrinho : [];
  const totalItens = pedido.totalItensCarrinho || 0;
  const total = Number(pedido.totalComFrete || 0);
  const subtotal = Number(pedido.subtotalProdutos || 0);
  const frete = Number(pedido?.freteSelecionado?.preco || 0);
  const desconto = Number(pedido?.descontoCupom || 0);
  const cupom = pedido?.cupomAplicado?.codigo || "";

  const cliente = pedido.dadosCliente || {};
  const entrega = pedido.enderecoEntrega || {};
  const linkWhatsAppEmbalando = gerarLinkWhatsAppEmbalando(pedido);

  const podeGerarEtiqueta =
    !pedido?.etiquetaGerada &&
    !!entrega?.cep &&
    !!entrega?.rua &&
    !!entrega?.numero &&
    !!entrega?.bairro &&
    !!entrega?.cidade &&
    !!entrega?.estado;

  const podeEmitirEtiqueta =
    !!pedido?.etiquetaGerada && !pedido?.etiquetaEmitida;

  function renderBotaoPrincipal() {
    if (statusOperacional === "para_confirmar") {
      return (
        <button
          type="button"
          onClick={() => onConfirmarPedido(pedido)}
          disabled={atualizando || gerandoEtiqueta || emitindoEtiqueta || confirmandoPedido}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {confirmandoPedido ? "Confirmando..." : "Confirmar recebimento"}
        </button>
      );
    }

    if (statusOperacional === "a_emitir" && !pedido?.etiquetaGerada) {
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

    if (statusOperacional === "a_emitir" && pedido?.etiquetaGerada && !pedido?.etiquetaEmitida) {
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

    return (
      <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
        Pedido finalizado
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
          <p className="font-semibold text-zinc-900">Entrega</p>
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
        </div>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="font-semibold text-zinc-900">Resumo</p>
          <div className="mt-2 space-y-1">
            <p>Itens: {totalItens}</p>
            <p>Subtotal: {formatarMoeda(subtotal)}</p>
            <p>Frete: {formatarMoeda(frete)}</p>
            {cupom ? <p className="truncate">Cupom: {cupom}</p> : null}
            {(cupom || desconto > 0 || pedido?.descontoCupom != null) ? (
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
                <p className="font-medium text-zinc-900 line-clamp-2">
                  {item?.nome || "Produto"}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Qtd: {item?.quantidade || 0}
                </p>
                <p className="text-sm text-zinc-600">
                  Unit.: {formatarMoeda(item?.preco || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {pedido?.urlEtiqueta ? (
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
          statusInterno: normalizarStatus(pedido.statusInterno || pedido.status),
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
        alert("Pedido confirmado, mas o navegador bloqueou a abertura do WhatsApp.");
      }
    } catch (error) {
      console.error("Erro ao confirmar pedido:", error);
      alert(error.message || "Erro ao confirmar pedido.");
    } finally {
      setConfirmandoPedidoId(null);
    }
  };

  const gerarEtiqueta = async (pedido) => {
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
      lista = lista.filter(
        (pedido) =>
          normalizarStatus(pedido.statusInterno || pedido.status) === filtroStatus
      );
    }

    return lista;
  }, [pedidos, busca, filtroStatus]);

  const contagem = useMemo(() => {
    return {
      todos: pedidos.length,
      para_confirmar: pedidos.filter(
        (pedido) =>
          normalizarStatus(pedido.statusInterno || pedido.status) === "para_confirmar"
      ).length,
      a_emitir: pedidos.filter(
        (pedido) =>
          normalizarStatus(pedido.statusInterno || pedido.status) === "a_emitir"
      ).length,
      emitido: pedidos.filter(
        (pedido) =>
          normalizarStatus(pedido.statusInterno || pedido.status) === "emitido"
      ).length,
      enviado: pedidos.filter(
        (pedido) =>
          normalizarStatus(pedido.statusInterno || pedido.status) === "enviado"
      ).length,
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
              Visualize pedidos, confirme no WhatsApp e avance o fluxo sem precisar de várias guias.
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

            <button
              type="button"
              onClick={sair}
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-5">
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
            onClick={() => setFiltroStatus("para_confirmar")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "para_confirmar"
                ? "border-violet-700 bg-violet-700 text-white"
                : "border-violet-200 bg-violet-50 text-violet-900"
            }`}
          >
            <p className="text-sm opacity-80">Para confirmar</p>
            <p className="mt-2 text-3xl font-black">{contagem.para_confirmar}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("a_emitir")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "a_emitir"
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <p className="text-sm opacity-80">A emitir</p>
            <p className="mt-2 text-3xl font-black">{contagem.a_emitir}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("emitido")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "emitido"
                ? "border-blue-700 bg-blue-700 text-white"
                : "border-blue-200 bg-blue-50 text-blue-900"
            }`}
          >
            <p className="text-sm opacity-80">Emitidos</p>
            <p className="mt-2 text-3xl font-black">{contagem.emitido}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus("enviado")}
            className={`rounded-[1.5rem] border p-5 text-left shadow-sm ${
              filtroStatus === "enviado"
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <p className="text-sm opacity-80">Enviados</p>
            <p className="mt-2 text-3xl font-black">{contagem.enviado}</p>
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
