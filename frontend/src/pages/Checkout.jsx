import { useEffect, useMemo, useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarCPF(valor) {
  const numeros = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
    6,
    9
  )}-${numeros.slice(9, 11)}`;
}

function validarCPF(cpf) {
  const cpfLimpo = String(cpf || "").replace(/\D/g, "");

  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(cpfLimpo[i]) * (10 - i);
  }

  let digito1 = (soma * 10) % 11;
  if (digito1 === 10) digito1 = 0;
  if (digito1 !== Number(cpfLimpo[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(cpfLimpo[i]) * (11 - i);
  }

  let digito2 = (soma * 10) % 11;
  if (digito2 === 10) digito2 = 0;

  return digito2 === Number(cpfLimpo[10]);
}

function formatarTelefone(valor) {
  const numeros = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numeros.length === 0) return "";
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
    7,
    11
  )}`;
}

function validarCelular(valor) {
  const numeros = String(valor || "").replace(/\D/g, "");

  if (numeros.length !== 11) return false;

  const ddd = Number(numeros.slice(0, 2));
  const primeiroDigitoCelular = numeros[2];

  if (ddd < 11 || ddd > 99) return false;
  if (primeiroDigitoCelular !== "9") return false;

  return true;
}

function validarEmail(email) {
  const valor = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

function validarNomeCompleto(nome) {
  const valor = String(nome || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!valor) return false;

  const partes = valor.split(" ").filter(Boolean);
  if (partes.length < 2) return false;

  return partes.every((parte) => parte.length >= 2);
}

function formatarCep(valor) {
  const numeros = String(valor || "").replace(/\D/g, "").slice(0, 8);
  if (numeros.length <= 5) return numeros;
  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

export default function Checkout() {
  const [carrinho, setCarrinho] = useState([]);
  const [dadosCliente, setDadosCliente] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
  });

  const [camposTocados, setCamposTocados] = useState({
    nome: false,
    email: false,
    telefone: false,
    cpf: false,
  });

  const [cepDestino, setCepDestino] = useState("");
  const [fretes, setFretes] = useState([]);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [carregandoFrete, setCarregandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState("");
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const apiFreteUrl =
    import.meta.env.VITE_FRETE_API_URL || `${apiBaseUrl}/api/frete`;
  const apiPagamentoUrl =
    import.meta.env.VITE_PAGAMENTO_API_URL ||
    `${apiBaseUrl}/api/pagamentos/criar-preferencia`;

  const MODO_TESTE_SEM_FRETE =
    import.meta.env.VITE_MODO_TESTE_SEM_FRETE === "true";

  useEffect(() => {
    try {
      const carrinhoSalvo = localStorage.getItem("carrinhoAdditiveHub");
      const dadosClienteSalvos = localStorage.getItem("dadosClienteAdditiveHub");
      const cepSalvo = localStorage.getItem("cepDestinoAdditiveHub");
      const freteSalvo = localStorage.getItem("freteSelecionadoAdditiveHub");

      if (carrinhoSalvo) {
        setCarrinho(JSON.parse(carrinhoSalvo));
      }

      if (dadosClienteSalvos) {
        const dados = JSON.parse(dadosClienteSalvos);

        setDadosCliente({
          nome: dados?.nome || "",
          email: dados?.email || "",
          telefone: formatarTelefone(dados?.telefone || ""),
          cpf: formatarCPF(dados?.cpf || ""),
        });
      }

      if (cepSalvo) {
        setCepDestino(cepSalvo);
      }

      if (freteSalvo) {
        setFreteSelecionado(JSON.parse(freteSalvo));
      }
    } catch (error) {
      console.error("Erro ao carregar checkout do localStorage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dadosClienteAdditiveHub", JSON.stringify(dadosCliente));
  }, [dadosCliente]);

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

  const totalItensCarrinho = useMemo(() => {
    return carrinho.reduce((total, item) => total + Number(item.quantidade || 0), 0);
  }, [carrinho]);

  const subtotalProdutos = useMemo(() => {
    return carrinho.reduce(
      (total, item) =>
        total + Number(item.preco || 0) * Number(item.quantidade || 0),
      0
    );
  }, [carrinho]);

  const totalComFrete = subtotalProdutos + Number(freteSelecionado?.preco || 0);

  const obterErroCampo = (campo, valor) => {
    const valorTexto = String(valor || "").trim();

    if (campo === "nome") {
      if (!valorTexto) return "Nome completo é obrigatório.";
      if (!validarNomeCompleto(valorTexto)) {
        return "Digite nome e sobrenome.";
      }
      return "";
    }

    if (campo === "email") {
      if (!valorTexto) return "E-mail é obrigatório.";
      if (!validarEmail(valorTexto)) {
        return "Digite um e-mail válido. Ex.: nome@dominio.com";
      }
      return "";
    }

    if (campo === "telefone") {
      if (!valorTexto) return "Telefone/WhatsApp é obrigatório.";
      if (!validarCelular(valorTexto)) {
        return "Digite um celular válido no padrão (11) 99999-9999.";
      }
      return "";
    }

    if (campo === "cpf") {
      if (!valorTexto) return "CPF é obrigatório.";
      if (!validarCPF(valorTexto)) {
        return "Digite um CPF válido.";
      }
      return "";
    }

    return "";
  };

  const errosCampos = useMemo(() => {
    return {
      nome: obterErroCampo("nome", dadosCliente.nome),
      email: obterErroCampo("email", dadosCliente.email),
      telefone: obterErroCampo("telefone", dadosCliente.telefone),
      cpf: obterErroCampo("cpf", dadosCliente.cpf),
    };
  }, [dadosCliente]);

  const formularioValido = useMemo(() => {
    return (
      !errosCampos.nome &&
      !errosCampos.email &&
      !errosCampos.telefone &&
      !errosCampos.cpf
    );
  }, [errosCampos]);

  const podePagar = useMemo(() => {
    return (
      formularioValido &&
      carrinho.length > 0 &&
      !!freteSelecionado &&
      fretes.length > 0 &&
      !carregandoPagamento
    );
  }, [
    formularioValido,
    carrinho.length,
    freteSelecionado,
    fretes.length,
    carregandoPagamento,
  ]);

  const atualizarDadosCliente = (campo, valor) => {
    let valorFormatado = valor;

    if (campo === "telefone") {
      valorFormatado = formatarTelefone(valor);
    }

    if (campo === "cpf") {
      valorFormatado = formatarCPF(valor);
    }

    if (campo === "nome") {
      valorFormatado = valor.replace(/\s+/g, " ");
    }

    setDadosCliente((anterior) => ({
      ...anterior,
      [campo]: valorFormatado,
    }));
  };

  const marcarCampoComoTocado = (campo) => {
    setCamposTocados((anterior) => ({
      ...anterior,
      [campo]: true,
    }));
  };

  const marcarTodosCamposComoTocados = () => {
    setCamposTocados({
      nome: true,
      email: true,
      telefone: true,
      cpf: true,
    });
  };

  const dadosClienteValidos = () => {
    if (errosCampos.nome) return errosCampos.nome;
    if (errosCampos.email) return errosCampos.email;
    if (errosCampos.telefone) return errosCampos.telefone;
    if (errosCampos.cpf) return errosCampos.cpf;
    return "";
  };

  const extrairOpcoesFrete = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.shipping_services)) return payload.shipping_services;
    if (Array.isArray(payload?.services)) return payload.services;
    return [];
  };

  const obterPrecoFrete = (opcao) =>
    Number(opcao?.price ?? opcao?.custom_price ?? opcao?.total_price ?? 0);

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
    };
  };

  const calcularFrete = async () => {
    try {
      setErroFrete("");
      setFretes([]);
      setFreteSelecionado(null);

      if (MODO_TESTE_SEM_FRETE) {
        const freteTeste = {
          chave: "frete-teste",
          nome: "Frete fixo de teste",
          preco: 0,
          prazo: "Teste",
          recomendado: true,
        };

        setFretes([freteTeste]);
        setFreteSelecionado(freteTeste);
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

      const opcoesOrdenadas = opcoesBrutas.sort(
        (a, b) => obterPrecoFrete(a) - obterPrecoFrete(b)
      );

      const opcoes = opcoesOrdenadas.map((opcao, index) =>
        mapearOpcaoFrete(opcao, index, index === 0)
      );

      setFretes(opcoes);
      setFreteSelecionado(opcoes[0] || null);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      setErroFrete("Erro ao calcular frete.");
    } finally {
      setCarregandoFrete(false);
    }
  };

  const finalizarPedidoMercadoPago = async () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    marcarTodosCamposComoTocados();

    const erroDadosCliente = dadosClienteValidos();

    if (erroDadosCliente) {
      alert(erroDadosCliente);
      return;
    }

    if (!freteSelecionado || fretes.length === 0) {
      alert("Calcule e selecione um frete antes de continuar.");
      return;
    }

    try {
      setCarregandoPagamento(true);

      const pedidoLocalId = `ADD-${Date.now()}`;

      const resumoPedido = {
        pedidoLocalId,
        criadoEm: new Date().toISOString(),
        dadosCliente: {
          ...dadosCliente,
          nome: dadosCliente.nome.trim().replace(/\s+/g, " "),
          email: dadosCliente.email.trim(),
          telefone: dadosCliente.telefone.replace(/\D/g, ""),
          cpf: dadosCliente.cpf.replace(/\D/g, ""),
        },
        carrinho,
        cepDestino: cepDestino.replace(/\D/g, ""),
        freteSelecionado,
        totalItensCarrinho,
        subtotalProdutos,
        totalComFrete,
      };

      localStorage.setItem(
        "ultimoPedidoAdditiveHub",
        JSON.stringify(resumoPedido)
      );

      const response = await fetch(apiPagamentoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resumoPedido),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Não foi possível iniciar o pagamento."
        );
      }

      if (data?.initPoint) {
        window.location.href = data.initPoint;
        return;
      }

      throw new Error("Erro ao iniciar pagamento.");
    } catch (error) {
      console.error("Erro pagamento:", error);
      alert(error.message);
    } finally {
      setCarregandoPagamento(false);
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
    setFreteSelecionado(null);
    setFretes([]);
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
    setFreteSelecionado(null);
    setFretes([]);
  };

  const classeInput = (campo) =>
    `w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-black ${
      camposTocados[campo] && errosCampos[campo]
        ? "border-red-500 bg-red-50"
        : "border-zinc-300"
    }`;

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
            Checkout
          </p>
          <h1 className="mt-2 text-3xl font-bold">Finalizar pedido</h1>
          <p className="mt-2 text-zinc-600">
            Revise os itens, preencha seus dados e conclua o pagamento.
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
              <h2 className="text-xl font-bold">Dados do comprador</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Preencha para concluir seu pedido.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={dadosCliente.nome}
                    onChange={(e) => atualizarDadosCliente("nome", e.target.value)}
                    onBlur={() => marcarCampoComoTocado("nome")}
                    className={classeInput("nome")}
                  />
                  {camposTocados.nome && errosCampos.nome && (
                    <p className="mt-1 text-sm text-red-600">{errosCampos.nome}</p>
                  )}
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={dadosCliente.email}
                    onChange={(e) => atualizarDadosCliente("email", e.target.value)}
                    onBlur={() => marcarCampoComoTocado("email")}
                    className={classeInput("email")}
                  />
                  {camposTocados.email && errosCampos.email && (
                    <p className="mt-1 text-sm text-red-600">{errosCampos.email}</p>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Telefone / WhatsApp"
                    value={dadosCliente.telefone}
                    onChange={(e) => atualizarDadosCliente("telefone", e.target.value)}
                    onBlur={() => marcarCampoComoTocado("telefone")}
                    className={classeInput("telefone")}
                  />
                  {camposTocados.telefone && errosCampos.telefone && (
                    <p className="mt-1 text-sm text-red-600">{errosCampos.telefone}</p>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="CPF"
                    value={dadosCliente.cpf}
                    onChange={(e) => atualizarDadosCliente("cpf", e.target.value)}
                    onBlur={() => marcarCampoComoTocado("cpf")}
                    className={classeInput("cpf")}
                  />
                  {camposTocados.cpf && errosCampos.cpf && (
                    <p className="mt-1 text-sm text-red-600">{errosCampos.cpf}</p>
                  )}
                </div>
              </div>
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
                  onChange={(e) => setCepDestino(formatarCep(e.target.value))}
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
  onClick={() => setFreteSelecionado(opcao)}
  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${
    freteSelecionado?.chave === opcao.chave
      ? "border-black bg-zinc-100"
      : opcao.recomendado
      ? "border-[#f4b400] bg-[#fffaf0] hover:bg-[#fff6db] hover:shadow-md hover:-translate-y-[1px] animate-[pulse_2.2s_ease-in-out_1]"
      : "border-zinc-200 bg-zinc-50"
  }`}
>
  <div>
    <div className="flex items-center gap-2 flex-wrap">
      <p className="font-semibold text-zinc-900">{opcao.nome}</p>

      {opcao.recomendado && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#f4b400] bg-[#fff3c4] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#b38200] shadow-sm">
          <span aria-hidden="true">⭐</span>
          Recomendado
        </span>
      )}
    </div>

    <p className="mt-1 text-sm text-zinc-600">
      Prazo: {opcao.prazo}
    </p>
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
              onClick={finalizarPedidoMercadoPago}
              disabled={!podePagar}
              className="mt-6 w-full rounded-2xl bg-[#009EE3] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregandoPagamento ? "Redirecionando..." : "Pagar com Mercado Pago"}
            </button>

            {!formularioValido && (
              <p className="mt-2 text-sm text-red-600">
                Preencha corretamente todos os dados do comprador para continuar.
              </p>
            )}

            {formularioValido && !freteSelecionado && (
              <p className="mt-2 text-sm text-red-600">
                Calcule e selecione um frete para liberar o pagamento.
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