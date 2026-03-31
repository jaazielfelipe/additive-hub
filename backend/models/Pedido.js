import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    pedidoLocalId: { type: String, index: true },

    carrinho: [
      {
        id: mongoose.Schema.Types.Mixed,
        nome: String,
        quantidade: Number,
        preco: Number,
        peso: Number,
        altura: Number,
        largura: Number,
        comprimento: Number,

        carrinhoKey: String,

        selecoesVariacao: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },

        resumoVariacoes: [
          {
            nome: String,
            valor: String,
          },
        ],

        categoria: String,
        categoriaLabel: String,
        subcategoria: String,
        subcategoriaLabel: String,
        subcategoria2: String,
        subcategoria2Label: String,
        imagens: [String],
        descricao: String,
        destaque: String,
      },
    ],

    freteSelecionado: {
      nome: String,
      preco: Number,
      service: Number,
      package: {
        width: Number,
        height: Number,
        length: Number,
        weight: Number,
      },
      additional_services: {
        receipt: Boolean,
        own_hand: Boolean,
      },
    },

    tipoEntrega: {
      type: String,
      enum: ["entrega", "retirada"],
      default: "entrega",
      index: true,
    },

    cepDestino: String,
    totalItensCarrinho: Number,
    subtotalProdutos: Number,
    totalComFrete: Number,
    descontoCupom: Number,

    cupomAplicado: {
      codigo: String,
      tipo: String,
      valor: Number,
      dataInicio: String,
      dataFim: String,
      valorMinimoPedido: Number,
      primeiraCompra: Boolean,
    },

    dadosCliente: {
      nome: String,
      email: { type: String, index: true },
      telefone: String,
      cpf: { type: String, index: true },
    },

    enderecoEntrega: {
      cep: String,
      rua: String,
      bairro: String,
      cidade: String,
      estado: String,
      numero: String,
      complemento: String,
    },

    status: { type: String, default: "pending", index: true },

    statusInterno: {
  type: String,
  enum: [
    "chegou",
    "para_confirmar",
    "a_emitir",
    "emitido",
    "enviado",
    "retirada_recebido",
    "retirada_preparando",
    "retirada_pronto",
    "retirada_concluido",
  ],
  default: "chegou",
  index: true,
},

    payment_id: mongoose.Schema.Types.Mixed,
    status_detail: String,
    metodo_pagamento: String,

    etiquetaGerada: { type: Boolean, default: false },
    etiquetaEmitida: { type: Boolean, default: false },
    statusEtiqueta: String,
    urlEtiqueta: String,
    codigoRastreio: String,

    superfreteService: Number,
    superfretePackage: mongoose.Schema.Types.Mixed,
    superfreteCartId: mongoose.Schema.Types.Mixed,
    superfreteCheckoutId: mongoose.Schema.Types.Mixed,

    criadoEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date, default: null },
  },
  {
    versionKey: false,
  }
);

const Pedido =
  mongoose.models.Pedido || mongoose.model("Pedido", pedidoSchema);

export default Pedido;