import { useEffect, useMemo, useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarCep(valor) {
  const numeros = String(valor || "").replace(/\D/g, "").slice(0, 8);
  if (numeros.length <= 5) return numeros;
  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

export default function Carrinho() {
  const [carrinho, setCarrinho] = useState([]);
  const [cepDestino, setCepDestino] = useState("");
  const [fretes, setFretes] = useState([]);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [carregandoFrete, setCarregandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState("");
  const [freteCalculado, setFreteCalculado] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const apiFreteUrl =
    import.meta.env.VITE_FRETE_API_URL || `${apiBaseUrl}/api/frete`;

  const MODO_TESTE_SEM_FRETE =
    import.meta.env.VITE_MODO_TESTE_SEM_FRETE === "true";

  useEffect(() => {
    try {
      const carrinhoSalvo = localStorage.getItem("carrinhoAdditiveHub");
      const cepSalvo = localStorage.getItem("cepDestinoAdditiveHub");
      const freteSelecionadoSalvo = localStorage.getItem(
        "freteSelecionadoAdditiveHub"
      );
      const fretesSalvos = localStorage.getItem("fretesAdditiveHub");

      if (carrinhoSalvo) {
        const carrinhoParseado = JSON.parse(carrinhoSalvo);
        if (Array.isArray(carrinhoParseado)) {
          setCarrinho(carrinhoParseado);
        }
      }

      if (cepSalvo) {
        setCepDestino(cepSalvo);
      }

      if (fretesSalvos) {
        const listaFretes = JSON.parse(fretesSalvos);
        if (Array.isArray(listaFretes)) {
          setFretes(listaFretes);
          setFreteCalculado(listaFretes.length > 0);
        }
      }

      if (freteSelecionadoSalvo) {
        setFreteSelecionado(JSON.parse(freteSelecionadoSalvo));
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho do localStorage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cepDestinoAdditiveHub", cepDestino);
  }, [cepDestino]);

  useEffect(() => {
    if (freteSelecionado) {
      localStorage.setItem(
        "freteSelecionadoAdditiveHub",
        JSON.stringify(freteSelecionado)
      );
    } else {
      localStorage.removeItem("freteSelecionadoAdditiveHub");
    }
  }, [freteSelecionado]);

  useEffect(() => {
    if (fretes.length > 0) {
      localStorage.setItem("fretesAdditiveHub", JSON.stringify(fretes));
    } else {
      localStorage.removeItem("fretesAdditiveHub");
    }
  }, [fretes]);

  const totalItensCarrinho = useMemo(() => {
    return carrinho.reduce(
      (total, item) => total + Number(item.quantidade || 0),
      0
    );
  }, [carrinho]);

  const subtotalProdutos = useMemo(() => {
    return carrinho.reduce(
      (total, item) =>
        total + Number(item.preco || 0) * Number(item.quantidade || 0),
      0
    );
  }, [carrinho]);

  const totalComFrete = subtotalProdutos + Number(freteSelecionado?.preco || 0);

  const extrairOpcoesFrete = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.shipping_services)) return payload.shipping_services;
    if (Array.isArray(payload?.services)) return payload.services;
    return [];
  };

  const obterPrecoFrete = (opcao) =>
    Number(opcao?.price ?? opcao?.custom_price ?? opcao?.total_price ?? 0);

  const mapearPacoteFrete = (opcao) => {
    const pacote = Array.isArray(opcao?.packages) ? opcao.packages[0] : null;

    if (!pacote) return null;

    return {
      format: pacote?.format || "box",
      height: Number(pacote?.dimensions?.height || 0),
      width: Number(pacote?.dimensions?.width || 0),
      length: Number(pacote?.dimensions?.length || 0),
      weight: Number(pacote?.weight || 0),
      insurance_value: Number(pacote?.insurance_value || 0),
      price: Number(pacote?.price || 0),
      discount: Number(pacote?.discount || 0),
    };
  };

  const mapearOpcaoFrete = (opcao, index, recomendado = false) => {
    const nome =
      opcao.name ||
      opcao.service_description ||
      opcao.service ||
      opcao.company?.name ||
      `Opção ${index + 1}`;

    const prazoBruto =
      opcao.delivery_time ??
      opcao.delivery_range?.max ??
      opcao.delivery_range?.days ??
      opcao.delivery_days ??
      opcao.days ??
      opcao.prazo ??
      "-";

    return {
      chave: `${nome}-${index}`,
      nome,
      preco: obterPrecoFrete(opcao),
      prazo:
        typeof prazoBruto === "number" ? `${prazoBruto} dia(s)` : String(prazoBruto),
      recomendado,
      service: Number(opcao?.id || 0),
      package: mapearPacoteFrete(opcao),
      company: opcao?.company || null,
      additional_services: opcao?.additional_services || null,
      delivery_time: Number(opcao?.delivery_time || 0),
      delivery_range: opcao?.delivery_range || null,
      original: opcao,
    };
  };

  const invalidarFrete = () => {
    setFreteSelecionado(null);
    setFretes([]);
    setFreteCalculado(false);
    setErroFrete("");
    localStorage.removeItem("freteSelecionadoAdditiveHub");
    localStorage.removeItem("fretesAdditiveHub");
  };

  const calcularFrete = async () => {
    try {
      setErroFrete("");
      setFretes([]);
      setFreteSelecionado(null);
      setFreteCalculado(false);

      if (MODO_TESTE_SEM_FRETE) {
        const freteTeste = {
          chave: "frete-teste",
          nome: "Frete fixo de teste",
          preco: 0,
          prazo: "Teste",
          recomendado: true,
          service: 0,
          package: null,
          company: null,
          additional_services: null,
          delivery_time: 0,
          delivery_range: null,
          original: null,
        };

        setFretes([freteTeste]);
        setFreteSelecionado(freteTeste);
        setFreteCalculado(true);
        return;
      }

      const cepLimpo = cepDestino.replace(/\D/g, "");

      if (cepLimpo.length !== 8) {
        setErroFrete("Digite um CEP válido com 8 números.");
        return;
      }

      if (carrinho.length === 0) {
        setErroFrete("Seu carrinho está vazio.");
        return;
      }

      setCarregandoFrete(true);

      const response = await fetch(apiFreteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cepDestino: cepLimpo,
          carrinho,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const mensagemErro =
          data?.error ||
          data?.message ||
          data?.details?.message ||
          "Não foi possível calcular o frete.";

        setErroFrete(mensagemErro);
        return;
      }

      const opcoesBrutas = extrairOpcoesFrete(data);

      if (!Array.isArray(opcoesBrutas) || opcoesBrutas.length === 0) {
        setErroFrete("Nenhuma opção de frete encontrada para esse CEP.");
        return;
      }

      const opcoesOrdenadas = [...opcoesBrutas]
        .filter((opcao) => !opcao?.has_error)
        .sort((a, b) => obterPrecoFrete(a) - obterPrecoFrete(b));

      const opcoes = opcoesOrdenadas.map((opcao, index) =>
        mapearOpcaoFrete(opcao, index, index === 0)
      );

      if (opcoes.length === 0) {
        setErroFrete("Nenhuma opção de frete válida encontrada para esse CEP.");
        return;
      }

      setFretes(opcoes);
      setFreteSelecionado(opcoes[0] || null);
      setFreteCalculado(true);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      setErroFrete("Erro ao calcular frete.");
      setFreteCalculado(false);
    } finally {
      setCarregandoFrete(false);
    }
  };

  const aumentarQuantidade = (itemCarrinho) => {
    const atualizado = carrinho.map((item) =>
      item.carrinhoKey === itemCarrinho.carrinhoKey
        ? { ...item, quantidade: Number(item.quantidade || 0) + 1 }
        : item
    );

    setCarrinho(atualizado);
    localStorage.setItem("carrinhoAdditiveHub", JSON.stringify(atualizado));
    invalidarFrete();
  };

  const diminuirQuantidade = (itemCarrinho) => {
    const atualizado = carrinho
      .map((item) =>
        item.carrinhoKey === itemCarrinho.carrinhoKey
          ? { ...item, quantidade: Number(item.quantidade || 0) - 1 }
          : item
      )
      .filter((item) => Number(item.quantidade || 0) > 0);

    setCarrinho(atualizado);
    localStorage.setItem("carrinhoAdditiveHub", JSON.stringify(atualizado));
    invalidarFrete();
  };

  const irParaCheckout = () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    if (!freteCalculado || !freteSelecionado) {
      alert("Clique em calcular frete antes de continuar.");
      return;
    }

    if (!MODO_TESTE_SEM_FRETE) {
      if (!freteSelecionado?.service || !freteSelecionado?.package) {
        alert(
          "A opção de frete selecionada está incompleta. Calcule novamente o frete."
        );
        return;
      }
    }

    window.location.href = "/#/checkout";
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
            Carrinho
          </p>
          <h1 className="mt-2 text-3xl font-bold">Seu carrinho</h1>
          <p className="mt-2 text-zinc-600">
            Revise os itens e calcule o frete antes de continuar.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Itens do carrinho</h2>

              {carrinho.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6">
                  <p className="font-semibold text-zinc-800">Seu carrinho está vazio.</p>
                  <a
                    href="/#/"
                    className="mt-4 inline-flex rounded-2xl bg-[#f4b400] px-5 py-3 font-semibold text-black"
                  >
                    Voltar para a loja
                  </a>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {carrinho.map((item) => (
                    <div
                      key={item.carrinhoKey || item.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-base font-bold text-zinc-900">{item.nome}</p>
                          <p className="mt-1 text-sm text-zinc-600">
                            {formatarMoeda(item.preco)} cada
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

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => diminuirQuantidade(item)}
                            className="h-9 w-9 rounded-xl border border-zinc-300 bg-white text-lg font-bold"
                          >
                            −
                          </button>

                          <span className="min-w-[24px] text-center font-semibold">
                            {item.quantidade}
                          </span>

                          <button
                            type="button"
                            onClick={() => aumentarQuantidade(item)}
                            className="h-9 w-9 rounded-xl border border-zinc-300 bg-white text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Entrega</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Informe o CEP para calcular o frete.
              </p>

              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  placeholder="CEP"
                  value={cepDestino}
                  onChange={(e) => {
                    setCepDestino(formatarCep(e.target.value));
                    invalidarFrete();
                  }}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />

                <button
                  type="button"
                  onClick={calcularFrete}
                  disabled={carregandoFrete || carrinho.length === 0}
                  className="rounded-xl bg-[#f4b400] px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregandoFrete ? "Calculando..." : "Calcular frete"}
                </button>
              </div>

              {erroFrete && (
                <p className="mt-3 text-sm font-medium text-red-600">{erroFrete}</p>
              )}

              {fretes.length > 0 && (
                <div className="mt-4 space-y-3">
                  {fretes.map((opcao) => (
                    <button
                      key={opcao.chave}
                      type="button"
                      onClick={() => {
                        setFreteSelecionado(opcao);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${
                        freteSelecionado?.chave === opcao.chave
                          ? "border-[#f4b400] bg-[#fff6db] shadow-md ring-1 ring-[#f4b400]/40"
                          : opcao.recomendado
                          ? "border-[#f4b400] bg-[#fffaf0] hover:bg-[#fff6db] hover:shadow-md hover:-translate-y-[1px]"
                          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-zinc-900">{opcao.nome}</p>

                          {freteSelecionado?.chave === opcao.chave && (
                            <span className="inline-flex items-center rounded-full bg-[#f4b400] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-black shadow-sm">
                              ✓ Selecionado
                            </span>
                          )}

                          {opcao.recomendado && freteSelecionado?.chave !== opcao.chave && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#f4b400] bg-[#fff3c4] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#b38200] shadow-sm">
                              <span aria-hidden="true">⭐</span>
                              Recomendado
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-zinc-600">
                          Prazo: {opcao.prazo}
                        </p>

                        {opcao?.company?.name ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            Transportadora: {opcao.company.name}
                          </p>
                        ) : null}
                      </div>

                      <p className="font-bold text-zinc-900">
                        {formatarMoeda(opcao.preco)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Resumo do pedido</h2>

            <div className="mt-5 space-y-3 text-sm text-zinc-700">
              <div className="flex items-center justify-between gap-3">
                <span>Itens</span>
                <span className="font-semibold">{totalItensCarrinho}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Subtotal</span>
                <span className="font-semibold">{formatarMoeda(subtotalProdutos)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Frete</span>
                <span className="font-semibold">
                  {formatarMoeda(freteSelecionado?.preco || 0)}
                </span>
              </div>

              <div className="border-t border-zinc-200 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-bold text-zinc-900">Total</span>
                  <span className="text-lg font-black text-zinc-900">
                    {formatarMoeda(totalComFrete)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={irParaCheckout}
              disabled={!freteCalculado || !freteSelecionado || carrinho.length === 0}
              className="mt-6 w-full rounded-2xl bg-[#f4b400] px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              Ir para checkout
            </button>

            {!freteCalculado && carrinho.length > 0 && (
              <p className="mt-2 text-sm text-red-600">
                Clique em “Calcular frete” para continuar.
              </p>
            )}

            {freteCalculado && !freteSelecionado && carrinho.length > 0 && (
              <p className="mt-2 text-sm text-red-600">
                Selecione uma opção de frete para continuar.
              </p>
            )}

            <a
              href="/#/"
              className="mt-3 block w-full rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-center font-medium text-zinc-800"
            >
              Continuar comprando
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}