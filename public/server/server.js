import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SUPERFRETE_TOKEN = process.env.SUPERFRETE_TOKEN;
const SUPERFRETE_USER_AGENT = process.env.SUPERFRETE_USER_AGENT;
const CEP_ORIGEM = process.env.CEP_ORIGEM;
const SERVICES = "1,2,17";

function num(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === "") return fallback;
  const convertido = Number(String(valor).replace(",", "."));
  return Number.isFinite(convertido) ? convertido : fallback;
}

function limparCep(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function validarConfiguracao() {
  const faltando = [];

  if (!SUPERFRETE_TOKEN) faltando.push("SUPERFRETE_TOKEN");
  if (!SUPERFRETE_USER_AGENT) faltando.push("SUPERFRETE_USER_AGENT");
  if (!CEP_ORIGEM) faltando.push("CEP_ORIGEM");

  if (faltando.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${faltando.join(", ")}`);
  }
}

function calcularSubtotal(carrinho) {
  return carrinho.reduce((acc, item) => {
    const preco = num(item.preco, 0);
    const quantidade = Math.max(1, Math.round(num(item.quantidade, 1)));
    return acc + preco * quantidade;
  }, 0);
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

app.get("/", (_req, res) => {
  res.send("Servidor de frete ativo.");
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

app.listen(PORT, () => {
  console.log(`Servidor de frete rodando em http://localhost:${PORT}`);
});