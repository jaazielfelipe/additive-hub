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
import nodemailer from "nodemailer";

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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_SENHA_HASH = process.env.ADMIN_SENHA_HASH;

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const NOTIFICACAO_EMAIL_DESTINO =
  process.env.NOTIFICACAO_EMAIL_DESTINO || ADMIN_EMAIL;

const emailTransporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      })
    : null;

if (!ADMIN_EMAIL || !ADMIN_SENHA_HASH) {
  throw new Error("Credenciais admin não configuradas.");
}

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

function sanitizarTextoVariacao(valor) {
  return String(valor || "").trim();
}

function sanitizarSessionId(valor) {
  return String(valor || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);
}

function pedidoAindaRecuperavel(pedido = {}) {
  const status = String(pedido?.status || "").toLowerCase().trim();

  return ["pending", "in_process"].includes(status);
}

function normalizarResumoVariacoes(resumoVariacoes = [], selecoesVariacao = {}) {
  if (Array.isArray(resumoVariacoes) && resumoVariacoes.length > 0) {
    return resumoVariacoes
      .map((item) => ({
        nome: sanitizarTextoVariacao(item?.nome),
        valor: sanitizarTextoVariacao(item?.valor),
      }))
      .filter((item) => item.nome && item.valor);
  }

  if (
    selecoesVariacao &&
    typeof selecoesVariacao === "object" &&
    !Array.isArray(selecoesVariacao)
  ) {
    return Object.entries(selecoesVariacao)
      .map(([nome, valor]) => ({
        nome: sanitizarTextoVariacao(nome),
        valor: sanitizarTextoVariacao(valor),
      }))
      .filter((item) => item.nome && item.valor);
  }

  return [];
}

function normalizarSelecoesVariacao(selecoesVariacao = {}, resumoVariacoes = []) {
  if (
    selecoesVariacao &&
    typeof selecoesVariacao === "object" &&
    !Array.isArray(selecoesVariacao)
  ) {
    const objetoLimpo = {};

    for (const [chave, valor] of Object.entries(selecoesVariacao)) {
      const chaveLimpa = sanitizarTextoVariacao(chave);
      const valorLimpo = sanitizarTextoVariacao(valor);

      if (chaveLimpa && valorLimpo) {
        objetoLimpo[chaveLimpa] = valorLimpo;
      }
    }

    if (Object.keys(objetoLimpo).length > 0) {
      return objetoLimpo;
    }
  }

  if (Array.isArray(resumoVariacoes) && resumoVariacoes.length > 0) {
    const objeto = {};

    for (const item of resumoVariacoes) {
      const nome = sanitizarTextoVariacao(item?.nome);
      const valor = sanitizarTextoVariacao(item?.valor);

      if (nome && valor) {
        objeto[nome] = valor;
      }
    }

    return objeto;
  }

  return {};
}

function normalizarItemCarrinho(item = {}, index = 0) {
  const selecoesVariacao = normalizarSelecoesVariacao(
    item?.selecoesVariacao,
    item?.resumoVariacoes
  );

  const resumoVariacoes = normalizarResumoVariacoes(
    item?.resumoVariacoes,
    selecoesVariacao
  );

  return {
    ...item,

    id: item?.id ?? null,
    nome: sanitizarString(item?.nome),
    quantidade: Math.max(1, Number(item?.quantidade || 1)),
    preco: Number(item?.preco || 0),
    peso: Number(item?.peso || 0),
    altura: Number(item?.altura || 0),
    largura: Number(item?.largura || 0),
    comprimento: Number(item?.comprimento || 0),

    carrinhoKey:
      sanitizarString(item?.carrinhoKey) ||
      `${item?.id || item?.nome || "item"}-${index}`,

    selecoesVariacao,
    resumoVariacoes,

    categoria: sanitizarString(item?.categoria),
    categoriaLabel: sanitizarString(item?.categoriaLabel),
    subcategoria: sanitizarString(item?.subcategoria),
    subcategoriaLabel: sanitizarString(item?.subcategoriaLabel),
    subcategoria2: sanitizarString(item?.subcategoria2),
    subcategoria2Label: sanitizarString(item?.subcategoria2Label),

    imagens: Array.isArray(item?.imagens)
      ? item.imagens.map((img) => sanitizarString(img)).filter(Boolean)
      : [],

    descricao: sanitizarString(item?.descricao),
    destaque: sanitizarString(item?.destaque),
  };
}

function normalizarCarrinhoPedido(carrinho = []) {
  if (!Array.isArray(carrinho)) return [];
  return carrinho.map((item, index) => normalizarItemCarrinho(item, index));
}

function isRetiradaPedido(pedido = {}) {
  return (
    pedido?.tipoEntrega === "retirada" ||
    pedido?.freteSelecionado?.nome === "Retirar comigo"
  );
}

function normalizarStatusInterno(statusInterno) {
  const valor = String(statusInterno || "").trim().toLowerCase();

  const statusValidos = [
    "chegou",
    "para_confirmar",
    "a_emitir",
    "emitido",
    "enviado",
    "retirada_recebido",
    "retirada_preparando",
    "retirada_pronto",
    "retirada_concluido",
  ];

  if (statusValidos.includes(valor)) {
    return valor;
  }

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

async function enviarEmailNovoPagamento(pedido, payment) {
  try {
    if (!emailTransporter) {
      console.warn(
        "E-mail não configurado: defina GMAIL_USER e GMAIL_APP_PASSWORD."
      );
      return;
    }

    const pedidoId = pedido?.id || pedido?.pedidoLocalId || "Sem ID";
    const clienteNome = pedido?.dadosCliente?.nome || "Cliente";
    const clienteEmail = pedido?.dadosCliente?.email || "Não informado";
    const clienteTelefone = pedido?.dadosCliente?.telefone || "Não informado";
    const clienteCpf = pedido?.dadosCliente?.cpf || "Não informado";

    const subtotal = Number(pedido?.subtotalProdutos || 0).toFixed(2);
    const frete = Number(pedido?.freteSelecionado?.preco || 0).toFixed(2);
    const desconto = Number(pedido?.descontoCupom || 0).toFixed(2);
    const total = Number(pedido?.totalComFrete || 0).toFixed(2);

    const statusPagamento = payment?.status || pedido?.status || "desconhecido";
    const metodoPagamento =
      payment?.payment_method_id || pedido?.metodo_pagamento || "Não informado";
    const paymentId = payment?.id || pedido?.payment_id || "Não informado";

    const itensHtml = Array.isArray(pedido?.carrinho)
      ? pedido.carrinho
          .map((item) => {
            const nome = item?.nome || "Produto";
            const quantidade = Number(item?.quantidade || 1);
            const preco = Number(item?.preco || 0).toFixed(2);

            const variacoes = Array.isArray(item?.resumoVariacoes)
              ? item.resumoVariacoes
                  .map(
                    (v) =>
                      `${v?.nome || "Variação"}: ${v?.valor || "Não informado"}`
                  )
                  .join(" | ")
              : "";

            return `
              <li style="margin-bottom:10px;">
                <strong>${nome}</strong><br />
                Quantidade: ${quantidade}<br />
                Preço unitário: R$ ${preco}
                ${variacoes ? `<br />Variações: ${variacoes}` : ""}
              </li>
            `;
          })
          .join("")
      : "<li>Nenhum item encontrado.</li>";

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">✅ Novo pagamento aprovado</h2>
        <p style="margin-top: 0;">
          Um pagamento foi aprovado no site <strong>Additive Hub</strong>.
        </p>

        <h3>additive-hub.com/#/painel</h3>

        <h3>Pedido</h3>
        <p>
          <strong>Pedido:</strong> ${pedidoId}<br />
          <strong>Payment ID:</strong> ${paymentId}<br />
          <strong>Status:</strong> ${statusPagamento}<br />
          <strong>Método:</strong> ${metodoPagamento}
        </p>

        <h3>Cliente</h3>
        <p>
          <strong>Nome:</strong> ${clienteNome}<br />
          <strong>E-mail:</strong> ${clienteEmail}<br />
          <strong>Telefone:</strong> ${clienteTelefone}<br />
          <strong>CPF:</strong> ${clienteCpf}
        </p>

        <h3>Valores</h3>
        <p>
          <strong>Subtotal:</strong> R$ ${subtotal}<br />
          <strong>Frete:</strong> R$ ${frete}<br />
          <strong>Desconto:</strong> R$ ${desconto}<br />
          <strong>Total:</strong> <strong>R$ ${total}</strong>
        </p>

        <h3>Itens</h3>
        <ul>
          ${itensHtml}
        </ul>
      </div>
    `;

    await emailTransporter.sendMail({
      from: `"Additive Hub" <${GMAIL_USER}>`,
      to: NOTIFICACAO_EMAIL_DESTINO,
      subject: `Novo pagamento aprovado - Pedido ${pedidoId}`,
      html,
    });

    console.log(`E-mail de notificação enviado para ${NOTIFICACAO_EMAIL_DESTINO}`);
  } catch (error) {
    console.error("Erro ao enviar e-mail de notificação:", error);
  }
}

/* =========================
   MODELOS FIXOS DE EMBALAGEM
========================= */
const MODELOS_EMBALAGEM = [
  {
    id: "pacote",
    nome: "Pacote",
    length: 16,
    width: 11,
    height: 3,
    pesoMaximo: 0.5,

    // pacote flexível
    flexivel: true,
    lengthMax: 16,
    widthMax: 11,
    heightMin: 1,
    heightMax: 6,
    volumeMax: 16 * 11 * 3, // 528 cm³
  },
  {
    id: "caixa1",
    nome: "Caixa P",
    length: 16,
    width: 11,
    height: 6,
    pesoMaximo: 1,
  },
  {
    id: "caixa2",
    nome: "Caixa M",
    length: 27,
    width: 18,
    height: 9,
    pesoMaximo: 2,
  },
  {
    id: "caixa3",
    nome: "Caixa G",
    length: 27,
    width: 22,
    height: 13,
    pesoMaximo: 5,
  },
  {
    id: "caixa4",
    nome: "Caixa GG",
    length: 30,
    width: 20,
    height: 10,
    pesoMaximo: 5,
  },
  {
    id: "caixa5",
    nome: "Caixa XG",
    length: 40,
    width: 20,
    height: 20,
    pesoMaximo: 5,
  },
  {
    id: "caixa6",
    nome: "Caixa XGG",
    length: 50,
    width: 30,
    height: 40,
    pesoMaximo: 5,
  },
];

/* =========================
   AJUSTE INTELIGENTE DE PACOTE
========================= */
function gerarCaixasDoCarrinho(carrinho = []) {
  let pesoTotal = 0;
  const caixas = [];

  for (const item of carrinho) {
    const quantidade = Math.max(1, Math.round(num(item.quantidade, 1)));

    const pesoBruto = num(item.peso, 0);
    const peso = pesoBruto > 1 ? pesoBruto / 1000 : pesoBruto;

    const lados = [
      num(item.altura, 0),
      num(item.largura, 0),
      num(item.comprimento, 0),
    ].sort((a, b) => b - a);

    console.log("📦 ITEM ORIGINAL:", {
      nome: item.nome,
      quantidade: item.quantidade,
      pesoInformado: pesoBruto,
      pesoConsideradoKg: peso,
      altura: num(item.altura, 0),
      largura: num(item.largura, 0),
      comprimento: num(item.comprimento, 0),
    });

    if (peso <= 0 || lados.some((l) => l <= 0)) {
      throw new Error(`Produto com medidas inválidas: ${item.nome || item.id}`);
    }

    for (let i = 0; i < quantidade; i += 1) {
      const caixa = {
        length: lados[0],
        width: lados[1],
        height: lados[2],
      };

      caixas.push(caixa);

      console.log("📦 CAIXA GERADA:", caixa);

      pesoTotal += peso;
    }
  }

  caixas.sort((a, b) => b.length * b.width - a.length * a.width);

  return {
    caixas,
    pesoTotal: Number((pesoTotal + 0.03).toFixed(3)),
  };
}

function tentarNoPacoteFlexivel(caixas, pesoTotal, embalagem) {
  if (pesoTotal > embalagem.pesoMaximo) {
    console.log("❌ EXCEDE PESO DO PACOTE:", {
      embalagem: embalagem.nome,
      pesoTotal,
      pesoMaximo: embalagem.pesoMaximo,
    });
    return null;
  }

  let volumeTotalItens = 0;
  let comprimentoMax = 0;
  let larguraMax = 0;
  let alturaSomada = 0;

  for (const caixa of caixas) {
    const orientacoes = [
      [caixa.length, caixa.width, caixa.height],
      [caixa.length, caixa.height, caixa.width],
      [caixa.width, caixa.length, caixa.height],
      [caixa.width, caixa.height, caixa.length],
      [caixa.height, caixa.length, caixa.width],
      [caixa.height, caixa.width, caixa.length],
    ];

    const cabe = orientacoes.find(([l, w, h]) => {
      return l <= embalagem.lengthMax && w <= embalagem.widthMax;
    });

    if (!cabe) {
      console.log("❌ ITEM NÃO COUBE NO PACOTE FLEXÍVEL:", {
        embalagem: embalagem.nome,
        caixa,
        limites: {
          lengthMax: embalagem.lengthMax,
          widthMax: embalagem.widthMax,
        },
      });
      return null;
    }

    const [l, w, h] = cabe;

    comprimentoMax = Math.max(comprimentoMax, l);
    larguraMax = Math.max(larguraMax, w);
    alturaSomada += h;
    volumeTotalItens += l * w * h;
  }

  if (comprimentoMax > embalagem.lengthMax) {
    console.log("❌ COMPRIMENTO ULTRAPASSOU NO PACOTE FLEXÍVEL:", {
      embalagem: embalagem.nome,
      comprimentoMax,
      comprimentoPermitido: embalagem.lengthMax,
    });
    return null;
  }

  if (larguraMax > embalagem.widthMax) {
    console.log("❌ LARGURA ULTRAPASSOU NO PACOTE FLEXÍVEL:", {
      embalagem: embalagem.nome,
      larguraMax,
      larguraPermitida: embalagem.widthMax,
    });
    return null;
  }

  if (volumeTotalItens > embalagem.volumeMax) {
    console.log("❌ VOLUME ULTRAPASSOU NO PACOTE FLEXÍVEL:", {
      embalagem: embalagem.nome,
      volumeTotalItens,
      volumeMaximo: embalagem.volumeMax,
    });
    return null;
  }

  const areaBase = embalagem.lengthMax * embalagem.widthMax;
  const alturaPorVolume = areaBase > 0 ? volumeTotalItens / areaBase : 0;

  const alturaFinal = Math.max(alturaPorVolume, embalagem.heightMin || 1);

  if (alturaFinal > embalagem.heightMax) {
    console.log("❌ ALTURA ULTRAPASSOU NO PACOTE FLEXÍVEL:", {
      embalagem: embalagem.nome,
      alturaFinal,
      alturaMaxima: embalagem.heightMax,
    });
    return null;
  }

  const alturaDeclarada = Math.max(
    embalagem.heightMin || 1,
    Math.min(embalagem.heightMax, Math.ceil(alturaFinal))
  );

  console.log("✅ ARRANJO COUBE NO PACOTE FLEXÍVEL:", {
    embalagem: embalagem.nome,
    pesoTotal,
    dimensoesDeclaradas: {
      length: embalagem.lengthMax,
      width: embalagem.widthMax,
      height: alturaDeclarada,
    },
    ocupacaoEstimada: {
      comprimentoMax,
      larguraMax,
      alturaSomada,
      alturaPorVolume,
      volumeTotalItens,
      percentualOcupacao: Number(
        ((volumeTotalItens / embalagem.volumeMax) * 100).toFixed(2)
      ),
    },
  });

  return {
    embalagem,
    dimensoes: {
      length: embalagem.lengthMax,
      width: embalagem.widthMax,
      height: alturaDeclarada,
    },
    ocupacao: {
      volumeTotalItens,
      volumeMaximo: embalagem.volumeMax,
      percentual: Number(
        ((volumeTotalItens / embalagem.volumeMax) * 100).toFixed(2)
      ),
    },
  };
}

function tentarNaEmbalagem(caixas, pesoTotal, embalagem) {
  if (embalagem?.flexivel) {
    return tentarNoPacoteFlexivel(caixas, pesoTotal, embalagem);
  }

  if (pesoTotal > embalagem.pesoMaximo) {
    console.log("❌ EXCEDE PESO DA EMBALAGEM:", {
      embalagem: embalagem.nome,
      pesoTotal,
      pesoMaximo: embalagem.pesoMaximo,
    });
    return null;
  }

  let larguraAtual = 0;
  let alturaTotal = 0;
  let alturaLinha = 0;
  let comprimentoMax = 0;

  for (const caixa of caixas) {
    const orientacoes = [
      [caixa.length, caixa.width, caixa.height],
      [caixa.length, caixa.height, caixa.width],
      [caixa.width, caixa.length, caixa.height],
      [caixa.width, caixa.height, caixa.length],
      [caixa.height, caixa.length, caixa.width],
      [caixa.height, caixa.width, caixa.length],
    ];

    const cabe = orientacoes.find(([l, w, h]) => {
      return (
        l <= embalagem.length &&
        w <= embalagem.width &&
        h <= embalagem.height
      );
    });

    if (!cabe) {
      console.log("❌ ITEM NÃO COUBE NA EMBALAGEM:", {
        embalagem: embalagem.nome,
        caixa,
      });
      return null;
    }

    const [l, w, h] = cabe;

    if (larguraAtual + w <= embalagem.width) {
      larguraAtual += w;
      alturaLinha = Math.max(alturaLinha, h);
      comprimentoMax = Math.max(comprimentoMax, l);
    } else {
      alturaTotal += alturaLinha;

      if (alturaTotal + h > embalagem.height) {
        console.log("❌ ALTURA ULTRAPASSOU NA EMBALAGEM:", {
          embalagem: embalagem.nome,
          alturaTotal,
          proximaAltura: h,
          alturaMaxima: embalagem.height,
        });
        return null;
      }

      larguraAtual = w;
      alturaLinha = h;
      comprimentoMax = Math.max(comprimentoMax, l);
    }

    if (comprimentoMax > embalagem.length) {
      console.log("❌ COMPRIMENTO ULTRAPASSOU NA EMBALAGEM:", {
        embalagem: embalagem.nome,
        comprimentoMax,
        comprimentoPermitido: embalagem.length,
      });
      return null;
    }
  }

  alturaTotal += alturaLinha;

  if (alturaTotal > embalagem.height) {
    console.log("❌ ALTURA FINAL ULTRAPASSOU NA EMBALAGEM:", {
      embalagem: embalagem.nome,
      alturaTotal,
      alturaPermitida: embalagem.height,
    });
    return null;
  }

  console.log("✅ ARRANJO COUBE NA EMBALAGEM:", {
    embalagem: embalagem.nome,
    pesoTotal,
    dimensoesEmbalagem: {
      length: embalagem.length,
      width: embalagem.width,
      height: embalagem.height,
    },
    ocupacaoEstimada: {
      comprimentoMax,
      larguraLinhaFinal: larguraAtual,
      alturaTotal,
    },
  });

  return {
    embalagem,
    dimensoes: {
      length: embalagem.length,
      width: embalagem.width,
      height: embalagem.height,
    },
  };
}

function montarPacoteUnico(carrinho) {
  const { caixas, pesoTotal } = gerarCaixasDoCarrinho(carrinho);

  for (const embalagem of MODELOS_EMBALAGEM) {
    const tentativa = tentarNaEmbalagem(caixas, pesoTotal, embalagem);

    if (tentativa) {
      console.log("✅ USANDO EMBALAGEM:", embalagem.nome);

      return {
        id: "pacote-unico",
        name: embalagem.nome,
        quantity: 1,
        weight: pesoTotal,
        length: tentativa.dimensoes.length,
        width: tentativa.dimensoes.width,
        height: tentativa.dimensoes.height,
        embalagemUtilizada: embalagem,
        ocupacao: tentativa.ocupacao || null,
      };
    }
  }

  console.log("⚠️ NÃO COUBE EM NENHUMA EMBALAGEM → usando arranjo livre");

  let comprimento = 0;
  let largura = 0;
  let altura = 0;

  for (const c of caixas) {
    comprimento = Math.max(comprimento, c.length);
    largura = Math.max(largura, c.width);
    altura += c.height;
  }

  const fallback = {
    length: comprimento + 2,
    width: largura + 2,
    height: altura + 1,
  };

  console.log("📦 FALLBACK ARRANJO LIVRE:", {
    pesoTotal,
    fallback,
  });

  return {
    id: "pacote-unico",
    name: "Pacote consolidado",
    quantity: 1,
    weight: pesoTotal,
    length: fallback.length,
    width: fallback.width,
    height: fallback.height,
    embalagemUtilizada: null,
    ocupacao: null,
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
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({
        error: "Usuário/e-mail e senha são obrigatórios.",
      });
    }

    const loginNormalizado = String(login).trim().toLowerCase();
    const adminEmailNormalizado = String(ADMIN_EMAIL).trim().toLowerCase();

    if (loginNormalizado !== adminEmailNormalizado) {
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

    console.log("🚚 SUBTOTAL CARRINHO PARA FRETE:", subtotal);
    console.log("🚚 PACOTE DEFINIDO PELA ADDITIVE HUB:");
    console.log(JSON.stringify(pacoteUnico, null, 2));

    console.log("🚚 PAYLOAD ENVIADO PARA SUPERFRETE:");
    console.log(JSON.stringify(payloadSuperFrete, null, 2));

    const freteResponse = await fetch(
      `${SUPERFRETE_BASE_URL}/api/v0/calculator`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
          "User-Agent": SUPERFRETE_USER_AGENT,
        },
        body: JSON.stringify(payloadSuperFrete),
      }
    );

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

    return res.json({
      ...data,
      pacoteAdditiveHub: {
        id: pacoteUnico.id,
        name: pacoteUnico.name,
        width: pacoteUnico.width,
        height: pacoteUnico.height,
        length: pacoteUnico.length,
        weight: pacoteUnico.weight,
        embalagemUtilizada: pacoteUnico.embalagemUtilizada || null,
      },
    });
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
    JSON.stringify(req.body?.freteSelecionado, null, 2)
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
      sessionId,
    } = req.body || {};

    const sessionIdLimpo = sanitizarSessionId(sessionId);
    const carrinhoNormalizado = normalizarCarrinhoPedido(carrinho);

    if (!Array.isArray(carrinhoNormalizado) || carrinhoNormalizado.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const subtotalCalculado = calcularSubtotalCarrinho(carrinhoNormalizado);
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

    const tipoEntrega =
      freteSelecionado?.nome === "Retirar comigo" ? "retirada" : "entrega";

    let pedidoExistente = null;

    if (sessionIdLimpo) {
      pedidoExistente = await Pedido.findOne({
        sessionId: sessionIdLimpo,
        status: { $in: ["pending", "in_process"] },
      }).sort({ criadoEm: -1 });
    }

    if (!pedidoExistente && pedidoLocalId) {
      pedidoExistente = await Pedido.findOne({
        $or: [{ id: String(pedidoLocalId) }, { pedidoLocalId: String(pedidoLocalId) }],
      });
    }

    const pedidoId = pedidoExistente?.id || pedidoLocalId || `pedido_${Date.now()}`;

    const itensBase = criarItensBasePedido(
      carrinhoNormalizado,
      freteSelecionado
    );
    const items = aplicarDescontoNosItens(itensBase, descontoCupom);

    const pedidoSalvo = {
      id: pedidoId,
      pedidoLocalId: pedidoId,
      sessionId: sessionIdLimpo,
      carrinho: carrinhoNormalizado,
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

      status: pedidoAindaRecuperavel(pedidoExistente) ? pedidoExistente.status : "pending",
      statusInterno:
        tipoEntrega === "retirada" ? "retirada_recebido" : "chegou",
      payment_id: null,
      status_detail: null,
      metodo_pagamento: null,

      etiquetaGerada: false,
      etiquetaEmitida: false,
      statusEtiqueta: null,
      urlEtiqueta: "",
      codigoRastreio: "",

      superfreteService: Number(freteSelecionado?.service || 0),
      superfretePackage:
        freteSelecionado?.package ||
        freteSelecionado?.pacoteAdditiveHub ||
        null,
      superfreteCartId: null,
      superfreteCheckoutId: null,

      criadoEm: pedidoExistente?.criadoEm || criadoEm || new Date(),
      atualizadoEm: new Date(),
    };

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

    console.log("SESSION ID:", sessionIdLimpo);
    console.log("PEDIDO EXISTENTE REAPROVEITADO:", !!pedidoExistente);
    console.log("PEDIDO ID FINAL:", pedidoId);
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
      reutilizado: !!pedidoExistente,
      sessionId: sessionIdLimpo,
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

    const statusAnterior = String(pedido.status || "").toLowerCase();

    pedido.status = payment.status || pedido.status;
    pedido.payment_id = payment.id || null;
    pedido.status_detail = payment.status_detail || null;
    pedido.metodo_pagamento = payment.payment_method_id || null;
    pedido.atualizadoEm = new Date();

    await pedido.save();

    console.log(`Pedido ${pedidoId} atualizado para status ${payment.status}`);

    const statusAtual = String(payment.status || "").toLowerCase();

    if (statusAtual === "approved" && statusAnterior !== "approved") {
      await enviarEmailNovoPagamento(pedido, payment);
    }

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

app.get("/api/pedidos/abandonados", autenticarAdmin, async (req, res) => {
  try {
    const minutos = Math.max(1, Number(req.query.minutos || 30));
    const limite = new Date(Date.now() - minutos * 60 * 1000);

    const pedidos = await Pedido.find({
      status: "pending",
      criadoEm: { $lte: limite },
      $or: [
        { "dadosCliente.nome": { $exists: true, $ne: "" } },
        { "dadosCliente.email": { $exists: true, $ne: "" } },
        { "dadosCliente.telefone": { $exists: true, $ne: "" } },
        { "dadosCliente.cpf": { $exists: true, $ne: "" } },
      ],
    }).sort({ criadoEm: -1 });

    return res.json({
      pedidos: pedidos.map(normalizarPedidoResposta),
      total: pedidos.length,
      minutos,
    });
  } catch (error) {
    console.error("Erro ao buscar carrinhos abandonados:", error);

    return res.status(500).json({
      error: "Erro ao buscar carrinhos abandonados.",
      message: error.message,
    });
  }
});

app.get("/api/pedidos/publico/:id", async (req, res) => {
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

    return res.json(normalizarPedidoResposta(pedido));
  } catch (error) {
    console.error("Erro ao buscar pedido público:", error);

    return res.status(500).json({
      error: "Erro ao buscar pedido.",
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
   ATUALIZAÇÃO MANUAL DE PEDIDO
========================= */
app.patch("/api/pedidos/:id/manual", autenticarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      tipoEntrega,
      freteSelecionado,
      carrinho,
      totalItensCarrinho,
      subtotalProdutos,
      descontoCupom,
      totalComFrete,
      statusInterno,
      observacaoInterna,
      ajusteManual,
      atualizadoManualmenteEm,
    } = req.body || {};

    const pedido = await Pedido.findOne({
      $or: [{ id: String(id) }, { pedidoLocalId: String(id) }],
    });

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    if (tipoEntrega !== undefined) {
      pedido.tipoEntrega = String(tipoEntrega || "").trim();
    }

    if (freteSelecionado !== undefined) {
      pedido.freteSelecionado = {
        ...(pedido.freteSelecionado || {}),
        ...(freteSelecionado || {}),
      };
    }

    if (carrinho !== undefined) {
      const carrinhoNormalizado = normalizarCarrinhoPedido(carrinho || []);
      pedido.carrinho = carrinhoNormalizado;

      pedido.totalItensCarrinho = carrinhoNormalizado.reduce(
        (total, item) => total + Math.max(1, Number(item?.quantidade || 1)),
        0
      );

      pedido.subtotalProdutos = calcularSubtotalCarrinho(carrinhoNormalizado);

      if (totalItensCarrinho !== undefined) {
        pedido.totalItensCarrinho = Number(totalItensCarrinho || 0);
      }
    } else if (totalItensCarrinho !== undefined) {
      pedido.totalItensCarrinho = Number(totalItensCarrinho || 0);
    }

    if (subtotalProdutos !== undefined) {
      pedido.subtotalProdutos = arredondar(Number(subtotalProdutos || 0));
    }

    if (descontoCupom !== undefined) {
      pedido.descontoCupom = arredondar(Number(descontoCupom || 0));
    }

    if (totalComFrete !== undefined) {
      pedido.totalComFrete = arredondar(Number(totalComFrete || 0));
    } else {
      const subtotalAtual = arredondar(Number(pedido.subtotalProdutos || 0));
      const descontoAtual = arredondar(Number(pedido.descontoCupom || 0));
      const freteAtual = arredondar(
        Number(pedido?.freteSelecionado?.preco || 0)
      );

      pedido.totalComFrete = arredondar(
        subtotalAtual + freteAtual - descontoAtual
      );
    }

    if (statusInterno !== undefined) {
      pedido.statusInterno = normalizarStatusInterno(statusInterno);
    }

    if (observacaoInterna !== undefined) {
      pedido.observacaoInterna = String(observacaoInterna || "").trim();
    }

    if (ajusteManual !== undefined) {
      pedido.ajusteManual = Boolean(ajusteManual);
    }

    if (atualizadoManualmenteEm !== undefined) {
      pedido.atualizadoManualmenteEm = atualizadoManualmenteEm
        ? new Date(atualizadoManualmenteEm)
        : null;
    }

    if (pedido.tipoEntrega === "retirada") {
      pedido.freteSelecionado = {
        ...(pedido.freteSelecionado || {}),
        nome: pedido?.freteSelecionado?.nome || "Retirada no local",
        preco: 0,
      };

      if (
        ![
          "retirada_recebido",
          "retirada_preparando",
          "retirada_pronto",
          "retirada_concluido",
        ].includes(String(pedido.statusInterno || "").toLowerCase())
      ) {
        pedido.statusInterno = "retirada_recebido";
      }

      pedido.etiquetaGerada = false;
      pedido.etiquetaEmitida = false;
      pedido.statusEtiqueta = null;
      pedido.urlEtiqueta = "";
      pedido.codigoRastreio = "";
      pedido.superfreteCartId = null;
      pedido.superfreteCheckoutId = null;

      const subtotalAtual = arredondar(Number(pedido.subtotalProdutos || 0));
      const descontoAtual = arredondar(Number(pedido.descontoCupom || 0));
      pedido.totalComFrete = arredondar(subtotalAtual - descontoAtual);
    }

    pedido.atualizadoEm = new Date();

    await pedido.save();

    return res.json({
      message: "Pedido atualizado manualmente com sucesso.",
      pedido: normalizarPedidoResposta(pedido),
    });
  } catch (error) {
    console.error("Erro ao editar pedido manualmente:", error);

    return res.status(500).json({
      error: "Erro ao editar pedido manualmente.",
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

    const validacaoRemetente = validarRemetente();
    if (!validacaoRemetente.valido) {
      return res.status(400).json({
        error: "Dados do remetente incompletos.",
        faltando: validacaoRemetente.faltando,
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
      products: normalizarCarrinhoPedido(pedido.carrinho || []).map((item, idx) => ({
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
        receipt: Boolean(
          pedido?.freteSelecionado?.additional_services?.receipt
        ),
        own_hand: Boolean(
          pedido?.freteSelecionado?.additional_services?.own_hand
        ),
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

    const superfreteResponse = await fetch(
      `${SUPERFRETE_BASE_URL}/api/v0/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
          "User-Agent": SUPERFRETE_USER_AGENT,
        },
        body: JSON.stringify(payloadCheckout),
      }
    );

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

app.get("/ping", async (req, res) => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        ok: false,
        message: "MongoDB não está conectado",
        readyState: mongoose.connection?.readyState ?? null,
      });
    }

    await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      ok: true,
      message: "Servidor e MongoDB ativos",
      mongoReadyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro no /ping:", error);
    return res.status(500).json({
      ok: false,
      message: "Erro ao pingar MongoDB",
      error: error.message,
    });
  }
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