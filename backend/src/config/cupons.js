/**
 * Cadastro central de cupons
 *
 * Edite SOMENTE este arquivo para:
 * - criar novos cupons
 * - ativar/desativar
 * - alterar datas
 * - alterar regras
 */

const CUPONS = {
  PRIMEIRA5: {
    codigo: "PRIMEIRA5",
    tipo: "percentual", // percentual | fixo | frete
    valor: 5,
    ativo: true,
    dataInicio: "2026-01-01",
    dataFim: "2026-12-31",
    valorMinimoPedido: 120,
    primeiraCompra: true, // se true, só pode ser usado na primeira compra do cliente
  },
  
  BELEZINHA10: {
    codigo: "BELEZINHA10",
    tipo: "percentual", // percentual | fixo | frete
    valor: 10,
    ativo: true,
    dataInicio: "2026-01-01",
    dataFim: "2026-12-31",
    valorMinimoPedido: 1,
    primeiraCompra: false, // se true, só pode ser usado na primeira compra do cliente
    },

    JAZZZ100: {
    codigo: "JAZZZ100",
    tipo: "percentual", // percentual | fixo | frete
    valor: 99,
    ativo: true,
    dataInicio: "2026-01-01",
    dataFim: "2026-12-31",
    valorMinimoPedido: 0,
    primeiraCompra: false, // se true, só pode ser usado na primeira compra do cliente
    },
  }
export default CUPONS;