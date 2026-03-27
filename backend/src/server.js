import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";
import fs from "fs";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const SUPERFRETE_TOKEN = process.env.SUPERFRETE_TOKEN;
const SUPERFRETE_USER_AGENT = process.env.SUPERFRETE_USER_AGENT;
const CEP_ORIGEM = process.env.CEP_ORIGEM;
const SERVICES = "1,2,3,17";

const SUPERFRETE_ENV = process.env.SUPERFRETE_ENV || "production";
const SUPERFRETE_BASE_URL =
  SUPERFRETE_ENV === "sandbox"
    ? "https://sandbox.superfrete.com"
    : "https://api.superfrete.com";

const REMETENTE = {
  name: process.env.REMETENTE_NOME || "",
  phone: process.env.REMETENTE_TELEFONE || "",
  email: process.env.REMETENTE_EMAIL || "",
  document: process.env.REMETENTE_DOCUMENTO || "",
  company_document: process.env.REMETENTE_DOCUMENTO || "",
  address: process.env.REMETENTE_ENDERECO || "",
  number: process.env.REMETENTE_NUMERO || "",
  district: process.env.REMETENTE_BAIRRO || "",
  city: process.env.REMETENTE_CIDADE || "",
  state_abbr: process.env.REMETENTE_ESTADO || "",
  postal_code: process.env.CEP_ORIGEM || "",
};

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const FRONT_URL = process.env.FRONT_URL || "http://localhost:5173";
const NOTIFICATION_URL =
  process.env.NOTIFICATION_URL ||
  "https://additive-hub.onrender.com/api/webhook";

console.log("FRONT_URL:", FRONT_URL);
console.log("SUPERFRETE_BASE_URL:", SUPERFRETE_BASE_URL);

console.log("SUPERFRETE_ENV:", SUPERFRETE_ENV);
console.log("SUPERFRETE_BASE_URL:", SUPERFRETE_BASE_URL);
console.log("TOKEN EXISTS:", !!SUPERFRETE_TOKEN);
console.log("TOKEN LENGTH:", SUPERFRETE_TOKEN?.length);
console.log("TOKEN START:", SUPERFRETE_TOKEN?.slice(0, 12));

app.use(cors());
app.use(express.json());

const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
});

const PEDIDOS_FILE = "./pedidos.json";

function lerPedidos() {
  if (!fs.existsSync(PEDIDOS_FILE)) {
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify([], null, 2));
  }

  return JSON.parse(fs.readFileSync(PEDIDOS_FILE, "utf-8"));
}

function salvarPedidos(pedidos) {
  fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
}

function num(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === "") return fallback;
  const convertido = Number(String(valor).replace(",", "."));
  return Number.isFinite(convertido) ? convertido : fallback;
}

function montarPacoteUnico(carrinho) {
  let pesoTotal = 0;
  const caixas = [];

  for (const item of carrinho) {
    const quantidade = Math.max(1, Math.round(num(item.quantidade, 1)));

    const peso = num(item.peso, 0);
    const altura = num(item.altura, 0);
    const largura = num(item.largura, 0);
    const comprimento = num(item.comprimento, 0);

    if (peso <= 0 || altura <= 0 || largura <= 0 || comprimento <= 0) {
      throw new Error(`Produto com medidas inválidas: ${item.nome || item.id}`);
    }

    for (let i = 0; i < quantidade; i += 1) {
      const lados = [altura, largura, comprimento].sort((a, b) => b - a);

      caixas.push({
        length: lados[0],
        width: lados[1],
        height: lados[2],
      });

      pesoTotal += peso;
    }
  }

  caixas.sort((a, b) => b.length * b.width - a.length * a.width);

  function montarComLarguraMaxima(larguraMaximaLinha) {
    const linhas = [];
    let linhaAtual = {
      itens: [],
      widthUsada: 0,
      maxLength: 0,
      maxHeight: 0,
    };

    for (const caixa of caixas) {
      const cabeNaLinha =
        linhaAtual.itens.length === 0 ||
        linhaAtual.widthUsada + caixa.width <= larguraMaximaLinha;

      if (cabeNaLinha) {
        linhaAtual.itens.push(caixa);
        linhaAtual.widthUsada += caixa.width;
        linhaAtual.maxLength = Math.max(linhaAtual.maxLength, caixa.length);
        linhaAtual.maxHeight = Math.max(linhaAtual.maxHeight, caixa.height);
      } else {
        linhas.push(linhaAtual);
        linhaAtual = {
          itens: [caixa],
          widthUsada: caixa.width,
          maxLength: caixa.length,
          maxHeight: caixa.height,
        };
      }
    }

    if (linhaAtual.itens.length > 0) {
      linhas.push(linhaAtual);
    }

    let comprimentoFinal = 0;
    let larguraFinal = 0;
    let alturaFinal = 0;

    for (const linha of linhas) {
      comprimentoFinal = Math.max(comprimentoFinal, linha.maxLength);
      larguraFinal = Math.max(larguraFinal, linha.widthUsada);
      alturaFinal += linha.maxHeight;
    }

    comprimentoFinal += 2;
    larguraFinal += 2;
    alturaFinal += 1;

    const ladosFinais = [comprimentoFinal, larguraFinal, alturaFinal].sort(
      (a, b) => b - a
    );

    const pacote = {
      length: Number(Math.ceil(ladosFinais[0] * 10) / 10),
      width: Number(Math.ceil(ladosFinais[1] * 10) / 10),
      height: Number(Math.max(1, Math.ceil(ladosFinais[2] * 10) / 10)),
    };

    const volume = pacote.length * pacote.width * pacote.height;
    const custo =
      volume +
      pacote.length * 2 +
      pacote.width * 1.5 +
      pacote.height * 2;

    return {
      larguraMaximaLinha,
      pacote,
      custo,
    };
  }

  const tentativas = [10, 12, 14, 16, 18].map(montarComLarguraMaxima);
  const melhor = tentativas.reduce((a, b) => (b.custo < a.custo ? b : a));

  return {
    id: "pacote-unico",
    name: "Pacote consolidado",
    quantity: 1,
    weight: Number((pesoTotal + 0.03).toFixed(3)),
    length: melhor.pacote.length,
    width: melhor.pacote.width,
    height: melhor.pacote.height,
  };
}

function normalizarStatusInterno(statusInterno) {
  const valor = String(statusInterno || "").trim().toLowerCase();

  if (valor === "chegou") return "chegou";
  if (valor === "emitido") return "emitido";
  if (valor === "enviado") return "enviado";

  return "chegou";
}

function sanitizarString(valor) {
  return String(valor || "").trim();
}

function buscarPedidoPorIdOuCodigo(pedidos, id) {
  return pedidos.find(
    (p) => String(p.id) === String(id) || String(p.pedidoLocalId) === String(id)
  );
}

function validarRemetente() {
  const obrigatorios = [
    "name",
    "phone",
    "email",
    "document",
    "address",
    "number",
    "district",
    "city",
    "state_abbr",
    "postal_code",
  ];

  const faltando = obrigatorios.filter((campo) => !sanitizarString(REMETENTE[campo]));

  return {
    valido: faltando.length === 0,
    faltando,
  };
}

function obterEtiquetaUrl(data) {
  return (
    data?.label_url ||
    data?.url ||
    data?.pdf ||
    data?.label ||
    data?.print_url ||
    data?.tracking_url ||
    ""
  );
}

function obterCodigoRastreio(data) {
  return (
    data?.tracking ||
    data?.tracking_code ||
    data?.code ||
    data?.trackingCode ||
    ""
  );
}

app.get("/", (req, res) => {
  res.send("API Additive Hub online.");
});

/* =========================
   FRETE
   NÃO ALTERADO
========================= */
app.post("/api/frete", async (req, res) => {
  console.log("ENTROU EM /api/frete");
  console.log("BODY FRETE:", req.body);

  try {
    const { cepDestino, carrinho } = req.body || {};

    if (!cepDestino) {
      return res.status(400).json({ error: "CEP de destino obrigatório." });
    }

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const pacoteUnico = montarPacoteUnico(carrinho);

    const produtos = [
      {
        id: String(pacoteUnico.id),
        width: Number(pacoteUnico.width),
        height: Number(pacoteUnico.height),
        length: Number(pacoteUnico.length),
        weight: Number(pacoteUnico.weight),
        insurance_value: Number(
          carrinho.reduce(
            (total, item) =>
              total + Number(item.preco || 0) * Number(item.quantidade || 1),
            0
          )
        ),
        quantity: 1,
      },
    ];

    console.log("PACOTE ÚNICO:", JSON.stringify(pacoteUnico, null, 2));
    console.log("PRODUTOS ENVIADOS:", JSON.stringify(produtos, null, 2));

    const freteResponse = await fetch(`${SUPERFRETE_BASE_URL}/api/v0/calculator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
        "User-Agent": SUPERFRETE_USER_AGENT,
      },
      body: JSON.stringify({
        from: { postal_code: CEP_ORIGEM },
        to: { postal_code: cepDestino },
        services: SERVICES,
        products: produtos,
      }),
    });

    const data = await freteResponse.json();

    console.log("STATUS SUPERFRETE:", freteResponse.status);
    console.log("RESPOSTA SUPERFRETE:", JSON.stringify(data, null, 2));

    if (!freteResponse.ok) {
      return res.status(freteResponse.status).json({
        error: "Erro ao calcular frete",
        details: data,
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Erro no frete:", error);

    return res.status(500).json({
      error: "Erro interno ao calcular frete.",
      message: error.message,
    });
  }
});

/* =========================
   CRIAR PREFERÊNCIA + SALVAR PEDIDO
========================= */
app.post("/api/pagamentos/criar-preferencia", async (req, res) => {
  console.log("FRETE COMPLETO:", JSON.stringify(req.body.freteSelecionado, null, 2));
  console.log("ENTROU EM /api/pagamentos/criar-preferencia");
  console.log("BODY:", req.body);

  try {
    const {
      carrinho,
      freteSelecionado,
      cepDestino,
      totalItensCarrinho,
      subtotalProdutos,
      totalComFrete,
      dadosCliente,
      enderecoEntrega,
      pedidoLocalId,
      criadoEm,
    } = req.body || {};

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const pedidoId = pedidoLocalId || `pedido_${Date.now()}`;

    const items = carrinho.map((item) => ({
      id: String(item.id || item.nome || "produto"),
      title: item.nome || "Produto",
      quantity: Number(item.quantidade || 1),
      unit_price: Number(item.preco || 0),
      currency_id: "BRL",
    }));

    if (freteSelecionado) {
      items.push({
        id: "frete",
        title: `Frete - ${freteSelecionado.nome || "Entrega"}`,
        quantity: 1,
        unit_price: Number(freteSelecionado.preco || 0),
        currency_id: "BRL",
      });
    }

    const pedidos = lerPedidos();

    const pedidoExistenteIndex = pedidos.findIndex(
      (p) =>
        String(p.id) === String(pedidoId) ||
        String(p.pedidoLocalId) === String(pedidoId)
    );

    const pedidoSalvo = {
      id: pedidoId,
      pedidoLocalId: pedidoId,
      carrinho,
      freteSelecionado: freteSelecionado || null,
      cepDestino: cepDestino || null,
      totalItensCarrinho: totalItensCarrinho || 0,
      subtotalProdutos: subtotalProdutos || 0,
      totalComFrete: totalComFrete || 0,

      dadosCliente: {
        nome: sanitizarString(dadosCliente?.nome),
        email: sanitizarString(dadosCliente?.email).toLowerCase(),
        telefone: sanitizarString(dadosCliente?.telefone),
        cpf: sanitizarString(dadosCliente?.cpf),
      },

      enderecoEntrega: {
        cep: sanitizarString(enderecoEntrega?.cep || cepDestino),
        rua: sanitizarString(enderecoEntrega?.rua),
        bairro: sanitizarString(enderecoEntrega?.bairro),
        cidade: sanitizarString(enderecoEntrega?.cidade),
        estado: sanitizarString(enderecoEntrega?.estado),
        numero: sanitizarString(enderecoEntrega?.numero),
        complemento: sanitizarString(enderecoEntrega?.complemento),
      },

      status: "pending",
      statusInterno: "chegou",
      payment_id: null,
      status_detail: null,
      metodo_pagamento: null,

      etiquetaGerada: false,
      etiquetaEmitida: false,
      statusEtiqueta: null,
      urlEtiqueta: "",
      codigoRastreio: "",

      superfreteService: Number(freteSelecionado?.service || 0),
      superfretePackage: freteSelecionado?.package || null,
      superfreteCartId: null,
      superfreteCheckoutId: null,

      criadoEm: criadoEm || new Date().toISOString(),
      atualizadoEm: null,
    };

    if (pedidoExistenteIndex >= 0) {
      pedidos[pedidoExistenteIndex] = {
        ...pedidos[pedidoExistenteIndex],
        ...pedidoSalvo,
      };
    } else {
      pedidos.push(pedidoSalvo);
    }

    salvarPedidos(pedidos);

    const preference = new Preference(mpClient);

    const preferenceBody = {
      items,
      back_urls: {
        success: `${FRONT_URL}/#/pagamento/sucesso?pedido_id=${pedidoId}`,
        failure: `${FRONT_URL}/#/pagamento/falha?pedido_id=${pedidoId}`,
        pending: `${FRONT_URL}/#/pagamento/pendente?pedido_id=${pedidoId}`,
      },
      notification_url: NOTIFICATION_URL,
      auto_return: "approved",
      external_reference: pedidoId,
    };

    console.log("PREFERENCE BODY:", JSON.stringify(preferenceBody, null, 2));

    const mpResponse = await preference.create({
      body: preferenceBody,
    });

    return res.json({
      preferenceId: mpResponse.id,
      initPoint: mpResponse.init_point,
      pedidoId,
    });
  } catch (error) {
    console.error("==== ERRO NO MERCADO PAGO ====");
    console.error(error);

    return res.status(500).json({
      error: "Erro ao criar preferência de pagamento.",
      message: error.message,
      details: error?.cause || null,
    });
  }
});

/* =========================
   WEBHOOK MERCADO PAGO
========================= */
app.post("/api/webhook", async (req, res) => {
  try {
    console.log("Webhook recebido:", JSON.stringify(req.body, null, 2));

    const paymentId = req.body?.data?.id || req.body?.id;
    const topic = req.body?.type || req.body?.topic;

    if (!paymentId || topic !== "payment") {
      return res.sendStatus(200);
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error("Erro ao consultar pagamento:", payment);
      return res.sendStatus(200);
    }

    const pedidoId = payment.external_reference;

    if (!pedidoId) {
      console.warn("Pagamento sem external_reference.");
      return res.sendStatus(200);
    }

    const pedidos = lerPedidos();
    const index = pedidos.findIndex((p) => p.id === pedidoId);

    if (index === -1) {
      console.warn("Pedido não encontrado:", pedidoId);
      return res.sendStatus(200);
    }

    pedidos[index].status = payment.status || pedidos[index].status;
    pedidos[index].payment_id = payment.id || null;
    pedidos[index].status_detail = payment.status_detail || null;
    pedidos[index].metodo_pagamento = payment.payment_method_id || null;
    pedidos[index].atualizadoEm = new Date().toISOString();

    salvarPedidos(pedidos);

    console.log(`Pedido ${pedidoId} atualizado para status ${payment.status}`);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro no webhook:", error);
    return res.sendStatus(500);
  }
});

/* =========================
   ACOMPANHAR PEDIDO
========================= */
app.get("/api/pedidos/acompanhar", async (req, res) => {
  try {
    const { tipo, valor, id, email, cpf } = req.query;

    let pedido = null;

    // 🔥 NOVA LÓGICA FLEXÍVEL

    if (tipo === "pedido" || id) {
      const numeroPedido = valor || id;

      if (!numeroPedido) {
        return res.status(400).json({
          error: "Informe o número do pedido."
        });
      }

      pedido = await Pedido.findOne({ id: numeroPedido });
    }

    else if (tipo === "email" || email) {
      const emailBusca = (valor || email)?.toLowerCase();

      if (!emailBusca) {
        return res.status(400).json({
          error: "Informe um e-mail válido."
        });
      }

      pedido = await Pedido.findOne({ "dadosCliente.email": emailBusca })
        .sort({ createdAt: -1 }); // pega o mais recente
    }

    else if (tipo === "cpf" || cpf) {
      const cpfBusca = (valor || cpf)?.replace(/\D/g, "");

      if (!cpfBusca || cpfBusca.length !== 11) {
        return res.status(400).json({
          error: "Informe um CPF válido."
        });
      }

      pedido = await Pedido.findOne({ "dadosCliente.cpf": cpfBusca })
        .sort({ createdAt: -1 });
    }

    else {
      return res.status(400).json({
        error: "Informe CPF, número do pedido ou e-mail."
      });
    }

    // ❌ não encontrado
    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado."
      });
    }

    // ✅ retorno
    return res.json(pedido);

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Erro ao buscar pedido."
    });
  }
});

/* =========================
   LISTAR PEDIDOS PARA O PAINEL
========================= */
app.get("/api/pedidos", (req, res) => {
  try {
    const pedidos = lerPedidos();

    const pedidosOrdenados = [...pedidos].sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    );

    return res.json(pedidosOrdenados);
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);

    return res.status(500).json({
      error: "Erro ao listar pedidos.",
      message: error.message,
    });
  }
});

/* =========================
   PEDIDO INDIVIDUAL
========================= */
app.get("/api/pedidos/:id", (req, res) => {
  try {
    const { id } = req.params;
    const pedidos = lerPedidos();
    const pedido = buscarPedidoPorIdOuCodigo(pedidos, id);

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    return res.json(pedido);
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);

    return res.status(500).json({
      error: "Erro ao buscar pedido.",
      message: error.message,
    });
  }
});

/* =========================
   ATUALIZAR STATUS INTERNO
========================= */
app.patch("/api/pedidos/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const novoStatus = normalizarStatusInterno(status);
    const pedidos = lerPedidos();

    const index = pedidos.findIndex(
      (p) => String(p.id) === String(id) || String(p.pedidoLocalId) === String(id)
    );

    if (index === -1) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    pedidos[index].statusInterno = novoStatus;
    pedidos[index].atualizadoEm = new Date().toISOString();

    salvarPedidos(pedidos);

    return res.json({
      message: "Status interno atualizado com sucesso.",
      pedido: pedidos[index],
    });
  } catch (error) {
    console.error("Erro ao atualizar status interno:", error);

    return res.status(500).json({
      error: "Erro ao atualizar status interno.",
      message: error.message,
    });
  }
});

/* =========================
   GERAR ETIQUETA NA SUPERFRETE
========================= */
app.post("/api/pedidos/:id/gerar-etiqueta", async (req, res) => {
  try {
    const { id } = req.params;
    const pedidos = lerPedidos();

    const index = pedidos.findIndex(
      (p) => String(p.id) === String(id) || String(p.pedidoLocalId) === String(id)
    );

    if (index === -1) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    const pedido = pedidos[index];

    if (!pedido?.enderecoEntrega?.cep) {
      return res.status(400).json({
        error: "Pedido sem CEP de entrega.",
      });
    }

    if (!pedido?.enderecoEntrega?.rua) {
      return res.status(400).json({
        error: "Pedido sem rua de entrega.",
      });
    }

    if (!pedido?.enderecoEntrega?.numero) {
      return res.status(400).json({
        error: "Pedido sem número de entrega.",
      });
    }

    if (
      !pedido?.enderecoEntrega?.bairro ||
      !pedido?.enderecoEntrega?.cidade ||
      !pedido?.enderecoEntrega?.estado
    ) {
      return res.status(400).json({
        error: "Endereço de entrega incompleto.",
      });
    }

    if (!pedido?.dadosCliente?.nome) {
      return res.status(400).json({
        error: "Pedido sem nome do destinatário.",
      });
    }

    if (!pedido?.dadosCliente?.cpf) {
      return res.status(400).json({
        error: "Pedido sem CPF do destinatário.",
      });
    }

    if (!pedido?.freteSelecionado?.service) {
      return res.status(400).json({
        error: "Pedido sem código de serviço do frete.",
      });
    }

    if (!pedido?.freteSelecionado?.package) {
      return res.status(400).json({
        error: "Pedido sem pacote retornado pela cotação do frete.",
      });
    }

    const remetenteValidacao = validarRemetente();

    if (!remetenteValidacao.valido) {
      return res.status(400).json({
        error: "Dados do remetente incompletos no servidor.",
        faltando: remetenteValidacao.faltando,
      });
    }

    const pacote = pedido.freteSelecionado.package;

    const payloadEtiqueta = {
  from: {
    name: REMETENTE.name,
    phone: REMETENTE.phone,
    email: REMETENTE.email,
    document: REMETENTE.document,
    company_document: REMETENTE.company_document,
    address: REMETENTE.address,
    number: REMETENTE.number,
    district: REMETENTE.district,
    city: REMETENTE.city,
    state_abbr: REMETENTE.state_abbr,
    postal_code: REMETENTE.postal_code,
  },
  to: {
    name: pedido?.dadosCliente?.nome,
    phone: pedido?.dadosCliente?.telefone,
    email: pedido?.dadosCliente?.email,
    document: pedido?.dadosCliente?.cpf,
    address: pedido?.enderecoEntrega?.rua,
    number: pedido?.enderecoEntrega?.numero,
    district: pedido?.enderecoEntrega?.bairro,
    city: pedido?.enderecoEntrega?.cidade,
    state_abbr: pedido?.enderecoEntrega?.estado,
    postal_code: pedido?.enderecoEntrega?.cep,
    complement: pedido?.enderecoEntrega?.complemento || "",
  },
  service: Number(pedido.freteSelecionado.service),
  products: (pedido.carrinho || []).map((item, idx) => ({
    id: String(item.id || idx + 1),
    name: item.nome || "Produto",
    quantity: Number(item.quantidade || 1),
    unitary_value: Number(item.preco || 0),
  })),
  volumes: [
    {
      category: "package",
      width: Number(pacote.width || 0),
      height: Number(pacote.height || 0),
      length: Number(pacote.length || 0),
      weight: Number(pacote.weight || 0),
    },
  ],
  options: {
    insurance_value: Number(pedido.totalComFrete || 0),
    receipt: Boolean(pedido?.freteSelecionado?.additional_services?.receipt),
    own_hand: Boolean(pedido?.freteSelecionado?.additional_services?.own_hand),
    reverse: false,
    non_commercial: true,
  },
  tag: String(pedido.pedidoLocalId || pedido.id),
  platform: "Additive Hub",
};

    console.log(
      "PAYLOAD GERAR ETIQUETA:",
      JSON.stringify(payloadEtiqueta, null, 2)
    );

    const superfreteResponse = await fetch(`${SUPERFRETE_BASE_URL}/api/v0/cart`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
    "User-Agent": SUPERFRETE_USER_AGENT,
  },
  body: JSON.stringify(payloadEtiqueta),
});

// 👇 captura resposta bruta (IMPORTANTE)
const raw = await superfreteResponse.text();

console.log("STATUS GERAR ETIQUETA:", superfreteResponse.status);
console.log("RAW GERAR ETIQUETA:", raw);

// tenta converter para JSON
let data;
try {
  data = JSON.parse(raw);
} catch {
  data = raw;
}

    console.log(
      "RESPOSTA GERAR ETIQUETA:",
      JSON.stringify(data, null, 2)
    );

    if (!superfreteResponse.ok) {
      return res.status(superfreteResponse.status).json({
        error: "Erro ao gerar etiqueta na SuperFrete.",
        message: data?.message || "Falha ao criar etiqueta.",
        details: data,
      });
    }

    pedidos[index].etiquetaGerada = true;
    pedidos[index].statusEtiqueta = data?.status || "pending";
    pedidos[index].superfreteCartId = data?.id || pedidos[index].superfreteCartId || null;
    pedidos[index].superfreteService = Number(
      pedido?.freteSelecionado?.service || pedidos[index].superfreteService || 0
    );
    pedidos[index].superfretePackage =
      pedido?.freteSelecionado?.package || pedidos[index].superfretePackage || null;
    pedidos[index].urlEtiqueta =
      obterEtiquetaUrl(data) || pedidos[index].urlEtiqueta || "";
    pedidos[index].codigoRastreio =
      obterCodigoRastreio(data) || pedidos[index].codigoRastreio || "";
    pedidos[index].atualizadoEm = new Date().toISOString();

    salvarPedidos(pedidos);

    return res.json({
      message: "Etiqueta gerada com sucesso.",
      urlEtiqueta: pedidos[index].urlEtiqueta,
      codigoRastreio: pedidos[index].codigoRastreio,
      pedido: pedidos[index],
      superfrete: data,
    });
  } catch (error) {
    console.error("Erro ao gerar etiqueta:", error);

    return res.status(500).json({
      error: "Erro ao gerar etiqueta.",
      message: error.message,
    });
  }
});

/* =========================
   EMITIR ETIQUETA NA SUPERFRETE
========================= */
app.post("/api/pedidos/:id/emitir-etiqueta", async (req, res) => {
  try {
    const { id } = req.params;
    const pedidos = lerPedidos();

    const index = pedidos.findIndex(
      (p) => String(p.id) === String(id) || String(p.pedidoLocalId) === String(id)
    );

    if (index === -1) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    const pedido = pedidos[index];

    if (!pedido?.superfreteCartId) {
      return res.status(400).json({
        error: "Gere a etiqueta antes de emitir.",
      });
    }

    const payloadCheckout = {
      orders: [pedido.superfreteCartId],
    };

    console.log(
      "PAYLOAD EMITIR ETIQUETA:",
      JSON.stringify(payloadCheckout, null, 2)
    );

    const superfreteResponse = await fetch(`${SUPERFRETE_BASE_URL}/api/v0/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
        "User-Agent": SUPERFRETE_USER_AGENT,
      },
      body: JSON.stringify(payloadCheckout),
    });

    const data = await superfreteResponse.json();

    console.log(
      "RESPOSTA EMITIR ETIQUETA:",
      JSON.stringify(data, null, 2)
    );

    if (!superfreteResponse.ok) {
      return res.status(superfreteResponse.status).json({
        error: "Erro ao emitir etiqueta na SuperFrete.",
        message: data?.message || "Falha ao emitir etiqueta.",
        details: data,
      });
    }

    pedidos[index].etiquetaEmitida = true;
    pedidos[index].statusInterno = "enviado";
    pedidos[index].statusEtiqueta = data?.status || "paid";
    pedidos[index].superfreteCheckoutId =
      data?.id || pedidos[index].superfreteCheckoutId || null;
    pedidos[index].codigoRastreio =
      obterCodigoRastreio(data) || pedidos[index].codigoRastreio || "";
    pedidos[index].urlEtiqueta =
      obterEtiquetaUrl(data) || pedidos[index].urlEtiqueta || "";
    pedidos[index].atualizadoEm = new Date().toISOString();

    salvarPedidos(pedidos);

    return res.json({
      message: "Etiqueta emitida com sucesso.",
      urlEtiqueta: pedidos[index].urlEtiqueta,
      codigoRastreio: pedidos[index].codigoRastreio,
      pedido: pedidos[index],
      superfrete: data,
    });
  } catch (error) {
    console.error("Erro ao emitir etiqueta:", error);

    return res.status(500).json({
      error: "Erro ao emitir etiqueta.",
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});