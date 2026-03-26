import { useEffect, useMemo, useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function lerResumoPedido() {
  try {
    const bruto = localStorage.getItem("ultimoPedidoAdditiveHub");
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function useQueryParams() {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

export default function PaginaRetornoPagamento({ tipo = "sucesso" }) {
  const params = useQueryParams();
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    setPedido(lerResumoPedido());
  }, []);

  const statusTitulo =
    tipo === "sucesso"
      ? "Pagamento aprovado"
      : tipo === "pendente"
      ? "Pagamento pendente"
      : "Pagamento não concluído";

  const statusDescricao =
    tipo === "sucesso"
      ? "Recebemos o retorno do pagamento. Abaixo está o resumo do pedido."
      : tipo === "pendente"
      ? "O pagamento ainda está em análise ou aguardando confirmação."
      : "O pagamento foi recusado, cancelado ou não foi finalizado.";

  const paymentId = params.get("payment_id") || params.get("collection_id");
  const status = params.get("status") || params.get("collection_status");
  const externalReference = params.get("external_reference");
  const preferenceId = params.get("preference_id");

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
            Additive Hub
          </p>

          <h1 className="mt-3 text-3xl font-bold">{statusTitulo}</h1>
          <p className="mt-2 text-zinc-600">{statusDescricao}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Retorno do Mercado Pago
              </h2>

              <div className="mt-3 space-y-2 text-sm">
                <p><strong>Status:</strong> {status || "-"}</p>
                <p><strong>Payment ID:</strong> {paymentId || "-"}</p>
                <p><strong>Preference ID:</strong> {preferenceId || "-"}</p>
                <p><strong>Referência:</strong> {externalReference || pedido?.pedidoLocalId || "-"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Entrega e total
              </h2>

              <div className="mt-3 space-y-2 text-sm">
                <p><strong>CEP:</strong> {pedido?.cepDestino || "-"}</p>
                <p><strong>Frete:</strong> {pedido?.freteSelecionado?.nome || "-"}</p>
                <p><strong>Prazo:</strong> {pedido?.freteSelecionado?.prazo || "-"}</p>
                <p><strong>Valor do frete:</strong> {formatarMoeda(pedido?.freteSelecionado?.preco || 0)}</p>
                <p><strong>Total:</strong> {formatarMoeda(pedido?.totalComFrete || 0)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Itens do pedido
            </h2>

            <div className="mt-4 space-y-3">
              {pedido?.carrinho?.length ? (
                pedido.carrinho.map((item) => (
                  <div
                    key={item.carrinhoKey || item.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.nome}</p>
                        <p className="text-sm text-zinc-600">
                          Quantidade: {item.quantidade}
                        </p>

                        {item?.resumoVariacoes?.length > 0 && (
                          <div className="mt-2 text-sm text-zinc-600">
                            {item.resumoVariacoes.map((variacao) => (
                              <p key={`${item.id}-${variacao.nome}`}>
                                {variacao.nome}: {variacao.valor}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-base font-bold text-zinc-900">
                        {formatarMoeda((item.preco || 0) * (item.quantidade || 0))}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600">
                  Não foi possível recuperar os itens do pedido neste navegador.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-2xl bg-[#f4b400] px-6 py-3 font-semibold text-black"
            >
              Voltar para a loja
            </a>

            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-2xl border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-800"
            >
              Imprimir resumo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}