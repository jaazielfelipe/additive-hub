import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SUPERFRETE_TOKEN = process.env.SUPERFRETE_TOKEN;
const SUPERFRETE_USER_AGENT = process.env.SUPERFRETE_USER_AGENT;
const CEP_ORIGEM = process.env.CEP_ORIGEM;
const SERVICES = "1,2,17";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const FRONT_URL = process.env.FRONT_URL || "http://localhost:5173";

const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
});

function num(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === "") return fallback;
  const convertido = Number(String(valor).replace(",", "."));
  return Number.isFinite(convertido) ? convertido : fallback;
}

function limparCep(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function calcularSubtotal(carrinho) {
  if (!Array.isArray(carrinho)) return 0;

  return carrinho.reduce((total, item) => {
    const preco = num(item.preco, 0);
    const quantidade = Math.max(1, Math.round(num(item.quantidade, 1)));
    return total + preco * quantidade;
  }, 0);
}

function validarConfiguracao() {
  const faltando = [];

  if (!SUPERFRETE_TOKEN) faltando.push("SUPERFRETE_TOKEN");
  if (!SUPERFRETE_USER_AGENT) faltando.push("SUPERFRETE_USER_AGENT");
  if (!CEP_ORIGEM) faltando.push("CEP_ORIGEM");
  if (!MP_ACCESS_TOKEN) faltando.push("MP_ACCESS_TOKEN");

  if (faltando.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${faltando.join(", ")}`);
  }
}

function montarItensMercadoPago(carrinho, freteSelecionado) {
  const items = carrinho.map((item) => {
    const preco = num(item.preco, 0);
    const quantidade = Math.max(1, Math.round(num(item.quantidade, 1)));

    return {
      id: String(item.id || item.nome),
      title: item.nome || "Produto",
      quantity: quantidade,
      unit_price: Number(preco.toFixed(2)),
      currency_id: "BRL",
    };
  });

  if (freteSelecionado) {
    const precoFrete = num(
      freteSelecionado.preco ??
        freteSelecionado.price ??
        freteSelecionado.custom_price ??
        freteSelecionado.total_price,
      0
    );

    if (precoFrete > 0) {
      items.push({
        id: "frete",
        title: `Frete - ${
          freteSelecionado.nome ||
          freteSelecionado.name ||
          freteSelecionado.service_description ||
          "Entrega"
        }`,
        quantity: 1,
        unit_price: Number(precoFrete.toFixed(2)),
        currency_id: "BRL",
      });
    }
  }

  return items;
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

  caixas.sort((a, b) => (b.length * b.width) - (a.length * a.width));

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

    // folga
    comprimentoFinal += 2;
    larguraFinal += 2;
    alturaFinal += 1;

    const ladosFinais = [comprimentoFinal, larguraFinal, alturaFinal].sort((a, b) => b - a);

    const pacote = {
      length: Number(ladosFinais[0].toFixed(1)),
      width: Number(ladosFinais[1].toFixed(1)),
      height: Number(Math.max(1, ladosFinais[2]).toFixed(1)),
    };

    const volume = pacote.length * pacote.width * pacote.height;

    // custo ponderado para evitar pacotes muito largos/altos
    const custo =
      volume +
      pacote.length * 2 +
      pacote.width * 1.5 +
      pacote.height * 2;

    return {
      larguraMaximaLinha,
      pacote,
      volume: Number(volume.toFixed(2)),
      custo: Number(custo.toFixed(2)),
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
    _arranjo: {
      larguraMaximaLinha: melhor.larguraMaximaLinha,
      volume: melhor.volume,
      custo: melhor.custo,
      tentativas,
    },
  };
}

app.get("/", (_req, res) => {
  res.send("Servidor ativo.");
});

app.post("/api/frete", async (req, res) => {
  try {
    validarConfiguracao();

    const { cepDestino, carrinho } = req.body || {};

    if (!cepDestino) {
      return res.status(400).json({ error: "CEP de destino é obrigatório." });
    }

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const cepOrigemLimpo = limparCep(CEP_ORIGEM);
    const cepDestinoLimpo = limparCep(cepDestino);

    if (cepOrigemLimpo.length !== 8) {
      return res.status(400).json({ error: "CEP de origem inválido no .env." });
    }

    if (cepDestinoLimpo.length !== 8) {
      return res.status(400).json({ error: "CEP de destino inválido." });
    }

    const subtotal = calcularSubtotal(carrinho);
    const pacoteUnico = montarPacoteUnico(carrinho);

    const products = [
      {
        id: pacoteUnico.id,
        name: pacoteUnico.name,
        quantity: pacoteUnico.quantity,
        weight: pacoteUnico.weight,
        height: pacoteUnico.height,
        width: pacoteUnico.width,
        length: pacoteUnico.length,
      },
    ];

    const payload = {
      from: {
        postal_code: cepOrigemLimpo,
      },
      to: {
        postal_code: cepDestinoLimpo,
      },
      services: SERVICES,
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: Number(subtotal.toFixed(2)),
        use_insurance_value: false,
      },
      products,
    };

    console.log("CEP origem:", cepOrigemLimpo);
    console.log("CEP destino:", cepDestinoLimpo);
    console.log("Pacote único:", JSON.stringify(pacoteUnico, null, 2));
    console.log("Products enviados:", JSON.stringify(products, null, 2));
    console.log("Subtotal / insurance_value:", subtotal);
    console.log("Services:", payload.services);
    console.log("Use insurance:", payload.options.use_insurance_value);
    console.log("Payload final:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      "https://sandbox.superfrete.com/api/v0/calculator",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
          "User-Agent": SUPERFRETE_USER_AGENT,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const texto = await response.text();

    console.log("Status SuperFrete:", response.status);
    console.log("Resposta bruta SuperFrete:", texto);

    let data;
    try {
      data = texto ? JSON.parse(texto) : {};
    } catch {
      data = { raw: texto };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro ao consultar frete na SuperFrete.",
        message:
          data?.error ||
          data?.message ||
          data?.details?.message ||
          "Erro ao consultar frete.",
        details: data,
        status: response.status,
        payloadEnviado: payload,
        pacoteUnico,
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Erro interno no backend de frete:", error);

    return res.status(500).json({
      error: "Erro interno ao calcular frete.",
      message: error.message,
    });
  }
});

app.post("/api/pagamentos/criar-preferencia", async (req, res) => {
  try {
    const { carrinho, freteSelecionado } = req.body || {};

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const items = carrinho.map((item) => ({
      id: String(item.id || item.nome),
      title: item.nome || "Produto",
      quantity: Number(item.quantidade || 1),
      unit_price: Number(item.preco || 0),
      currency_id: "BRL",
    }));

    if (freteSelecionado?.preco) {
      items.push({
        id: "frete",
        title: `Frete - ${freteSelecionado.nome || "Entrega"}`,
        quantity: 1,
        unit_price: Number(freteSelecionado.preco),
        currency_id: "BRL",
      });
    }

    const preference = new Preference(mpClient);

    const response = await preference.create({
  body: {
    items,
    back_urls: {
      success: "https://catalogo-additive-hub.vercel.app/pagamento/sucesso",
      failure: "https://catalogo-additive-hub.vercel.app/pagamento/falha",
      pending: "https://catalogo-additive-hub.vercel.app/pagamento/pendente",
    },
    notification_url: "https://additive-hub.onrender.com/api/webhook",
    auto_return: "approved",
    external_reference: `pedido_${Date.now()}`,
  },
});

    return res.json({
      preferenceId: response.id,
      initPoint: response.init_point,
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

app.listen(PORT, () => {
  console.log(`Servidor de frete rodando em http://localhost:${PORT}`);
});