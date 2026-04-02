import { useEffect, useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function limparDadosPosCompra() {
  try {
    localStorage.removeItem("ultimoPedidoAdditiveHub");
    localStorage.removeItem("carrinhoAdditiveHub");
    localStorage.removeItem("dadosClienteAdditiveHub");
    localStorage.removeItem("freteSelecionadoAdditiveHub");
    localStorage.removeItem("fretesAdditiveHub");
    localStorage.removeItem("cepDestinoAdditiveHub");
    localStorage.removeItem("sessionIdAdditiveHub");
  } catch (error) {
    console.error("Erro ao limpar dados pós-compra:", error);
  }
}

export default function PaginaSucesso() {
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    limparDadosPosCompra();

    const hash = window.location.hash || "";
    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(queryString);
    const pedidoId = params.get("pedido_id");

    if (!pedidoId) {
      setErro("Pedido não encontrado na URL.");
      setCarregando(false);
      return;
    }

    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

    fetch(`${apiBaseUrl}/api/pedidos/publico/${pedidoId}`)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao buscar pedido.");
        }

        setPedido(data);
      })
      .catch((err) => {
        setErro(err.message || "Erro ao carregar pedido.");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] px-4 py-10 text-zinc-900">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
            Additive Hub
          </p>
          <h1 className="mt-3 text-3xl font-bold">Carregando pedido...</h1>
          <p className="mt-2 text-zinc-600">
            Estamos buscando as informações do seu pagamento.
          </p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] px-4 py-10 text-zinc-900">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
            Additive Hub
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            Não foi possível carregar o pedido
          </h1>
          <p className="mt-2 text-zinc-600">Erro: {erro}</p>

          <a
            href="/#/"
            className="mt-6 inline-flex rounded-2xl bg-[#f4b400] px-6 py-3 font-semibold text-black"
          >
            Voltar para a loja
          </a>
        </div>
      </div>
    );
  }

  const totalProdutos =
    pedido?.subtotalProdutos ??
    pedido?.carrinho?.reduce(
      (acc, item) =>
        acc + Number(item.preco || 0) * Number(item.quantidade || 0),
      0
    ) ??
    0;

  const valorFrete = Number(pedido?.freteSelecionado?.preco || 0);
  const descontoCupom = Number(pedido?.descontoCupom || 0);
  const totalFinal =
    pedido?.totalComFrete ?? totalProdutos + valorFrete - descontoCupom;

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
                Pedido confirmado
              </p>
              <h1 className="mt-2 text-3xl font-bold">Pagamento aprovado</h1>
              <p className="mt-2 max-w-2xl text-zinc-600">
                Recebemos seu pagamento com sucesso. Abaixo estão os detalhes do
                seu pedido.
              </p>
            </div>

            <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              Aprovado
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Número do pedido
              </p>
              <p className="mt-2 break-all text-sm font-bold text-zinc-900">
                {pedido?.pedidoLocalId || pedido?.id || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Pagamento
              </p>
              <p className="mt-2 text-sm font-bold text-zinc-900">
                {pedido?.metodo_pagamento || "Mercado Pago"}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                ID: {pedido?.payment_id || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Entrega
              </p>
              <p className="mt-2 text-sm font-bold text-zinc-900">
                {pedido?.freteSelecionado?.nome || "Frete não informado"}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Prazo: {pedido?.freteSelecionado?.prazo || "-"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
              <h2 className="text-xl font-bold">Itens do pedido</h2>

              <div className="mt-5 space-y-4">
                {pedido?.carrinho?.map((item) => (
                  <div
                    key={item.carrinhoKey || item.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-base font-bold text-zinc-900">
                          {item.nome}
                        </p>

                        <div className="mt-2 space-y-1 text-sm text-zinc-600">
                          <p>Quantidade: {item.quantidade}</p>
                          <p>Preço unitário: {formatarMoeda(item.preco)}</p>
                        </div>

                        {item?.resumoVariacoes?.length > 0 && (
                          <div className="mt-3 space-y-1 text-sm text-zinc-600">
                            {item.resumoVariacoes.map((v, index) => (
                              <p key={`${item.id}-${v.nome}-${index}`}>
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
                            Number(item.preco || 0) *
                              Number(item.quantidade || 1)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
              <h2 className="text-xl font-bold">Resumo</h2>

              <div className="mt-5 space-y-3 text-sm text-zinc-700">
                <div className="flex items-center justify-between gap-3">
                  <span>Itens</span>
                  <span className="font-semibold">
                    {pedido?.totalItensCarrinho || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    {formatarMoeda(totalProdutos)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span>Frete</span>
                  <span className="font-semibold">
                    {formatarMoeda(valorFrete)}
                  </span>
                </div>

                {descontoCupom > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <span>Desconto</span>
                    <span className="font-semibold text-green-700">
                      - {formatarMoeda(descontoCupom)}
                    </span>
                  </div>
                )}

                <div className="border-t border-zinc-200 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-zinc-900">
                      Total pago
                    </span>
                    <span className="text-lg font-black text-zinc-900">
                      {formatarMoeda(totalFinal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <a
                  href="/#/"
                  className="block w-full rounded-2xl bg-[#f4b400] px-5 py-3 text-center font-semibold text-black"
                >
                  Voltar para a loja
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="block w-full rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-center font-medium text-zinc-800"
                >
                  Imprimir comprovante
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}