import CUPONS from "../config/cupons.js";

/**
 * Converte YYYY-MM-DD para início do dia
 */
function criarDataInicio(dataString) {
  return new Date(`${dataString}T00:00:00`);
}

/**
 * Converte YYYY-MM-DD para fim do dia
 */
function criarDataFim(dataString) {
  return new Date(`${dataString}T23:59:59`);
}

/**
 * Arredonda para 2 casas
 */
function arredondar(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

/**
 * Valida e calcula cupom
 */
function validarCupom({ codigo, subtotal, frete }) {
  const codigoNormalizado = String(codigo || "").trim().toUpperCase();
  const subtotalNumero = Number(subtotal || 0);
  const freteNumero = Number(frete || 0);

  if (!codigoNormalizado) {
    throw new Error("Digite um cupom.");
  }

  const cupom = CUPONS[codigoNormalizado];

  if (!cupom) {
    throw new Error("Cupom inválido.");
  }

  if (!cupom.ativo) {
    throw new Error("Cupom inativo.");
  }

  const agora = new Date();

  if (cupom.dataInicio) {
    const inicio = criarDataInicio(cupom.dataInicio);
    if (agora < inicio) {
      throw new Error("Este cupom ainda não está disponível.");
    }
  }

  if (cupom.dataFim) {
    const fim = criarDataFim(cupom.dataFim);
    if (agora > fim) {
      throw new Error("Cupom expirado.");
    }
  }

  if (subtotalNumero < Number(cupom.valorMinimoPedido || 0)) {
    throw new Error(
      `Cupom disponível apenas para pedidos acima de R$ ${Number(
        cupom.valorMinimoPedido || 0
      ).toFixed(2)}.`
    );
  }

  let desconto = 0;

  if (cupom.tipo === "percentual") {
    desconto = subtotalNumero * (Number(cupom.valor || 0) / 100);
  }

  if (cupom.tipo === "fixo") {
    desconto = Number(cupom.valor || 0);
  }

  if (cupom.tipo === "frete") {
    desconto = freteNumero;
  }

  desconto = Math.min(desconto, subtotalNumero + freteNumero);
  desconto = arredondar(desconto);

  const totalComDesconto = arredondar(
    subtotalNumero + freteNumero - desconto
  );

  return {
    codigo: cupom.codigo,
    tipo: cupom.tipo,
    valor: cupom.valor,
    desconto,
    subtotal: arredondar(subtotalNumero),
    frete: arredondar(freteNumero),
    totalComDesconto,
    dataInicio: cupom.dataInicio || null,
    dataFim: cupom.dataFim || null,
    valorMinimoPedido: Number(cupom.valorMinimoPedido || 0),
  };
}

export default validarCupom;