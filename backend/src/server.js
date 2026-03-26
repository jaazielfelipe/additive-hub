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
      (p) => String(p.id) === String(pedidoId) || String(p.pedidoLocalId) === String(pedidoId)
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
      urlEtiqueta: "",
      codigoRastreio: "",

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
   ACOMPANHAR PEDIDO
========================= */
app.get("/api/pedidos/acompanhar", (req, res) => {
  try {
    const { id, email } = req.query;

    if (!id || !email) {
      return res.status(400).json({
        error: "Informe o número do pedido e o e-mail.",
      });
    }

    const pedidos = lerPedidos();

    const pedido = pedidos.find(
      (p) =>
        (String(p.id || "").trim() === String(id || "").trim() ||
          String(p.pedidoLocalId || "").trim() === String(id || "").trim()) &&
        String(p?.dadosCliente?.email || "").trim().toLowerCase() ===
          String(email || "").trim().toLowerCase()
    );

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    return res.json(pedido);
  } catch (error) {
    console.error("Erro ao acompanhar pedido:", error);

    return res.status(500).json({
      error: "Erro ao buscar pedido.",
      message: error.message,
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
   GERAR ETIQUETA
   MOCK PRONTO PARA TROCAR PELA API REAL
========================= */
app.post("/api/pedidos/:id/gerar-etiqueta", (req, res) => {
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

    if (!pedido?.enderecoEntrega?.bairro || !pedido?.enderecoEntrega?.cidade || !pedido?.enderecoEntrega?.estado) {
      return res.status(400).json({
        error: "Endereço de entrega incompleto.",
      });
    }

    /*
      AQUI entra a integração real da sua API de etiquetas.
      Exemplo do que você enviaria para a API:

      const payloadEtiqueta = {
        pedidoId: pedido.id,
        destinatario: {
          nome: pedido?.dadosCliente?.nome,
          email: pedido?.dadosCliente?.email,
          telefone: pedido?.dadosCliente?.telefone,
          cpf: pedido?.dadosCliente?.cpf,
        },
        entrega: pedido?.enderecoEntrega,
        itens: pedido?.carrinho,
        frete: pedido?.freteSelecionado,
        total: pedido?.totalComFrete,
      };
    */

    const codigoRastreioFake = `ADD${Date.now()}`;
    const urlEtiquetaFake = `${FRONT_URL}/etiquetas/${pedido.id}.pdf`;

    pedidos[index].etiquetaGerada = true;
    pedidos[index].codigoRastreio = pedido.codigoRastreio || codigoRastreioFake;
    pedidos[index].urlEtiqueta = pedido.urlEtiqueta || urlEtiquetaFake;
    pedidos[index].atualizadoEm = new Date().toISOString();

    salvarPedidos(pedidos);

    return res.json({
      message: "Etiqueta gerada com sucesso.",
      urlEtiqueta: pedidos[index].urlEtiqueta,
      codigoRastreio: pedidos[index].codigoRastreio,
      pedido: pedidos[index],
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
   EMITIR ETIQUETA
========================= */
app.post("/api/pedidos/:id/emitir-etiqueta", (req, res) => {
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

    if (!pedidos[index].etiquetaGerada) {
      return res.status(400).json({
        error: "Gere a etiqueta antes de emitir.",
      });
    }

    pedidos[index].etiquetaEmitida = true;
    pedidos[index].statusInterno = "enviado";
    pedidos[index].atualizadoEm = new Date().toISOString();

    salvarPedidos(pedidos);

    return res.json({
      message: "Etiqueta emitida com sucesso.",
      urlEtiqueta: pedidos[index].urlEtiqueta,
      codigoRastreio: pedidos[index].codigoRastreio,
      pedido: pedidos[index],
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