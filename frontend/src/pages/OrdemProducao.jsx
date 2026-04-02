import { useEffect, useMemo, useState } from "react";

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

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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

function pagamentoAprovado(pedido = {}) {
  return String(pedido?.status || "").toLowerCase().trim() === "approved";
}

function classePrioridade(statusInterno) {
  if (statusInterno === "para_confirmar" || statusInterno === "retirada_recebido") {
    return "bg-violet-100 text-violet-800 border-violet-200";
  }

  if (statusInterno === "a_emitir") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (statusInterno === "emitido" || statusInterno === "retirada_preparando") {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }

  if (statusInterno === "retirada_pronto") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function textoPrioridade(statusInterno) {
  if (statusInterno === "para_confirmar" || statusInterno === "retirada_recebido") {
    return "Novo";
  }

  if (statusInterno === "a_emitir") {
    return "Aguardando produção";
  }

  if (statusInterno === "emitido" || statusInterno === "retirada_preparando") {
    return "Em produção";
  }

  if (statusInterno === "retirada_pronto") {
    return "Pronto para retirada";
  }

  return "Fila";
}

export default function OrdemProducao() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [somentePendentes, setSomentePendentes] = useState(true);

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
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

      const response = await fetch(`${apiBaseUrl}/api/pedidos`, {
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
      setPedidos(lista);
    } catch (error) {
      console.error("Erro ao carregar ordem de produção:", error);
      setErro(error.message || "Erro ao carregar ordem de produção.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const itensProducao = useMemo(() => {
    const termo = String(busca || "").toLowerCase().trim();

    const listaBase = pedidos
      .filter((pedido) => pagamentoAprovado(pedido))
      .filter((pedido) => {
        const statusInterno = normalizarStatus(
          pedido?.statusInterno || pedido?.status,
          pedido
        );

        if (!somentePendentes) return true;

        return !["enviado", "retirada_concluido"].includes(statusInterno);
      })
      .sort((a, b) => {
        const dataA = new Date(a?.criadoEm || 0).getTime();
        const dataB = new Date(b?.criadoEm || 0).getTime();
        return dataA - dataB;
      });

    const itens = listaBase.flatMap((pedido, indexPedido) => {
      const statusInterno = normalizarStatus(
        pedido?.statusInterno || pedido?.status,
        pedido
      );

      const cliente = pedido?.dadosCliente || {};
      const itensPedido = Array.isArray(pedido?.carrinho) ? pedido.carrinho : [];

      return itensPedido.map((item, indexItem) => ({
        chave: `${pedido?.id || pedido?.pedidoLocalId || indexPedido}-${item?.id || item?.nome || indexItem}-${indexItem}`,
        ordemChegada: indexPedido + 1,
        criadoEm: pedido?.criadoEm,
        pedidoId: pedido?.pedidoLocalId || pedido?.id || "-",
        clienteNome: cliente?.nome || "-",
        clienteTelefone: cliente?.telefone || "-",
        produtoNome: item?.nome || "Produto",
        quantidade: Number(item?.quantidade || 0),
        valorUnitario: Number(item?.preco || 0),
        subtotalItem: Number(item?.preco || 0) * Number(item?.quantidade || 0),
        resumoVariacoes: Array.isArray(item?.resumoVariacoes)
          ? item.resumoVariacoes
          : [],
        statusInterno,
        tipoEntrega: isRetiradaPedido(pedido) ? "Retirada" : "Entrega",
      }));
    });

    if (!termo) return itens;

    return itens.filter((item) => {
      const texto = [
        item.pedidoId,
        item.clienteNome,
        item.clienteTelefone,
        item.produtoNome,
        item.tipoEntrega,
        item.statusInterno,
        ...item.resumoVariacoes.map(
          (variacao) => `${variacao?.nome || ""} ${variacao?.valor || ""}`
        ),
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [pedidos, busca, somentePendentes]);

  const resumo = useMemo(() => {
    const totalItens = itensProducao.reduce(
      (acc, item) => acc + Number(item.quantidade || 0),
      0
    );

    const totalPedidos = new Set(itensProducao.map((item) => item.pedidoId)).size;

    return {
      totalPedidos,
      totalLinhas: itensProducao.length,
      totalItens,
    };
  }, [itensProducao]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
              Painel interno
            </p>
            <h1 className="mt-2 text-3xl font-bold">Ordem de produção</h1>
            <p className="mt-2 text-zinc-600">
              Lista dos produtos em ordem de chegada dos pedidos aprovados.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/#/painel"
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800"
            >
              Voltar ao painel
            </a>

            <button
              type="button"
              onClick={carregarPedidos}
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800"
            >
              Atualizar lista
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Pedidos na fila</p>
            <p className="mt-2 text-3xl font-black">{resumo.totalPedidos}</p>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Linhas de produção</p>
            <p className="mt-2 text-3xl font-black">{resumo.totalLinhas}</p>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Quantidade total</p>
            <p className="mt-2 text-3xl font-black">{resumo.totalItens}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Buscar por pedido, cliente, produto, variação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
          />

          <button
            type="button"
            onClick={() => setSomentePendentes((valor) => !valor)}
            className={`rounded-2xl border px-5 py-3 text-sm font-medium ${
              somentePendentes
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-800"
            }`}
          >
            {somentePendentes ? "Mostrando só pendentes" : "Mostrando todos"}
          </button>
        </div>

        {carregando && (
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm">
            Carregando ordem de produção...
          </div>
        )}

        {!carregando && erro && (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!carregando && !erro && itensProducao.length === 0 && (
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm">
            Nenhum item encontrado na fila de produção.
          </div>
        )}

        {!carregando && !erro && itensProducao.length > 0 && (
          <div className="space-y-4">
            {itensProducao.map((item, index) => (
              <article
                key={item.chave}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                        #{index + 1} na fila
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classePrioridade(
                          item.statusInterno
                        )}`}
                      >
                        {textoPrioridade(item.statusInterno)}
                      </span>

                      <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                        {item.tipoEntrega}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-zinc-900">
                      {item.produtoNome}
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Pedido: <span className="font-semibold">{item.pedidoId}</span>
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      Entrada: {formatarData(item.criadoEm)}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      Cliente: {item.clienteNome}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[320px]">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                        Quantidade
                      </p>
                      <p className="mt-2 text-2xl font-black text-zinc-900">
                        {item.quantidade}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                        Unitário
                      </p>
                      <p className="mt-2 text-base font-bold text-zinc-900">
                        {formatarMoeda(item.valorUnitario)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                        Subtotal
                      </p>
                      <p className="mt-2 text-base font-bold text-zinc-900">
                        {formatarMoeda(item.subtotalItem)}
                      </p>
                    </div>
                  </div>
                </div>

                {item.resumoVariacoes.length > 0 && (
                  <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                    <p className="font-semibold text-zinc-900">Variações</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.resumoVariacoes.map((variacao, i) => (
                        <span
                          key={`${item.chave}-variacao-${i}`}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700"
                        >
                          {variacao?.nome || "Opção"}: {variacao?.valor || "-"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}