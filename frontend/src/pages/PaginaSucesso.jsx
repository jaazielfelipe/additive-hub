import { useEffect, useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PaginaSucesso() {
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get("pedido_id");

    if (!pedidoId) {
      setErro("Pedido não encontrado na URL.");
      setCarregando(false);
      return;
    }

    fetch(`http://localhost:3001/api/pedidos/${pedidoId}`)
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
    return <div style={{ padding: 24 }}>Carregando pedido...</div>;
  }

  if (erro) {
    return <div style={{ padding: 24 }}>Erro: {erro}</div>;
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
          Pedido confirmado
        </p>

        <h1 className="mt-3 text-3xl font-bold">Pagamento aprovado</h1>

        <div className="mt-6 space-y-2 text-sm text-zinc-700">
          <p><strong>Pedido:</strong> {pedido.id}</p>
          <p><strong>Status:</strong> {pedido.status}</p>
          <p><strong>Pagamento:</strong> {pedido.payment_id || "-"}</p>
          <p><strong>Método:</strong> {pedido.metodo_pagamento || "-"}</p>
          <p><strong>CEP:</strong> {pedido.cepDestino || "-"}</p>
          <p><strong>Frete:</strong> {pedido.freteSelecionado?.nome || "-"}</p>
          <p><strong>Valor do frete:</strong> {formatarMoeda(pedido.freteSelecionado?.preco || 0)}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Itens do pedido</h2>

          <div className="mt-4 space-y-3">
            {pedido.carrinho?.map((item) => (
              <div
                key={item.carrinhoKey || item.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <p className="font-semibold">{item.nome}</p>
                <p className="text-sm text-zinc-600">Quantidade: {item.quantidade}</p>
                <p className="text-sm text-zinc-600">
                  Unitário: {formatarMoeda(item.preco)}
                </p>
                <p className="text-sm font-semibold">
                  Subtotal: {formatarMoeda(Number(item.preco || 0) * Number(item.quantidade || 1))}
                </p>

                {item.resumoVariacoes?.length > 0 && (
                  <div className="mt-2 text-sm text-zinc-600">
                    {item.resumoVariacoes.map((v) => (
                      <p key={`${item.id}-${v.nome}`}>
                        {v.nome}: {v.valor}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <a
          href="/"
          className="mt-8 inline-block rounded-2xl bg-[#f4b400] px-6 py-3 font-semibold text-black"
        >
          Voltar para a loja
        </a>
      </div>
    </div>
  );
}