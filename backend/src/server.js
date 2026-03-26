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
const SERVICES = "1,2,17";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const FRONT_URL = process.env.FRONT_URL || "http://localhost:5173";
const NOTIFICATION_URL =
  process.env.NOTIFICATION_URL ||
  "https://additive-hub.onrender.com/api/webhook";

console.log("FRONT_URL:", FRONT_URL);

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

app.get("/", (req, res) => {
  res.send("API Additive Hub online.");
});

app.post("/api/frete", async (req, res) => {
  try {
    const { cepDestino, carrinho } = req.body || {};

    if (!cepDestino) {
      return res.status(400).json({ error: "CEP de destino obrigatório." });
    }

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const produtos = carrinho.map((item) => ({
      id: String(item.id || "produto"),
      width: Number(item.largura || 11),
      height: Number(item.altura || 4),
      length: Number(item.comprimento || 16),
      weight: Number(item.peso || 0.3),
      insurance_value: Number(item.preco || 1),
      quantity: Number(item.quantidade || 1),
    }));

    const freteResponse = await fetch("https://api.superfrete.com/api/v0/calculator", {
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

app.post("/api/pagamentos/criar-preferencia", async (req, res) => {
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
    } = req.body || {};

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const pedidoId = `pedido_${Date.now()}`;

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

    pedidos.push({
      id: pedidoId,
      carrinho,
      freteSelecionado: freteSelecionado || null,
      cepDestino: cepDestino || null,
      totalItensCarrinho: totalItensCarrinho || 0,
      subtotalProdutos: subtotalProdutos || 0,
      totalComFrete: totalComFrete || 0,
      status: "pending",
      payment_id: null,
      status_detail: null,
      metodo_pagamento: null,
      criadoEm: new Date().toISOString(),
      atualizadoEm: null,
    });

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

app.get("/api/pedidos/:id", (req, res) => {
  try {
    const { id } = req.params;
    const pedidos = lerPedidos();
    const pedido = pedidos.find((p) => p.id === id);

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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});