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

export default function Checkout() {
  const [carrinho, setCarrinho] = useState([]);

  const [dadosCliente, setDadosCliente] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
  });

  const [enderecoEntrega, setEnderecoEntrega] = useState({
    cep: "",
    rua: "",
    bairro: "",
    cidade: "",
    estado: "",
    numero: "",
    complemento: "",
  });

  const [camposTocados, setCamposTocados] = useState({
    nome: false,
    email: false,
    telefone: false,
    cpf: false,
    numero: false,
  });

  const [cepDestino, setCepDestino] = useState("");
  const [fretes, setFretes] = useState([]);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);
  const [tentouPagar, setTentouPagar] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const apiPagamentoUrl =
    import.meta.env.VITE_PAGAMENTO_API_URL ||
    `${apiBaseUrl}/api/pagamentos/criar-preferencia`;

  useEffect(() => {
    try {
      const carrinhoSalvo = localStorage.getItem("carrinhoAdditiveHub");
      const dadosClienteSalvos = localStorage.getItem("dadosClienteAdditiveHub");
      const cepSalvo = localStorage.getItem("cepDestinoAdditiveHub");
      const freteSalvo = localStorage.getItem("freteSelecionadoAdditiveHub");
      const fretesSalvos = localStorage.getItem("fretesAdditiveHub");

      if (carrinhoSalvo) {
        const carrinhoParseado = JSON.parse(carrinhoSalvo);
        if (Array.isArray(carrinhoParseado)) {
          setCarrinho(carrinhoParseado);
        }
      }

      if (dadosClienteSalvos) {
        const dados = JSON.parse(dadosClienteSalvos);

        setDadosCliente({
          nome: dados?.nome || "",
          email: dados?.email || "",
          telefone: formatarTelefone(dados?.telefone || ""),
          cpf: formatarCPF(dados?.cpf || ""),
        });

        setEnderecoEntrega({
          cep: dados?.enderecoEntrega?.cep || "",
          rua: dados?.enderecoEntrega?.rua || "",
          bairro: dados?.enderecoEntrega?.bairro || "",
          cidade: dados?.enderecoEntrega?.cidade || "",
          estado: dados?.enderecoEntrega?.estado || "",
          numero: dados?.enderecoEntrega?.numero || "",
          complemento: dados?.enderecoEntrega?.complemento || "",
        });
      }

      if (cepSalvo) {
        setCepDestino(cepSalvo);
      }

      if (freteSalvo) {
        setFreteSelecionado(JSON.parse(freteSalvo));
      }

      if (fretesSalvos) {
        const fretesParseados = JSON.parse(fretesSalvos);
        if (Array.isArray(fretesParseados)) {
          setFretes(fretesParseados);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar checkout do localStorage:", error);
    }
  }, []);

  useEffect(() => {
    const cepLimpo = String(cepDestino || "").replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    setEnderecoEntrega((anterior) => ({
      ...anterior,
      cep: cepLimpo,
    }));

    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.erro) {
          setEnderecoEntrega((anterior) => ({
            ...anterior,
            cep: cepLimpo,
            rua: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          }));
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar CEP:", error);
      });
  }, [cepDestino]);

  useEffect(() => {
    localStorage.setItem(
      "dadosClienteAdditiveHub",
      JSON.stringify({
        ...dadosCliente,
        enderecoEntrega,
      })
    );
  }, [dadosCliente, enderecoEntrega]);

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

    if (campo === "numero") {
      if (!valorTexto) return "Número da residência é obrigatório.";
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
      numero: obterErroCampo("numero", enderecoEntrega.numero),
    };
  }, [dadosCliente, enderecoEntrega.numero]);

  const formularioValido = useMemo(() => {
    return (
      !errosCampos.nome &&
      !errosCampos.email &&
      !errosCampos.telefone &&
      !errosCampos.cpf &&
      !errosCampos.numero
    );
  }, [errosCampos]);

  const podePagar = useMemo(() => {
    return (
      formularioValido &&
      carrinho.length > 0 &&
      !!freteSelecionado &&
      !carregandoPagamento
    );
  }, [formularioValido, carrinho.length, freteSelecionado, carregandoPagamento]);

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

  const atualizarEnderecoEntrega = (campo, valor) => {
    setEnderecoEntrega((anterior) => ({
      ...anterior,
      [campo]: valor,
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
      numero: true,
    });
  };

  const dadosClienteValidos = () => {
    if (errosCampos.nome) return errosCampos.nome;
    if (errosCampos.email) return errosCampos.email;
    if (errosCampos.telefone) return errosCampos.telefone;
    if (errosCampos.cpf) return errosCampos.cpf;
    if (errosCampos.numero) return errosCampos.numero;
    return "";
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

    if (!freteSelecionado) {
      alert("Volte ao carrinho e calcule o frete antes de continuar.");
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
        enderecoEntrega: {
          ...enderecoEntrega,
          cep: String(cepDestino || "").replace(/\D/g, ""),
          numero: String(enderecoEntrega.numero || "").trim(),
          complemento: String(enderecoEntrega.complemento || "").trim(),
        },
        carrinho,
        cepDestino: String(cepDestino || "").replace(/\D/g, ""),
        freteSelecionado,
        fretes,
        totalItensCarrinho,
        subtotalProdutos,
        totalComFrete,
      };

      localStorage.setItem("ultimoPedidoAdditiveHub", JSON.stringify(resumoPedido));

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
            Preencha seus dados e conclua o pagamento.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Dados do comprador</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Preencha para concluir seu pedido.
              </p>

              <div className="mt-4 space-y-3">
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
                    onChange={(e) =>
                      atualizarDadosCliente("telefone", e.target.value)
                    }
                    onBlur={() => marcarCampoComoTocado("telefone")}
                    className={classeInput("telefone")}
                  />
                  {camposTocados.telefone && errosCampos.telefone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errosCampos.telefone}
                    </p>
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
              <h2 className="text-xl font-bold">Dados de entrega</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Endereço preenchido automaticamente com base no CEP informado na
                etapa anterior.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <input
                    type="text"
                    value={cepDestino}
                    disabled
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-600"
                    placeholder="CEP"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={enderecoEntrega.rua}
                    disabled
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-600"
                    placeholder="Rua"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={enderecoEntrega.bairro}
                    disabled
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-600"
                    placeholder="Bairro"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={enderecoEntrega.cidade}
                    disabled
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-600"
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={enderecoEntrega.estado}
                    disabled
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-600"
                    placeholder="Estado"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Número da residência"
                    value={enderecoEntrega.numero}
                    onChange={(e) =>
                      atualizarEnderecoEntrega("numero", e.target.value)
                    }
                    onBlur={() => marcarCampoComoTocado("numero")}
                    className={classeInput("numero")}
                  />
                  {camposTocados.numero && errosCampos.numero && (
                    <p className="mt-1 text-sm text-red-600">
                      {errosCampos.numero}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Complemento (opcional)"
                    value={enderecoEntrega.complemento}
                    onChange={(e) =>
                      atualizarEnderecoEntrega("complemento", e.target.value)
                    }
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>
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
              onClick={() => {
                setTentouPagar(true);
                finalizarPedidoMercadoPago();
              }}
              disabled={!podePagar}
              className="mt-6 w-full rounded-2xl bg-[#009EE3] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregandoPagamento ? "Redirecionando..." : "Pagar com Mercado Pago"}
            </button>

            {tentouPagar && !formularioValido && (
              <p className="mt-2 text-sm text-red-600">
                Preencha corretamente os dados do comprador e da entrega.
              </p>
            )}

            {formularioValido && !freteSelecionado && (
              <p className="mt-2 text-sm text-red-600">
                Volte ao carrinho e calcule o frete para liberar o pagamento.
              </p>
            )}

            <a
              href="/#/carrinho"
              className="mt-3 block w-full rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-center font-medium text-zinc-800"
            >
              Voltar para o carrinho
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}