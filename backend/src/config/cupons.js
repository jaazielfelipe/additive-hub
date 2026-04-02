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
    valorMinimoPedido: 150,
    primeiraCompra: true, // se true, só pode ser usado na primeira compra do cliente
  },
  
  BELEZINHA: {
    codigo: "BELEZINHA",
    tipo: "percentual", // percentual | fixo | frete
    valor: 5,
    ativo: true,
    dataInicio: "2026-01-01",
    dataFim: "2026-12-31",
    valorMinimoPedido: 10,
    primeiraCompra: true, // se true, só pode ser usado na primeira compra do cliente
    } 
  }
export default CUPONS;