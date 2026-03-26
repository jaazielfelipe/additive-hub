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

  if (valor === "recebido") return "chegou";
  if (valor === "chegou") return "chegou";
  if (valor === "emitido") return "emitido";
  if (valor === "enviado") return "enviado";

  return "chegou";
}

function tituloStatus(status) {
  if (status === "chegou") return "Pedidos que chegaram";
  if (status === "emitido") return "Pedidos emitidos";
  if (status === "enviado") return "Pedidos enviados";
  return "Pedidos";
}

function corStatus(status) {
  if (status === "chegou") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "emitido") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "enviado") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function proximoStatus(status) {
  if (status === "chegou") return "emitido";
  if (status === "emitido") return "enviado";
  return null;
}

function statusAnterior(status) {
  if (status === "enviado") return "emitido";
  if (status === "emitido") return "chegou";
  return null;
}

function nomeBotaoAvancar(status) {
  if (status === "chegou") return "Marcar como emitido";
  if (status === "emitido") return "Marcar como enviado";
  return "";
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

function PedidoCard({
  pedido,
  atualizando,
  gerandoEtiqueta,
  emitindoEtiqueta,
  onAtualizarStatus,
  onGerarEtiqueta,
  onEmitirEtiqueta,
}) {
  const statusOperacional = normalizarStatus(
    pedido.statusInterno || pedido.status
  );

  const itens = Array.isArray(pedido.carrinho) ? pedido.carrinho : [];
  const totalItens = pedido.totalItensCarrinho || 0;
  const total = pedido.totalComFrete || 0;

  const cliente = pedido.dadosCliente || {};
  const entrega = pedido.enderecoEntrega || {};

  const proximo = proximoStatus(statusOperacional);
  const anterior = statusAnterior(statusOperacional);

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

  const pedidoId = pedido.id || pedido.pedidoLocalId;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Pedido
          </p>
          <h3 className="mt-1 text-base font-bold text-zinc-900">
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

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${corStatus(
              statusOperacional
            )}`}
          >
            {statusOperacional === "chegou" && "Chegou"}
            {statusOperacional === "emitido" && "Emitido"}
            {statusOperacional === "enviado" && "Enviado"}
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

      <div className="mt-4 space-y-3 text-sm text-zinc-700">
        <div>
          <p className="font-semibold text-zinc-900">Cliente</p>
          <p>{cliente.nome || "-"}</p>
          <p>{cliente.email || "-"}</p>
          <p>{cliente.telefone || "-"}</p>
          <p>{cliente.cpf || "-"}</p>
        </div>

        <div>
          <p className="font-semibold text-zinc-900">Entrega</p>
          <p>CEP: {entrega.cep || pedido.cepDestino || "-"}</p>
          <p>
            {entrega.rua || "-"}, {entrega.numero || "-"}
          </p>
          <p>
            {entrega.bairro || "-"} - {entrega.cidade || "-"} /{" "}
            {entrega.estado || "-"}
          </p>
          {entrega.complemento ? (
            <p>Complemento: {entrega.complemento}</p>
          ) : null}
        </div>

        {pedido?.freteSelecionado ? (
          <div>
            <p className="font-semibold text-zinc-900">Frete</p>
            <p>{pedido.freteSelecionado?.nome || "Serviço selecionado"}</p>
            {pedido.freteSelecionado?.prazo ? (
              <p>Prazo: {pedido.freteSelecionado.prazo}</p>
            ) : null}
            {pedido.freteSelecionado?.preco !== undefined ? (
              <p>Valor: {formatarMoeda(pedido.freteSelecionado.preco)}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <p className="font-semibold text-zinc-900">Resumo</p>
          <p>Itens: {totalItens}</p>
          <p>Subtotal: {formatarMoeda(pedido.subtotalProdutos || 0)}</p>
          <p>Total: {formatarMoeda(total)}</p>
          {pedido?.codigoRastreio ? (
            <p>Código de rastreio: {pedido.codigoRastreio}</p>
          ) : null}
          {pedido?.payment_id ? (
            <p>ID pagamento: {pedido.payment_id}</p>
          ) : null}
        </div>

        <div>
          <p className="font-semibold text-zinc-900">Produtos</p>
          <div className="mt-2 space-y-2">
            {itens.length === 0 && (
              <p className="text-sm text-zinc-500">Nenhum item encontrado.</p>
            )}

            {itens.map((item, index) => (
              <div
                key={`${item?.id || item?.nome || "item"}-${index}`}
                className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"
              >
                <p className="font-medium text-zinc-900">
                  {item?.nome || "Produto"}
                </p>
                <p className="text-sm text-zinc-600">
                  Quantidade: {item?.quantidade || 0}
                </p>
                <p className="text-sm text-zinc-600">
                  Valor unitário: {formatarMoeda(item?.preco || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {pedido?.urlEtiqueta ? (
          <div>
            <p className="font-semibold text-zinc-900">Etiqueta</p>
            <a
              href={pedido.urlEtiqueta}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm font-medium text-blue-700 underline"
            >
              Abrir etiqueta
            </a>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {anterior && (
          <button
            type="button"
            onClick={() => onAtualizarStatus(pedido, anterior)}
            disabled={atualizando || gerandoEtiqueta || emitindoEtiqueta}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {atualizando ? "Atualizando..." : "Voltar status"}
          </button>
        )}

        {proximo && (
          <button
            type="button"
            onClick={() => onAtualizarStatus(pedido, proximo)}
            disabled={atualizando || gerandoEtiqueta || emitindoEtiqueta}
            className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {atualizando ? "Atualizando..." : nomeBotaoAvancar(statusOperacional)}
          </button>
        )}

        <button
          type="button"
          onClick={() => onGerarEtiqueta(pedido)}
          disabled={
            !podeGerarEtiqueta || atualizando || gerandoEtiqueta || emitindoEtiqueta
          }
          className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {gerandoEtiqueta ? "Gerando etiqueta..." : "Gerar etiqueta"}
        </button>

        <button
          type="button"
          onClick={() => onEmitirEtiqueta(pedido)}
          disabled={
            !podeEmitirEtiqueta ||
            atualizando ||
            gerandoEtiqueta ||
            emitindoEtiqueta
          }
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {emitindoEtiqueta ? "Emitindo..." : "Emitir etiqueta"}
        </button>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(String(pedidoId || ""));
            alert("Código do pedido copiado.");
          }}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800"
        >
          Copiar código
        </button>
      </div>
    </article>
  );
}

function ColunaPedidos({
  titulo,
  pedidos,
  status,
  atualizandoId,
  gerandoEtiquetaId,
  emitindoEtiquetaId,
  onAtualizarStatus,
  onGerarEtiqueta,
  onEmitirEtiqueta,
}) {
  return (
    <section className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">{titulo}</h2>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-zinc-700">
          {pedidos.length}
        </span>
      </div>

      <div className="space-y-4">
        {pedidos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
            Nenhum pedido em {status}.
          </div>
        )}

        {pedidos.map((pedido) => {
          const pedidoId = pedido.id || pedido.pedidoLocalId;

          return (
            <PedidoCard
              key={pedidoId}
              pedido={pedido}
              atualizando={atualizandoId === pedidoId}
              gerandoEtiqueta={gerandoEtiquetaId === pedidoId}
              emitindoEtiqueta={emitindoEtiquetaId === pedidoId}
              onAtualizarStatus={onAtualizarStatus}
              onGerarEtiqueta={onGerarEtiqueta}
              onEmitirEtiqueta={onEmitirEtiqueta}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function Painel() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizandoId, setAtualizandoId] = useState(null);
  const [gerandoEtiquetaId, setGerandoEtiquetaId] = useState(null);
  const [emitindoEtiquetaId, setEmitindoEtiquetaId] = useState(null);
  const [busca, setBusca] = useState("");

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const apiPedidosUrl = `${apiBaseUrl}/api/pedidos`;

  const carregarPedidos = async () => {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(apiPedidosUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Não foi possível carregar os pedidos.");
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

  const atualizarStatusPedido = async (pedido, novoStatus) => {
    const pedidoId = pedido.id || pedido.pedidoLocalId;

    if (!pedidoId) {
      alert("Esse pedido não possui ID para atualização.");
      return;
    }

    try {
      setAtualizandoId(pedidoId);

      const response = await fetch(`${apiPedidosUrl}/${pedidoId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: novoStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Não foi possível atualizar o status."
        );
      }

      setPedidos((anterior) =>
        anterior.map((item) =>
          (item.id || item.pedidoLocalId) === pedidoId
            ? {
                ...item,
                ...data?.pedido,
                statusInterno: normalizarStatus(
                  data?.pedido?.statusInterno || novoStatus
                ),
              }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert(error.message || "Erro ao atualizar status.");
    } finally {
      setAtualizandoId(null);
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
        },
      });

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
                statusInterno: normalizarStatus(
                  data?.pedido?.statusInterno || item.statusInterno
                ),
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
        },
      });

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
                statusInterno: normalizarStatus(
                  data?.pedido?.statusInterno || "enviado"
                ),
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

    if (!termo) return pedidos;

    return pedidos.filter((pedido) => {
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
  }, [pedidos, busca]);

  const pedidosChegaram = useMemo(
    () =>
      pedidosFiltrados.filter(
        (pedido) =>
          normalizarStatus(pedido.statusInterno || pedido.status) === "chegou"
      ),
    [pedidosFiltrados]
  );

  const pedidosEmitidos = useMemo(
    () =>
      pedidosFiltrados.filter(
        (pedido) =>
          normalizarStatus(pedido.statusInterno || pedido.status) === "emitido"
      ),
    [pedidosFiltrados]
  );

  const pedidosEnviados = useMemo(
    () =>
      pedidosFiltrados.filter(
        (pedido) =>
          normalizarStatus(pedido.statusInterno || pedido.status) === "enviado"
      ),
    [pedidosFiltrados]
  );

  const totalPedidos = pedidosFiltrados.length;

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
              Visualize pedidos, acompanhe pagamento, mude status interno e gere
              etiquetas.
            </p>
          </div>

          <div className="w-full md:max-w-sm">
            <input
              type="text"
              placeholder="Buscar por cliente, pedido, produto, cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Total</p>
            <p className="mt-2 text-3xl font-black text-zinc-900">{totalPedidos}</p>
          </div>

          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Chegaram</p>
            <p className="mt-2 text-3xl font-black text-amber-900">
              {pedidosChegaram.length}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm text-blue-700">Emitidos</p>
            <p className="mt-2 text-3xl font-black text-blue-900">
              {pedidosEmitidos.length}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">Enviados</p>
            <p className="mt-2 text-3xl font-black text-emerald-900">
              {pedidosEnviados.length}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={carregarPedidos}
            className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800"
          >
            Atualizar lista
          </button>
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
          <div className="grid gap-6 xl:grid-cols-3">
            <ColunaPedidos
              titulo={tituloStatus("chegou")}
              pedidos={pedidosChegaram}
              status="chegou"
              atualizandoId={atualizandoId}
              gerandoEtiquetaId={gerandoEtiquetaId}
              emitindoEtiquetaId={emitindoEtiquetaId}
              onAtualizarStatus={atualizarStatusPedido}
              onGerarEtiqueta={gerarEtiqueta}
              onEmitirEtiqueta={emitirEtiqueta}
            />

            <ColunaPedidos
              titulo={tituloStatus("emitido")}
              pedidos={pedidosEmitidos}
              status="emitido"
              atualizandoId={atualizandoId}
              gerandoEtiquetaId={gerandoEtiquetaId}
              emitindoEtiquetaId={emitindoEtiquetaId}
              onAtualizarStatus={atualizarStatusPedido}
              onGerarEtiqueta={gerarEtiqueta}
              onEmitirEtiqueta={emitirEtiqueta}
            />

            <ColunaPedidos
              titulo={tituloStatus("enviado")}
              pedidos={pedidosEnviados}
              status="enviado"
              atualizandoId={atualizandoId}
              gerandoEtiquetaId={gerandoEtiquetaId}
              emitindoEtiquetaId={emitindoEtiquetaId}
              onAtualizarStatus={atualizarStatusPedido}
              onGerarEtiqueta={gerarEtiqueta}
              onEmitirEtiqueta={emitirEtiqueta}
            />
          </div>
        )}
      </div>
    </div>
  );
}