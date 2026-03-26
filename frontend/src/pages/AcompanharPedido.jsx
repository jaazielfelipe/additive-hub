import { useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AcompanharPedido() {
  const [numeroPedido, setNumeroPedido] = useState("");
  const [email, setEmail] = useState("");
  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const buscarPedido = async (e) => {
    e.preventDefault();

    setErro("");
    setPedido(null);

    if (!numeroPedido.trim()) {
      setErro("Digite o número do pedido.");
      return;
    }

    if (!email.trim()) {
      setErro("Digite o e-mail.");
      return;
    }

    try {
      setCarregando(true);

      const params = new URLSearchParams({
        id: numeroPedido.trim(),
        email: email.trim(),
      });

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
            Informe o número do pedido e o e-mail usado na compra.
          </p>

          <form onSubmit={buscarPedido} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              placeholder="Número do pedido"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
            />

            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
            />

            <button
              type="submit"
              disabled={carregando}
              className="rounded-xl bg-[#f4b400] px-5 py-3 font-semibold text-black disabled:opacity-60"
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