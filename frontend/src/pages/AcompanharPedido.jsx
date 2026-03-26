import { useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function formatarCPF(valor) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (!numeros) return "";

  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return numeros.replace(/^(\d{3})(\d+)/, "$1.$2");
  if (numeros.length <= 9) {
    return numeros.replace(/^(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }

  return numeros.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
}

function identificarTipoBusca(valor) {
  const texto = String(valor || "").trim();

  if (!texto) return null;

  if (texto.includes("@")) {
    return "email";
  }

  const numeros = somenteNumeros(texto);

  if (/^[\d.\-]+$/.test(texto) && numeros.length === 11) {
    return "cpf";
  }

  return "pedido";
}

function normalizarValorBusca(valor, tipo) {
  if (tipo === "cpf") return somenteNumeros(valor);
  if (tipo === "email") return String(valor || "").trim().toLowerCase();
  return String(valor || "").trim();
}

function obterMensagemTipo(valor) {
  const texto = String(valor || "").trim();

  if (!texto) return "";

  if (texto.includes("@")) {
    return "Busca identificada: e-mail";
  }

  const numeros = somenteNumeros(texto);

  if (/^[\d.\-]+$/.test(texto) && numeros.length > 0 && numeros.length < 11) {
    return "Digite o CPF completo ou continue informando o número do pedido.";
  }

  if (/^[\d.\-]+$/.test(texto) && numeros.length === 11) {
    return "Busca identificada: CPF";
  }

  return "Busca identificada: número do pedido";
}

export default function AcompanharPedido() {
  const [busca, setBusca] = useState("");
  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagemAjuda, setMensagemAjuda] = useState("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const handleBuscaChange = (e) => {
    let valor = e.target.value;

    const contemArroba = valor.includes("@");
    const apenasDigitosMascara = /^[\d.\-]*$/.test(valor);
    const numeros = somenteNumeros(valor);

    if (!contemArroba && apenasDigitosMascara && numeros.length <= 11) {
      valor = formatarCPF(valor);
    }

    setBusca(valor);
    setMensagemAjuda(obterMensagemTipo(valor));
  };

  const buscarPedido = async (e) => {
    e.preventDefault();

    setErro("");
    setPedido(null);

    const valorDigitado = busca.trim();

    if (!valorDigitado) {
      setErro("Digite CPF, número do pedido ou e-mail.");
      return;
    }

    const tipo = identificarTipoBusca(valorDigitado);

    if (!tipo) {
      setErro("Informe um CPF, número do pedido ou e-mail válido.");
      return;
    }

    const valorNormalizado = normalizarValorBusca(valorDigitado, tipo);

    if (tipo === "cpf" && valorNormalizado.length !== 11) {
      setErro("Digite um CPF válido com 11 números.");
      return;
    }

    try {
      setCarregando(true);

      const params = new URLSearchParams({
        tipo,
        valor: valorNormalizado,
      });

      // compatibilidade com possíveis regras antigas do backend
      if (tipo === "pedido") {
        params.append("id", valorNormalizado);
      }

      if (tipo === "email") {
        params.append("email", valorNormalizado);
      }

      if (tipo === "cpf") {
        params.append("cpf", valorNormalizado);
      }

      const response = await fetch(
        `${apiBaseUrl}/api/pedidos/acompanhar?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível localizar o pedido.");
      }

      setPedido(data);
    } catch (error) {
      setErro(error.message || "Erro ao buscar pedido.");
    } finally {
      setCarregando(false);
    }
  };

  const totalProdutos =
    pedido?.subtotalProdutos ??
    pedido?.carrinho?.reduce(
      (acc, item) => acc + Number(item.preco || 0) * Number(item.quantidade || 0),
      0
    ) ??
    0;

  const valorFrete = Number(pedido?.freteSelecionado?.preco || 0);
  const totalFinal = pedido?.totalComFrete ?? totalProdutos + valorFrete;

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
            Acompanhar pedido
          </p>

          <h1 className="mt-2 text-3xl font-bold">Consulte seu pedido</h1>

          <p className="mt-2 text-zinc-600">
            Informe o CPF, número do pedido ou e-mail usado na compra.
          </p>

          <form
            onSubmit={buscarPedido}
            className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]"
          >
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="Digite CPF, número do pedido ou e-mail"
                value={busca}
                onChange={handleBuscaChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              />

              <span className="mt-2 min-h-[20px] text-xs text-zinc-500">
                {mensagemAjuda}
              </span>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="h-fit rounded-xl bg-[#f4b400] px-5 py-3 font-semibold text-black disabled:opacity-60"
            >
              {carregando ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {erro && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {erro}
            </div>
          )}

          {pedido && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Detalhes do pedido</h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      Pedido: <span className="font-semibold text-zinc-900">{pedido.id}</span>
                    </p>
                  </div>

                  <div
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                      pedido.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : pedido.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {pedido.status === "approved"
                      ? "Aprovado"
                      : pedido.status === "pending"
                      ? "Pendente"
                      : "Não concluído"}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Cliente
                    </p>
                    <p className="mt-2 font-bold text-zinc-900">
                      {pedido?.dadosCliente?.nome || "-"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {pedido?.dadosCliente?.email || "-"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {pedido?.dadosCliente?.telefone || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Entrega
                    </p>
                    <p className="mt-2 font-bold text-zinc-900">
                      {pedido?.freteSelecionado?.nome || "-"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Prazo: {pedido?.freteSelecionado?.prazo || "-"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      CEP: {pedido?.cepDestino || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {pedido?.carrinho?.map((item) => (
                    <div
                      key={item.carrinhoKey || item.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-base font-bold text-zinc-900">{item.nome}</p>

                          <p className="mt-2 text-sm text-zinc-600">
                            Quantidade: {item.quantidade}
                          </p>

                          <p className="mt-1 text-sm text-zinc-600">
                            Preço unitário: {formatarMoeda(item.preco)}
                          </p>

                          {item?.resumoVariacoes?.length > 0 && (
                            <div className="mt-2 text-sm text-zinc-600">
                              {item.resumoVariacoes.map((v) => (
                                <p key={`${item.id}-${v.nome}`}>
                                  {v.nome}: {v.valor}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Subtotal
                          </p>
                          <p className="mt-1 text-lg font-bold text-zinc-900">
                            {formatarMoeda(
                              Number(item.preco || 0) * Number(item.quantidade || 1)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="h-fit rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
                <h2 className="text-xl font-bold">Resumo</h2>

                <div className="mt-5 space-y-3 text-sm text-zinc-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Status</span>
                    <span className="font-semibold">{pedido?.status || "-"}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span>Pagamento</span>
                    <span className="font-semibold">
                      {pedido?.metodo_pagamento || "Mercado Pago"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatarMoeda(totalProdutos)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span>Frete</span>
                    <span className="font-semibold">{formatarMoeda(valorFrete)}</span>
                  </div>

                  <div className="border-t border-zinc-200 pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-bold text-zinc-900">Total</span>
                      <span className="text-lg font-black text-zinc-900">
                        {formatarMoeda(totalFinal)}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href="/#/"
                  className="mt-6 block w-full rounded-2xl bg-[#f4b400] px-5 py-3 text-center font-semibold text-black"
                >
                  Voltar para a loja
                </a>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}