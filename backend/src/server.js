import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";
import mongoose from "mongoose";
import Pedido from "../models/Pedido.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import CUPONS from "./config/cupons.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@site.com";

// senha padrão: 123456
const ADMIN_SENHA_HASH =
  process.env.ADMIN_SENHA_HASH ||
  "$2b$10$FZpZqA7fNOz3Alngpik6LOPMt5kjrNn9XFT9qevj4I571PbQLGCNu";

const JWT_SECRET = process.env.JWT_SECRET || "troque-essa-chave-forte";

app.use(cors());
app.use(express.json());

const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
});

function num(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === "") return fallback;
  const convertido = Number(String(valor).replace(",", "."));
  return Number.isFinite(convertido) ? convertido : fallback;
}

function arredondar(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function paraCentavos(valor) {
  return Math.round(Number(valor || 0) * 100);
}

function deCentavos(valor) {
  return Number((Number(valor || 0) / 100).toFixed(2));
}

function criarDataInicio(dataString) {
  return new Date(`${dataString}T00:00:00`);
}

function criarDataFim(dataString) {
  return new Date(`${dataString}T23:59:59`);
}

function sanitizarString(valor) {
  return String(valor || "").trim();
}

function isRetiradaPedido(pedido = {}) {
  return (
    pedido?.tipoEntrega === "retirada" ||
    pedido?.freteSelecionado?.nome === "Retirar comigo"
  );
}

function normalizarStatusInterno(statusInterno) {
  const valor = String(statusInterno || "").trim().toLowerCase();

  if (valor === "chegou") return "chegou";
  if (valor === "para_confirmar") return "para_confirmar";
  if (valor === "a_emitir") return "a_emitir";
  if (valor === "emitido") return "emitido";
  if (valor === "enviado") return "enviado";

  if (valor === "retirada_recebido") return "retirada_recebido";
  if (valor === "retirada_preparando") return "retirada_preparando";
  if (valor === "retirada_pronto") return "retirada_pronto";

  return "chegou";
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

  const faltando = obrigatorios.filter(
    (campo) => !sanitizarString(REMETENTE[campo])
  );

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

function limparCep(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function validarConfiguracaoFrete() {
  const faltando = [];

  if (!SUPERFRETE_TOKEN) faltando.push("SUPERFRETE_TOKEN");
  if (!SUPERFRETE_USER_AGENT) faltando.push("SUPERFRETE_USER_AGENT");
  if (!CEP_ORIGEM) faltando.push("CEP_ORIGEM");

  if (faltando.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${faltando.join(", ")}`);
  }
}

function calcularSubtotalFrete(carrinho = []) {
  return carrinho.reduce((acc, item) => {
    const preco = Number(item.preco || 0);
    const quantidade = Math.max(1, Number(item.quantidade || 1));
    return acc + preco * quantidade;
  }, 0);
}

function calcularSubtotalCarrinho(carrinho = []) {
  return arredondar(
    carrinho.reduce(
      (total, item) =>
        total + Number(item.preco || 0) * Number(item.quantidade || 1),
      0
    )
  );
}

function obterCodigoCupomDoBody(body = {}) {
  if (typeof body.cupomCodigo === "string") {
    return body.cupomCodigo;
  }

  if (typeof body.cupom === "string") {
    return body.cupom;
  }

  if (body.cupom && typeof body.cupom.codigo === "string") {
    return body.cupom.codigo;
  }

  if (body.cupomAplicado && typeof body.cupomAplicado.codigo === "string") {
    return body.cupomAplicado.codigo;
  }

  return "";
}

function validarCupom({ cupom, codigo, subtotal, frete }) {
  const codigoNormalizado = String(codigo || "").trim().toUpperCase();
  const subtotalNumero = Number(subtotal || 0);
  const freteNumero = Number(frete || 0);

  if (!codigoNormalizado) {
    throw new Error("Digite um cupom.");
  }

  const cupomEncontrado = cupom || CUPONS[codigoNormalizado];

  if (!cupomEncontrado) {
    throw new Error("Cupom inválido.");
  }

  if (!cupomEncontrado.ativo) {
    throw new Error("Cupom inativo.");
  }

  const agora = new Date();

  if (cupomEncontrado.dataInicio) {
    const inicio = criarDataInicio(cupomEncontrado.dataInicio);
    if (agora < inicio) {
      throw new Error("Este cupom ainda não está disponível.");
    }
  }

  if (cupomEncontrado.dataFim) {
    const fim = criarDataFim(cupomEncontrado.dataFim);
    if (agora > fim) {
      throw new Error("Cupom expirado.");
    }
  }

  if (subtotalNumero < Number(cupomEncontrado.valorMinimoPedido || 0)) {
    throw new Error(
      `Cupom disponível apenas para pedidos acima de R$ ${Number(
        cupomEncontrado.valorMinimoPedido || 0
      ).toFixed(2)}.`
    );
  }

  let desconto = 0;

  if (cupomEncontrado.tipo === "percentual") {
    desconto = subtotalNumero * (Number(cupomEncontrado.valor || 0) / 100);
  }

  if (cupomEncontrado.tipo === "fixo") {
    desconto = Number(cupomEncontrado.valor || 0);
  }

  if (cupomEncontrado.tipo === "frete") {
    desconto = freteNumero;
  }

  desconto = Math.min(desconto, subtotalNumero + freteNumero);
  desconto = arredondar(desconto);

  const totalComDesconto = arredondar(
    subtotalNumero + freteNumero - desconto
  );

  return {
    codigo: cupomEncontrado.codigo,
    tipo: cupomEncontrado.tipo,
    valor: cupomEncontrado.valor,
    desconto,
    subtotal: arredondar(subtotalNumero),
    frete: arredondar(freteNumero),
    totalComDesconto,
    dataInicio: cupomEncontrado.dataInicio || null,
    dataFim: cupomEncontrado.dataFim || null,
    valorMinimoPedido: Number(cupomEncontrado.valorMinimoPedido || 0),
    primeiraCompra: Boolean(cupomEncontrado.primeiraCompra),
  };
}

function criarItensBasePedido(carrinho = [], freteSelecionado = null) {
  const itens = carrinho.map((item) => ({
    id: String(item.id || item.nome || "produto"),
    title: item.nome || "Produto",
    quantity: Number(item.quantidade || 1),
    unit_price: Number(item.preco || 0),
    currency_id: "BRL",
  }));

  if (freteSelecionado) {
    itens.push({
      id: "frete",
      title: `Frete - ${freteSelecionado.nome || "Entrega"}`,
      quantity: 1,
      unit_price: Number(freteSelecionado.preco || 0),
      currency_id: "BRL",
    });
  }

  return itens;
}

function aplicarDescontoNosItens(items = [], desconto = 0) {
  const descontoCentavos = paraCentavos(desconto);

  if (!Array.isArray(items) || items.length === 0 || descontoCentavos <= 0) {
    return items;
  }

  const linhas = items.map((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const unitPrice = Number(item.unit_price || 0);
    const totalCentavos = paraCentavos(unitPrice * quantity);

    return {
      ...item,
      quantity,
      unit_price: unitPrice,
      totalCentavos,
    };
  });

  const totalBrutoCentavos = linhas.reduce(
    (acc, item) => acc + item.totalCentavos,
    0
  );

  if (totalBrutoCentavos <= 0) {
    return items;
  }

  const descontoFinalCentavos = Math.min(descontoCentavos, totalBrutoCentavos);

  let descontoDistribuido = 0;

  const linhasComDesconto = linhas.map((item, index) => {
    let descontoLinha = 0;

    if (index === linhas.length - 1) {
      descontoLinha = descontoFinalCentavos - descontoDistribuido;
    } else {
      descontoLinha = Math.floor(
        (descontoFinalCentavos * item.totalCentavos) / totalBrutoCentavos
      );
      descontoDistribuido += descontoLinha;
    }

    descontoLinha = Math.min(descontoLinha, item.totalCentavos);

    const totalFinalCentavos = Math.max(0, item.totalCentavos - descontoLinha);
    const unitPriceFinal = Number(
      (totalFinalCentavos / 100 / item.quantity).toFixed(2)
    );

    return {
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: unitPriceFinal,
      currency_id: item.currency_id || "BRL",
    };
  });

  return linhasComDesconto;
}

function autenticarAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Token não enviado.",
      });
    }

    const [tipo, token] = authHeader.split(" ");

    if (tipo !== "Bearer" || !token) {
      return res.status(401).json({
        error: "Token inválido.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        error: "Acesso negado.",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Não autorizado.",
    });
  }
}

/* =========================
   AJUSTE INTELIGENTE DE PACOTE
========================= */
function montarPacoteUnico(carrinho) {
  let pesoTotal = 0;
  const caixas = [];

  for (const item of carrinho) {
    const quantidade = Math.max(1, Math.round(num(item.quantidade, 1)));

    const pesoBruto = num(item.peso, 0);
const peso = pesoBruto > 1 ? pesoBruto / 1000 : pesoBruto;
const altura = num(item.altura, 0);
const largura = num(item.largura, 0);
const comprimento = num(item.comprimento, 0);

console.log("📦 ITEM ORIGINAL:", {
  nome: item.nome,
  quantidade: item.quantidade,
  pesoInformado: pesoBruto,
  pesoConsideradoKg: peso,
  altura,
  largura,
  comprimento,
});

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

      console.log("📦 CAIXA GERADA:", {
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

    // folga de embalagem
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

    console.log("🧠 TENTATIVA DE ARRANJO:", {
      larguraMaximaLinha,
      pacote,
      volume,
      custo,
    });

    return {
      larguraMaximaLinha,
      pacote,
      custo,
      volume,
    };
  }

  const tentativas = [10, 12, 14, 16, 18].map(montarComLarguraMaxima);
  const melhor = tentativas.reduce((a, b) => (b.custo < a.custo ? b : a));

  console.log("🚚 PACOTE FINAL CALCULADO:", {
    pesoTotal: pesoTotal,
    pesoFinalComFolga: Number((pesoTotal + 0.03).toFixed(3)),
    dimensoes: {
      length: melhor.pacote.length,
      width: melhor.pacote.width,
      height: melhor.pacote.height,
    },
    melhorTentativa: melhor,
    tentativas,
  });

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

function calcularFretePedido(pedido = {}) {
  return arredondar(Number(pedido?.freteSelecionado?.preco || 0));
}

function calcularSubtotalPedido(pedido = {}) {
  if (pedido?.subtotalProdutos != null) {
    return arredondar(Number(pedido.subtotalProdutos || 0));
  }

  return calcularSubtotalCarrinho(pedido?.carrinho || []);
}

function calcularDescontoPedido(pedido = {}) {
  if (pedido?.descontoCupom != null && Number(pedido.descontoCupom) > 0) {
    return arredondar(Number(pedido.descontoCupom || 0));
  }

  const subtotal = calcularSubtotalPedido(pedido);
  const frete = calcularFretePedido(pedido);
  const total = Number(pedido?.totalComFrete);

  if (pedido?.totalComFrete != null && Number.isFinite(total)) {
    const descontoInferido = subtotal + frete - total;

    if (descontoInferido > 0) {
      return arredondar(descontoInferido);
    }
  }

  return 0;
}

function normalizarPedidoResposta(pedidoDoc) {
  const pedido =
    typeof pedidoDoc?.toObject === "function" ? pedidoDoc.toObject() : pedidoDoc;

  const subtotalProdutos = calcularSubtotalPedido(pedido);
  const frete = calcularFretePedido(pedido);
  const descontoCupom = calcularDescontoPedido(pedido);

  let totalComFrete = Number(pedido?.totalComFrete);

  if (!Number.isFinite(totalComFrete)) {
    totalComFrete = arredondar(subtotalProdutos + frete - descontoCupom);
  } else {
    totalComFrete = arredondar(totalComFrete);
  }

  return {
    ...pedido,
    subtotalProdutos,
    descontoCupom,
    cupomAplicado: pedido?.cupomAplicado || null,
    totalComFrete,
  };
}

app.get("/", (req, res) => {
  res.send("API Additive Hub online.");
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        error: "E-mail e senha são obrigatórios.",
      });
    }

    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({
        error: "Credenciais inválidas.",
      });
    }

    const senhaCorreta = await bcrypt.compare(senha, ADMIN_SENHA_HASH);

    if (!senhaCorreta) {
      return res.status(401).json({
        error: "Credenciais inválidas.",
      });
    }

    const token = jwt.sign(
      {
        email: ADMIN_EMAIL,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      usuario: {
        email: ADMIN_EMAIL,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Erro login admin:", error);

    return res.status(500).json({
      error: "Erro interno ao fazer login.",
    });
  }
});

/* =========================
   FRETE
========================= */
app.post("/api/frete", async (req, res) => {
  try {
    validarConfiguracaoFrete();

    const { cepDestino, carrinho } = req.body || {};

    if (!cepDestino) {
      return res.status(400).json({ error: "CEP de destino obrigatório." });
    }

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const cepDestinoLimpo = limparCep(cepDestino);
    const cepOrigemLimpo = limparCep(CEP_ORIGEM);

    if (cepOrigemLimpo.length !== 8) {
      return res.status(400).json({ error: "CEP de origem inválido." });
    }

    if (cepDestinoLimpo.length !== 8) {
      return res.status(400).json({ error: "CEP de destino inválido." });
    }

    const subtotal = calcularSubtotalFrete(carrinho);
    const pacoteUnico = montarPacoteUnico(carrinho);

    const produtos = [
      {
        id: String(pacoteUnico.id),
        name: pacoteUnico.name,
        quantity: 1,
        width: Number(pacoteUnico.width),
        height: Number(pacoteUnico.height),
        length: Number(pacoteUnico.length),
        weight: Number(pacoteUnico.weight),
      },
    ];

    const payloadSuperFrete = {
      from: { postal_code: cepOrigemLimpo },
      to: { postal_code: cepDestinoLimpo },
      services: SERVICES,
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: null,
        use_insurance_value: false,
      },
      products: produtos,
    };

    console.log("🚚 PAYLOAD ENVIADO PARA SUPERFRETE:");
    console.log(JSON.stringify(payloadSuperFrete, null, 2));

    const freteResponse = await fetch(`${SUPERFRETE_BASE_URL}/api/v0/calculator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
        "User-Agent": SUPERFRETE_USER_AGENT,
      },
      body: JSON.stringify(payloadSuperFrete),
    });

    const raw = await freteResponse.text();

    console.log("📡 STATUS SUPERFRETE:", freteResponse.status);
    console.log("📡 CONTENT-TYPE:", freteResponse.headers.get("content-type"));
    console.log("📡 RESPOSTA BRUTA:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "A SuperFrete não retornou JSON no cálculo de frete.",
        status: freteResponse.status,
        raw,
      });
    }

    if (!freteResponse.ok) {
      return res.status(freteResponse.status).json({
        error: "Erro ao calcular frete na SuperFrete.",
        message: data?.message || "Falha ao calcular frete.",
        details: data,
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Erro ao calcular frete:", error);

    return res.status(500).json({
      error: "Erro ao calcular frete.",
      message: error.message,
    });
  }
});

/* =========================
   CUPONS
========================= */
app.post("/api/cupons/validar", (req, res) => {
  try {
    const { codigo, subtotal, frete } = req.body || {};

    const resultado = validarCupom({
      codigo,
      subtotal: Number(subtotal || 0),
      frete: Number(frete || 0),
    });

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message || "Erro ao validar cupom.",
    });
  }
});

/* =========================
   CRIAR PREFERÊNCIA + SALVAR PEDIDO
========================= */
app.post("/api/pagamentos/criar-preferencia", async (req, res) => {
  console.log(
    "FRETE COMPLETO:",
    JSON.stringify(req.body.freteSelecionado, null, 2)
  );
  console.log("ENTROU EM /api/pagamentos/criar-preferencia");
  console.log("BODY:", req.body);

  try {
    const {
      carrinho,
      freteSelecionado,
      cepDestino,
      totalItensCarrinho,
      dadosCliente,
      enderecoEntrega,
      pedidoLocalId,
      criadoEm,
    } = req.body || {};

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const subtotalCalculado = calcularSubtotalCarrinho(carrinho);
    const freteCalculado = Number(freteSelecionado?.preco || 0);
    const totalBruto = arredondar(subtotalCalculado + freteCalculado);

    const codigoCupom = obterCodigoCupomDoBody(req.body);

    let cupomAplicado = null;
    let descontoCupom = 0;
    let totalFinalPedido = totalBruto;

    if (codigoCupom) {
  const codigoNormalizado = String(codigoCupom || "").trim().toUpperCase();
  const cupomConfig = CUPONS[codigoNormalizado];

  if (!cupomConfig) {
    return res.status(400).json({
      error: "Cupom inválido.",
    });
  }

  const cpfLimpo = sanitizarString(dadosCliente?.cpf).replace(/\D/g, "");

  if (cupomConfig.primeiraCompra) {
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return res.status(400).json({
        error: "CPF válido é obrigatório para usar este cupom.",
      });
    }

    const pedidoAprovadoExistente = await Pedido.findOne({
      "dadosCliente.cpf": cpfLimpo,
      status: "approved",
    });

    if (pedidoAprovadoExistente) {
      return res.status(400).json({
        error: "Este cupom é válido apenas para a primeira compra.",
      });
    }
  }

  const resultadoCupom = validarCupom({
    cupom: cupomConfig,
    codigo: codigoNormalizado,
    subtotal: subtotalCalculado,
    frete: freteCalculado,
  });

  cupomAplicado = {
    codigo: resultadoCupom.codigo,
    tipo: resultadoCupom.tipo,
    valor: resultadoCupom.valor,
    dataInicio: resultadoCupom.dataInicio,
    dataFim: resultadoCupom.dataFim,
    valorMinimoPedido: resultadoCupom.valorMinimoPedido,
    primeiraCompra: Boolean(resultadoCupom.primeiraCompra),
  };

  descontoCupom = Number(resultadoCupom.desconto || 0);
  totalFinalPedido = Number(resultadoCupom.totalComDesconto || totalBruto);
}

    const pedidoId = pedidoLocalId || `pedido_${Date.now()}`;

    const itensBase = criarItensBasePedido(carrinho, freteSelecionado);
    const items = aplicarDescontoNosItens(itensBase, descontoCupom);

    const tipoEntrega =
      freteSelecionado?.nome === "Retirar comigo" ? "retirada" : "entrega";

    const pedidoSalvo = {
      id: pedidoId,
      pedidoLocalId: pedidoId,
      carrinho,
      freteSelecionado: freteSelecionado || null,
      tipoEntrega,
      cepDestino: cepDestino || null,
      totalItensCarrinho: totalItensCarrinho || 0,
      subtotalProdutos: subtotalCalculado,
      descontoCupom: arredondar(descontoCupom),
      cupomAplicado,
      totalComFrete: arredondar(totalFinalPedido),

      dadosCliente: {
        nome: sanitizarString(dadosCliente?.nome),
        email: sanitizarString(dadosCliente?.email).toLowerCase(),
        telefone: sanitizarString(dadosCliente?.telefone),
        cpf: sanitizarString(dadosCliente?.cpf).replace(/\D/g, ""),
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
      statusInterno: tipoEntrega === "retirada" ? "retirada_recebido" : "chegou",
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

      criadoEm: criadoEm || new Date(),
      atualizadoEm: null,
    };

    const pedidoExistente = await Pedido.findOne({
      $or: [{ id: String(pedidoId) }, { pedidoLocalId: String(pedidoId) }],
    });

    if (pedidoExistente) {
      await Pedido.updateOne(
        { _id: pedidoExistente._id },
        { $set: pedidoSalvo }
      );
    } else {
      await Pedido.create(pedidoSalvo);
    }

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

    console.log("CUPOM APLICADO:", cupomAplicado);
    console.log("DESCONTO CUPOM:", descontoCupom);
    console.log("TOTAL BRUTO:", totalBruto);
    console.log("TOTAL FINAL PEDIDO:", totalFinalPedido);
    console.log("PREFERENCE BODY:", JSON.stringify(preferenceBody, null, 2));

    const mpResponse = await preference.create({
      body: preferenceBody,
    });

    return res.json({
      preferenceId: mpResponse.id,
      initPoint: mpResponse.init_point,
      pedidoId,
      subtotalProdutos: subtotalCalculado,
      descontoCupom: arredondar(descontoCupom),
      totalComFrete: arredondar(totalFinalPedido),
      cupomAplicado,
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

    const pedido = await Pedido.findOne({ id: String(pedidoId) });

    if (!pedido) {
      console.warn("Pedido não encontrado:", pedidoId);
      return res.sendStatus(200);
    }

    pedido.status = payment.status || pedido.status;
    pedido.payment_id = payment.id || null;
    pedido.status_detail = payment.status_detail || null;
    pedido.metodo_pagamento = payment.payment_method_id || null;
    pedido.atualizadoEm = new Date();

    await pedido.save();

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

    if (tipo === "pedido" || id) {
      const numeroPedido = String(valor || id || "").trim();

      if (!numeroPedido) {
        return res.status(400).json({
          error: "Informe o número do pedido.",
        });
      }

      const pedido = await Pedido.findOne({
        $or: [{ id: numeroPedido }, { pedidoLocalId: numeroPedido }],
      });

      if (!pedido) {
        return res.status(404).json({
          error: "Pedido não encontrado.",
        });
      }

      return res.json({
        pedido: normalizarPedidoResposta(pedido),
      });
    }

    if (tipo === "email" || email) {
      const emailBusca = String(valor || email || "").toLowerCase().trim();

      if (!emailBusca) {
        return res.status(400).json({
          error: "Informe um e-mail válido.",
        });
      }

      const pedidos = await Pedido.find({
        "dadosCliente.email": emailBusca,
      }).sort({ criadoEm: -1 });

      if (!pedidos.length) {
        return res.status(404).json({
          error: "Nenhum pedido encontrado para este e-mail.",
        });
      }

      return res.json({
        pedidos: pedidos.map(normalizarPedidoResposta),
      });
    }

    if (tipo === "cpf" || cpf) {
      const cpfBusca = String(valor || cpf || "").replace(/\D/g, "");

      if (!cpfBusca || cpfBusca.length !== 11) {
        return res.status(400).json({
          error: "Informe um CPF válido.",
        });
      }

      const pedidos = await Pedido.find({
        "dadosCliente.cpf": cpfBusca,
      }).sort({ criadoEm: -1 });

      if (!pedidos.length) {
        return res.status(404).json({
          error: "Nenhum pedido encontrado para este CPF.",
        });
      }

      return res.json({
        pedidos: pedidos.map(normalizarPedidoResposta),
      });
    }

    return res.status(400).json({
      error: "Informe CPF, número do pedido ou e-mail.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Erro ao buscar pedido.",
    });
  }
});

/* =========================
   LISTAR PEDIDOS PARA O PAINEL
========================= */
app.get("/api/pedidos", autenticarAdmin, async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ criadoEm: -1 });
    return res.json({
      pedidos: pedidos.map(normalizarPedidoResposta),
    });
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
app.get("/api/pedidos/:id", autenticarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findOne({
      $or: [{ id: String(id) }, { pedidoLocalId: String(id) }],
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    return res.json({
      pedido: normalizarPedidoResposta(pedido),
    });
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
app.patch("/api/pedidos/:id/status", autenticarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const novoStatus = normalizarStatusInterno(status);

    const pedido = await Pedido.findOneAndUpdate(
      {
        $or: [{ id: String(id) }, { pedidoLocalId: String(id) }],
      },
      {
        $set: {
          statusInterno: novoStatus,
          atualizadoEm: new Date(),
        },
      },
      { new: true }
    );

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    return res.json({
      message: "Status interno atualizado com sucesso.",
      pedido: normalizarPedidoResposta(pedido),
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
app.post("/api/pedidos/:id/gerar-etiqueta", autenticarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findOne({
      $or: [{ id: String(id) }, { pedidoLocalId: String(id) }],
    });

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    if (isRetiradaPedido(pedido)) {
      return res.status(400).json({
        error: "Pedido com retirada não possui etiqueta de envio.",
      });
    }

    if (!pedido?.freteSelecionado?.service) {
      return res.status(400).json({
        error: "Pedido sem frete selecionado.",
      });
    }

    const pacote =
      pedido?.freteSelecionado?.package ||
      pedido?.superfretePackage ||
      montarPacoteUnico(pedido.carrinho || []);

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
        insurance_value: null,
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

    const raw = await superfreteResponse.text();

    console.log("STATUS GERAR ETIQUETA:", superfreteResponse.status);
    console.log("RAW GERAR ETIQUETA:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    console.log("RESPOSTA GERAR ETIQUETA:", JSON.stringify(data, null, 2));

    if (!superfreteResponse.ok) {
      return res.status(superfreteResponse.status).json({
        error: "Erro ao gerar etiqueta na SuperFrete.",
        message: data?.message || "Falha ao criar etiqueta.",
        details: data,
      });
    }

    pedido.etiquetaGerada = true;
    pedido.statusEtiqueta = data?.status || "pending";
    pedido.superfreteCartId = data?.id || pedido.superfreteCartId || null;
    pedido.superfreteService = Number(
      pedido?.freteSelecionado?.service || pedido.superfreteService || 0
    );
    pedido.superfretePackage = pacote;
    pedido.urlEtiqueta = obterEtiquetaUrl(data) || pedido.urlEtiqueta || "";
    pedido.codigoRastreio =
      obterCodigoRastreio(data) || pedido.codigoRastreio || "";
    pedido.atualizadoEm = new Date();

    await pedido.save();

    return res.json({
      message: "Etiqueta gerada com sucesso.",
      urlEtiqueta: pedido.urlEtiqueta,
      codigoRastreio: pedido.codigoRastreio,
      pedido: normalizarPedidoResposta(pedido),
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
app.post("/api/pedidos/:id/emitir-etiqueta", autenticarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findOne({
      $or: [{ id: String(id) }, { pedidoLocalId: String(id) }],
    });

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    if (isRetiradaPedido(pedido)) {
      return res.status(400).json({
        error: "Pedido com retirada não possui emissão de etiqueta.",
      });
    }

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

    console.log("CONFIG SUPERFRETE:", {
      SUPERFRETE_ENV,
      SUPERFRETE_BASE_URL,
      temToken: !!SUPERFRETE_TOKEN,
      temUserAgent: !!SUPERFRETE_USER_AGENT,
    });

    const superfreteResponse = await fetch(`${SUPERFRETE_BASE_URL}/api/v0/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
        "User-Agent": SUPERFRETE_USER_AGENT,
      },
      body: JSON.stringify(payloadCheckout),
    });

    const raw = await superfreteResponse.text();

    console.log("STATUS EMITIR ETIQUETA:", superfreteResponse.status);
    console.log(
      "CONTENT-TYPE EMITIR ETIQUETA:",
      superfreteResponse.headers.get("content-type")
    );
    console.log("RAW EMITIR ETIQUETA:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      return res.status(502).json({
        error: "A SuperFrete não retornou JSON ao emitir etiqueta.",
        status: superfreteResponse.status,
        contentType: superfreteResponse.headers.get("content-type"),
        raw,
      });
    }

    console.log("RESPOSTA EMITIR ETIQUETA:", JSON.stringify(data, null, 2));

    if (!superfreteResponse.ok) {
      return res.status(superfreteResponse.status).json({
        error: "Erro ao emitir etiqueta na SuperFrete.",
        message: data?.message || "Falha ao emitir etiqueta.",
        details: data,
      });
    }

    pedido.etiquetaEmitida = true;
    pedido.statusInterno = "enviado";
    pedido.statusEtiqueta = data?.status || "paid";
    pedido.superfreteCheckoutId =
      data?.id || pedido.superfreteCheckoutId || null;
    pedido.codigoRastreio =
      obterCodigoRastreio(data) || pedido.codigoRastreio || "";
    pedido.urlEtiqueta = obterEtiquetaUrl(data) || pedido.urlEtiqueta || "";
    pedido.atualizadoEm = new Date();

    await pedido.save();

    return res.json({
      message: "Etiqueta emitida com sucesso.",
      urlEtiqueta: pedido.urlEtiqueta,
      codigoRastreio: pedido.codigoRastreio,
      pedido: normalizarPedidoResposta(pedido),
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

async function conectarMongo() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI não configurada no ambiente.");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB conectado com sucesso.");
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || "development",
  });
});

conectarMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao conectar no MongoDB:", error);
    process.exit(1);
  });