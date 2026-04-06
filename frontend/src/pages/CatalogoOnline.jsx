import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SITE_BASE_URL = import.meta.env.BASE_URL || "/";

function slugCategoria(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function tituloCategoria(valor) {
  const chave = slugCategoria(valor);

  const mapa = {
    "casa-oraganizacao": "Casa & Organização",
    "casa-organizacao": "Casa & Organização",
    chaveiros: "Chaveiros",
    decoracao: "Decoração",
    "its-organic": "It's Organic",
  };

  if (mapa[chave]) return mapa[chave];

  return String(valor || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function tituloItem(valor) {
  const textoOriginal = String(valor || "").trim();
  const chave = slugCategoria(textoOriginal);

  const mapa = {
    "jogos-hobby": "Jogos & Hobby",
    imas: "Ímãs",
    rosqueaveis: "Rosqueáveis",
    rosqueavel: "Rosqueável",
    bic: "BIC",
    abstratas: "Abstratas",
    capsulas: "Cápsulas",
    capsula: "Cápsulas",
    cápsula: "Cápsulas",
    cápsulas: "Cápsulas",
    "3d": "3D",
    "mini-flexi": "Mini-flexi",
    "mini flexi": "Mini-flexi",
    "porta-cartas": "Porta-cartas",
    "porta cartas": "Porta-cartas",
    "porta retrato": "Porta-retratos"
  };

  if (mapa[chave]) return mapa[chave];
  if (mapa[textoOriginal.toLowerCase()]) return mapa[textoOriginal.toLowerCase()];

  const palavrasMinusculas = [
    "de",
    "da",
    "do",
    "das",
    "dos",
    "para",
    "com",
    "e",
    "em",
    "por",
  ];

  return textoOriginal
    .replace(/-/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((palavra, index) => {
      if (index === 0) {
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
      }

      if (palavrasMinusculas.includes(palavra)) {
        return palavra;
      }

      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

const produtosPadrao = [
  {
    id: 1,
    nome: "Chaveiro Personalizado",
    categoria: "Chaveiro",
    subcategoria: "Slim Personalizado",
    preco: 8,
    destaque: "",
    descricao:
      "Ideal para brindes, lembranças e revenda. Produzido em impressão 3D com acabamento personalizado.",
    imagens: [
      "/imagens/produtos/chaveiro-personalizado/1.png",
      "/imagens/produtos/chaveiro-personalizado/2.png",
    ],
    variacoes: [],
  },
  {
    id: 2,
    nome: "Miniatura 3D",
    categoria: "Decoração",
    subcategoria: "Miniaturas",
    preco: 25,
    destaque: "destaque",
    descricao:
      "Peça decorativa com design exclusivo para presentear, colecionar ou compor ambientes criativos.",
    imagens: [
      "/imagens/produtos/miniatura-3d/1.png",
      "/imagens/produtos/miniatura-3d/2.png",
    ],
    variacoes: [],
  },
  {
    id: 3,
    nome: "Suporte para Celular",
    categoria: "Utilidades",
    subcategoria: "Suportes",
    preco: 18,
    destaque: "novo",
    descricao:
      "Perfeito para mesa de trabalho, estudo ou uso diário. Design funcional com ótima estabilidade.",
    imagens: [
      "/imagens/produtos/suporte-celular/1.png",
      "/imagens/produtos/suporte-celular/2.png",
    ],
    variacoes: [],
  },
  {
    id: 4,
    nome: "Peça Decorativa 3D",
    categoria: "Decoração",
    subcategoria: "Itens para ambiente",
    preco: 30,
    destaque: "",
    descricao:
      "Item decorativo produzido em impressão 3D para compor ambientes com personalidade e criatividade.",
    imagens: [
      "/imagens/produtos/peca-decorativa-3d/1.png",
      "/imagens/produtos/peca-decorativa-3d/2.png",
    ],
    variacoes: [],
  },
  {
    id: 5,
    nome: "Organizador de Mesa",
    categoria: "Utilidades",
    subcategoria: "Organizadores",
    preco: 22,
    destaque: "promocao",
    descricao:
      "Ideal para organizar itens de escritório, bancada ou setup com um visual moderno e funcional.",
    imagens: [
      "/imagens/produtos/organizador-mesa/1.png",
      "/imagens/produtos/organizador-mesa/2.png",
    ],
    variacoes: [],
  },
  {
    id: 6,
    nome: "Projeto Sob Medida",
    categoria: "Personalizados",
    subcategoria: "Projetos sob medida",
    preco: 45,
    destaque: "",
    descricao:
      "Desenvolvemos peças personalizadas em impressão 3D para presentes, utilidades, decoração e projetos especiais.",
    imagens: ["/imagens/placeholder.png"],
    variacoes: [],
  },
];

const slidesDestaque = [
  
  {
    id: 1,
    tag: "Novidades",
    titulo: "Prepare-se para a Copa do Mundo 2026",
    subtitulo:
      "Entre no clima da Copa do Mundo 2026 com nossa coleção especial de miniaturas, chaveiros personalizados, porta-figurinhas e réplicas da taça",
    imagem: "/imagens/banners/banner-1.png",
    produtoId: 1,
  },
  {
    id: 2,
    tag: "Novidades",
    titulo: "Miniaturas Colecionáveis em 3D",
    subtitulo:
      "Explore uma coleção exclusiva de miniaturas inspiradas nos maiores clássicos do terror. Cada peça é produzida em impressão 3D com alto nível de detalhe, acabamento de qualidade e design marcante, perfeita para colecionadores e fãs do gênero.",
    imagem: "/imagens/banners/banner-2.png",
    produtoId: 1,
  },
  {
    id: 3,
    tag: "Em breve",
    titulo: "Funko-Pop Personalizado",
    subtitulo:
      "Estamos desenvolvendo uma nova linha de miniaturas estilo Funko-Pop totalmente personalizadas com base em pessoas reais. Ideal para presentes únicos, lembranças especiais ou até para eternizar momentos. Aguarde — em breve disponível para encomenda.",
    imagem: "/imagens/banners/banner-3.png",
    produtoId: 2,
  },
  {
    id: 4,
    tag: "Novidades",
    titulo: "Lançamentos e peças em destaque",
    subtitulo:
      "Acompanhe os modelos mais recentes e descubra novas ideias em impressão 3D para venda, presente e revenda.",
    imagem: "/imagens/banners/banner-4.png",
    produtoId: 3,
  },
];

function assetUrl(caminho) {
  const limpo = String(caminho || "").replace(/^\/+/, "");
  return `${SITE_BASE_URL}${limpo}`;
}

function normalizarCaminhoImagemCSV(caminho) {
  let valor = String(caminho || "")
    .trim()
    .replace(/\r/g, "")
    .replace(/\\/g, "/");

  if (!valor) return "";

  valor = valor.replace(/^https?:\/\/[^/]+/i, "");
  valor = valor.replace(/^\/+/, "");

  if (valor.startsWith("backend/data/imagens/produtos/")) {
    return valor.replace(
      /^backend\/data\/imagens\/produtos/i,
      "imagens/produtos"
    );
  }

  if (valor.startsWith("frontend/public/imagens/produtos/")) {
    return valor.replace(
      /^frontend\/public\/imagens\/produtos/i,
      "imagens/produtos"
    );
  }

  if (valor.startsWith("frontend/public/produtos/imagens/")) {
    return valor.replace(
      /^frontend\/public\/produtos\/imagens/i,
      "produtos/imagens"
    );
  }

  if (valor.startsWith("imagens/produtos/")) return valor;
  if (valor.startsWith("produtos/imagens/")) return valor;

  return valor;
}

function parseCSV(texto) {
  if (!texto || !texto.trim()) return [];

  const linhas = [];
  let linhaAtual = [];
  let campoAtual = "";
  let emAspas = false;

  for (let i = 0; i < texto.length; i += 1) {
    const char = texto[i];
    const proximo = texto[i + 1];

    if (char === '"') {
      if (emAspas && proximo === '"') {
        campoAtual += '"';
        i += 1;
      } else {
        emAspas = !emAspas;
      }
    } else if (char === "," && !emAspas) {
      linhaAtual.push(campoAtual);
      campoAtual = "";
    } else if ((char === "\n" || char === "\r") && !emAspas) {
      if (char === "\r" && proximo === "\n") i += 1;

      linhaAtual.push(campoAtual);
      campoAtual = "";

      const linhaTemConteudo = linhaAtual.some(
        (campo) => String(campo).trim() !== ""
      );

      if (linhaTemConteudo) linhas.push(linhaAtual);
      linhaAtual = [];
    } else {
      campoAtual += char;
    }
  }

  linhaAtual.push(campoAtual);

  const ultimaLinhaTemConteudo = linhaAtual.some(
    (campo) => String(campo).trim() !== ""
  );

  if (ultimaLinhaTemConteudo) linhas.push(linhaAtual);
  if (linhas.length < 2) return [];

  const limparCampo = (valor) =>
    String(valor ?? "")
      .replace(/\r/g, "")
      .trim();

  const cabecalhos = linhas[0].map((item) => limparCampo(item).toLowerCase());

  const cabecalhosEsperados = ["status", "id", "nome", "categoria"];
  const ehCSVValido = cabecalhosEsperados.every((coluna) =>
    cabecalhos.includes(coluna)
  );

  if (!ehCSVValido) return [];

  return linhas.slice(1).map((colunas, index) => {
    const item = {};

    cabecalhos.forEach((cabecalho, i) => {
      item[cabecalho] = limparCampo(colunas[i] ?? "");
    });

    const imagensBrutas = String(
      item.imagens || item.imagem || "/imagens/placeholder.png"
    );

    const imagens = imagensBrutas
      .split("|")
      .map((img) => normalizarCaminhoImagemCSV(limparCampo(img)))
      .filter(Boolean);

    const montarVariacao = (nome, valores) => {
      const nomeLimpo = limparCampo(nome);
      const opcoes = String(valores || "")
        .split("|")
        .map((opcao) => limparCampo(opcao))
        .filter(Boolean);

      if (!nomeLimpo || opcoes.length === 0) return null;

      return {
        nome: nomeLimpo,
        opcoes,
      };
    };

    const montarVariacaoAvancada = (nome, valores) => {
  const nomeLimpo = limparCampo(nome);
  const valorLimpo = limparCampo(valores);

  if (!nomeLimpo) return null;

  // 👇 NOVO: detectar campo de texto
  if (valorLimpo.toUpperCase() === "TEXTO") {
    return {
      nome: nomeLimpo,
      tipo: "texto",
    };
  }

  const opcoes = valorLimpo
    .split("|")
    .map((opcao) => limparCampo(opcao))
    .filter(Boolean);

  if (opcoes.length === 0) return null;

  return {
    nome: nomeLimpo,
    tipo: "opcoes",
    opcoes,
  };
};

const variacoes = [
  montarVariacaoAvancada(item.nome_variacao_1, item.variacoes_1),
  montarVariacaoAvancada(item.nome_variacao_2, item.variacoes_2),
  montarVariacaoAvancada(item.nome_variacao_3, item.variacoes_3), // 👈 NOVO
].filter(Boolean);

    const categoriaNormalizada = slugCategoria(item.categoria || "outros");
    const subcategoria = item.subcategoria || "";
    const subcategoria2 = item.subcategoria2 || "";

    return {
      id: item.id || String(index + 1),
      nome: item.nome || "Produto sem nome",
      categoria: categoriaNormalizada,
      categoriaLabel: tituloCategoria(item.categoria || categoriaNormalizada),
      subcategoria,
      subcategoriaLabel: tituloItem(subcategoria),
      subcategoria2,
      subcategoria2Label: tituloItem(subcategoria2),
      preco: Number(String(item.preco || "0").replace(",", ".")) || 0,
      destaque: slugCategoria(item.destaque || ""),
      descricao:
        item.descricao,
      imagens: imagens.length > 0 ? imagens : ["/imagens/placeholder.png"],
      variacoes,
      peso: Number(String(item.peso || "0").replace(",", ".")) || 0,
      altura: Number(String(item.altura || "0").replace(",", ".")) || 0,
      largura: Number(String(item.largura || "0").replace(",", ".")) || 0,
      comprimento:
        Number(String(item.comprimento || "0").replace(",", ".")) || 0,
    };
  });
}

function getImagemSrc(imagem) {
  if (!imagem) return assetUrl("imagens/placeholder.png");
  if (imagem.startsWith("http://") || imagem.startsWith("https://")) return imagem;

  const caminhoLimpo = normalizarCaminhoImagemCSV(imagem).replace(/^\/+/, "");
  return assetUrl(caminhoLimpo || "imagens/placeholder.png");
}

function ImagemProduto({ src, alt, className }) {
  return (
    <img
      src={getImagemSrc(src)}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = assetUrl("imagens/placeholder.png");
      }}
    />
  );
}

function IconeCarrinho({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
    </svg>
  );
}

function ControleQuantidade({
  quantidade,
  onDiminuir,
  onAumentar,
  compacto = false,
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-1.5 py-1 ${
        compacto ? "" : "shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={onDiminuir}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-base font-bold text-zinc-800 transition hover:bg-zinc-50"
      >
        −
      </button>

      <span className="min-w-[1.75rem] text-center text-sm font-semibold text-zinc-900">
        {quantidade}
      </span>

      <button
        type="button"
        onClick={onAumentar}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-base font-bold text-zinc-800 transition hover:bg-zinc-50"
      >
        +
      </button>
    </div>
  );
}

function normalizarTexto(valor) {
  return String(valor || "").trim();
}

function produtoTemVariacoes(produto) {
  return Array.isArray(produto?.variacoes) && produto.variacoes.length > 0;
}

function criarSelecoesIniciais(produto) {
  if (!produtoTemVariacoes(produto)) return {};

  return produto.variacoes.reduce((acc, variacao) => {
    if (variacao.tipo === "texto") {
      acc[variacao.nome] = "";
    } else {
      acc[variacao.nome] = "";
    }

    return acc;
  }, {});
}

function variacoesPreenchidas(produto, selecoes) {
  if (!produtoTemVariacoes(produto)) return true;

  return produto.variacoes.every((variacao) => {
    const valorSelecionado = normalizarTexto(selecoes?.[variacao.nome]);

    if (variacao.tipo === "texto") {
      return valorSelecionado.length > 0;
    }

    return valorSelecionado.length > 0;
  });
}

function montarResumoVariacoes(produto, selecoes) {
  if (!produtoTemVariacoes(produto)) return [];

  return produto.variacoes
    .map((variacao) => {
      const valor = normalizarTexto(selecoes?.[variacao.nome]);

      return {
        nome: variacao.nome,
        valor,
      };
    })
    .filter((item) => item.valor && item.valor.length > 0);
}

function gerarChaveCarrinho(produto, selecoes = {}) {
  const base = String(produto?.id ?? "");

  if (!produtoTemVariacoes(produto)) return base;

  const sufixo = produto.variacoes
    .map((variacao) => `${variacao.nome}:${normalizarTexto(selecoes?.[variacao.nome])}`)
    .join("|");

  return `${base}__${sufixo}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getBadgeDestaque(destaque) {
  const valor = slugCategoria(destaque);

  if (!valor) return null;

  const mapa = {
    destaque: {
      label: "Destaque",
      className: "border-white/70 bg-white/90 text-[#8b6900]",
    },
    novo: {
      label: "Novo",
      className: "border-blue-200/80 bg-blue-50/95 text-blue-700",
    },
    promocao: {
      label: "Promoção",
      className: "border-rose-200/80 bg-rose-50/95 text-rose-700",
    },
  };

  return mapa[valor] || null;
}

export default function CatalogoOnline() {
  const navigate = useNavigate();
  const { categoria, subcategoria, subcategoria2 } = useParams();

  const [produtos, setProdutos] = useState(produtosPadrao);
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [subcategoriaAtiva, setSubcategoriaAtiva] = useState("Todos");
  const [subcategoria2Ativa, setSubcategoria2Ativa] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState("destaque");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [slideAtual, setSlideAtual] = useState(0);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [categoriaMobileAberta, setCategoriaMobileAberta] = useState(null);
  const [animacoesCarrinho, setAnimacoesCarrinho] = useState([]);
  const [carrinhoDestacado, setCarrinhoDestacado] = useState(false);
  const [mostrarBarraCarrinhoMobile, setMostrarBarraCarrinhoMobile] = useState(false);
  const [selecoesVariacao, setSelecoesVariacao] = useState({});

  const botaoCarrinhoRef = useRef(null);
  const whatsapp = "5511978635579";

  const [carrinho, setCarrinho] = useState(() => {
    try {
      const carrinhoSalvo = localStorage.getItem("carrinhoAdditiveHub");
      return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("carrinhoAdditiveHub", JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    document.documentElement.lang = "pt-BR";
    document.documentElement.setAttribute("translate", "no");
    document.body.setAttribute("translate", "no");
  }, []);

  useEffect(() => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!apiBaseUrl) return;

  fetch(`${apiBaseUrl}/api/health`, {
    method: "GET",
    cache: "no-store",
  }).catch(() => {});
}, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const htmlOverflowAnchor = html.style.overflowAnchor;
    const bodyOverflowAnchor = body.style.overflowAnchor;
    const bodyOverscrollX = body.style.overscrollBehaviorX;

    html.style.overflowAnchor = "none";
    body.style.overflowAnchor = "none";
    body.style.overscrollBehaviorX = "none";

    return () => {
      html.style.overflowAnchor = htmlOverflowAnchor;
      body.style.overflowAnchor = bodyOverflowAnchor;
      body.style.overscrollBehaviorX = bodyOverscrollX;
    };
  }, []);

  useEffect(() => {
    async function carregarCSV() {
      const caminhos = [
        assetUrl("produtos.csv"),
        assetUrl("produtos/produtos.csv"),
      ];

      for (const caminho of caminhos) {
        try {
          const res = await fetch(caminho, { cache: "no-store" });
          if (!res.ok) continue;

          const texto = await res.text();
          const inicio = texto.trim().toLowerCase();

          if (
            inicio.startsWith("<!doctype html") ||
            inicio.startsWith("<html")
          ) {
            continue;
          }

          const lista = parseCSV(texto);

          if (lista.length > 0) {
            setProdutos(lista);
            return;
          }
        } catch (erro) {
          console.error(`Erro ao carregar CSV em ${caminho}:`, erro);
        }
      }

      setProdutos(produtosPadrao);
    }

    carregarCSV();
  }, []);

  useEffect(() => {
    if (categoria) {
      setCategoriaAtiva(categoria);
    } else {
      setCategoriaAtiva("Todos");
    }

    if (subcategoria) {
      setSubcategoriaAtiva(subcategoria);
    } else {
      setSubcategoriaAtiva("Todos");
    }

    if (subcategoria2) {
      setSubcategoria2Ativa(subcategoria2);
    } else {
      setSubcategoria2Ativa("Todos");
    }
  }, [categoria, subcategoria, subcategoria2]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSlideAtual((atual) => (atual + 1) % slidesDestaque.length);
    }, 4000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const tecla = (e) => {
      if (!produtoSelecionado) return;

      if (e.key === "Escape") {
        setProdutoSelecionado(null);
        setImagemAtiva(0);
        setSelecoesVariacao({});
      }

      if (e.key === "ArrowRight" && produtoSelecionado.imagens?.length > 1) {
        setImagemAtiva((atual) => (atual + 1) % produtoSelecionado.imagens.length);
      }

      if (e.key === "ArrowLeft" && produtoSelecionado.imagens?.length > 1) {
        setImagemAtiva((atual) =>
          atual === 0 ? produtoSelecionado.imagens.length - 1 : atual - 1
        );
      }
    };

    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [produtoSelecionado]);

  const menuCategorias = useMemo(() => {
    const mapa = new Map();

    produtos.forEach((produto) => {
      const chaveCategoria = slugCategoria(produto.categoria);
      if (!chaveCategoria) return;

      if (!mapa.has(chaveCategoria)) {
        mapa.set(chaveCategoria, {
          nome: produto.categoriaLabel || tituloCategoria(chaveCategoria),
          chave: chaveCategoria,
          itensMap: new Map(),
        });
      }

      const grupo = mapa.get(chaveCategoria);
      const sub = tituloItem(produto.subcategoriaLabel || produto.subcategoria);
      const sub2 = tituloItem(produto.subcategoria2Label || produto.subcategoria2);

      if (sub) {
        if (!grupo.itensMap.has(sub)) {
          grupo.itensMap.set(sub, new Set());
        }
        if (sub2) {
          grupo.itensMap.get(sub).add(sub2);
        }
      }
    });

    const lista = Array.from(mapa.values())
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .map((item) => ({
        nome: item.nome,
        chave: item.chave,
        itens: Array.from(item.itensMap.keys()).sort((a, b) => a.localeCompare(b, "pt-BR")),
        itensNivel2: Object.fromEntries(
          Array.from(item.itensMap.entries()).map(([sub, set]) => [
            sub,
            Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR")),
          ])
        ),
      }));

    return [...lista, { nome: "Quem somos", chave: "quem-somos", itens: [], itensNivel2: {} }];
  }, [produtos]);

  const categorias = useMemo(() => {
    const lista = [...new Set(produtos.map((produto) => produto.categoria))];
    return ["Todos", ...lista];
  }, [produtos]);

  const subcategoriasVisiveis = useMemo(() => {
    if (categoriaAtiva === "Todos") return [];

    return [
      ...new Set(
        produtos
          .filter((produto) => slugCategoria(produto.categoria) === categoriaAtiva)
          .map((produto) => produto.subcategoria)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [produtos, categoriaAtiva]);

  const subcategorias2Visiveis = useMemo(() => {
    if (categoriaAtiva === "Todos" || subcategoriaAtiva === "Todos") return [];

    return [
      ...new Set(
        produtos
          .filter(
            (produto) =>
              slugCategoria(produto.categoria) === categoriaAtiva &&
              slugCategoria(produto.subcategoria) === subcategoriaAtiva
          )
          .map((produto) => produto.subcategoria2)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [produtos, categoriaAtiva, subcategoriaAtiva]);

 const produtosFiltrados = useMemo(() => {
  const termo = busca.toLowerCase().trim();

  const filtrados = produtos.filter((produto) => {
    const bateCategoria =
      categoriaAtiva === "Todos" ||
      slugCategoria(produto.categoria) === categoriaAtiva;

    const bateSubcategoria =
      subcategoriaAtiva === "Todos" ||
      slugCategoria(produto.subcategoria) === subcategoriaAtiva;

    const bateSubcategoria2 =
      subcategoria2Ativa === "Todos" ||
      slugCategoria(produto.subcategoria2) === subcategoria2Ativa;

    const bateBusca =
      termo === "" ||
      (produto.nome || "").toLowerCase().includes(termo) ||
      (produto.categoriaLabel || produto.categoria || "")
        .toLowerCase()
        .includes(termo) ||
      (produto.subcategoriaLabel || produto.subcategoria || "")
        .toLowerCase()
        .includes(termo) ||
      (produto.subcategoria2Label || produto.subcategoria2 || "")
        .toLowerCase()
        .includes(termo) ||
      (produto.descricao || "").toLowerCase().includes(termo) ||
      (produto.variacoes || []).some((variacao) => {
        const nomeVariacao = (variacao.nome || "").toLowerCase();
        const opcoes = Array.isArray(variacao.opcoes) ? variacao.opcoes : [];

        return (
          nomeVariacao.includes(termo) ||
          opcoes.some((opcao) =>
            String(opcao || "").toLowerCase().includes(termo)
          )
        );
      });

    return bateCategoria && bateSubcategoria && bateSubcategoria2 && bateBusca;
  });

  if (termo) {
    return [...filtrados].sort((a, b) => {
      const score = (produto) => {
        let pontos = 0;

        if ((produto.nome || "").toLowerCase().startsWith(termo)) pontos += 100;
        else if ((produto.nome || "").toLowerCase().includes(termo)) pontos += 70;

        if ((produto.subcategoria || "").toLowerCase().includes(termo)) pontos += 30;
        if ((produto.subcategoria2 || "").toLowerCase().includes(termo)) pontos += 20;

        if (
          (produto.categoriaLabel || produto.categoria || "")
            .toLowerCase()
            .includes(termo)
        ) {
          pontos += 15;
        }

        if ((produto.descricao || "").toLowerCase().includes(termo)) pontos += 10;

        return pontos;
      };

      return score(b) - score(a);
    });
  }

  switch (ordenacao) {
    case "menor-preco":
      return [...filtrados].sort((a, b) => a.preco - b.preco);
    case "maior-preco":
      return [...filtrados].sort((a, b) => b.preco - a.preco);
    case "nome-az":
      return [...filtrados].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      );
    case "nome-za":
      return [...filtrados].sort((a, b) =>
        b.nome.localeCompare(a.nome, "pt-BR")
      );
    default:
      return filtrados;
  }
}, [
  produtos,
  categoriaAtiva,
  subcategoriaAtiva,
  subcategoria2Ativa,
  busca,
  ordenacao,
]);

  const produtosEmDestaque = useMemo(() => {
    return produtos.filter((produto) => produto.destaque === "destaque").slice(0, 8);
  }, [produtos]);

  const totalItensCarrinho = useMemo(() => {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
  }, [carrinho]);

  const totalCarrinho = useMemo(() => {
    return carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0);
  }, [carrinho]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.innerWidth >= 1024) {
      setMostrarBarraCarrinhoMobile(false);
      return;
    }

    setMostrarBarraCarrinhoMobile(totalItensCarrinho > 0);
  }, [totalItensCarrinho]);

const breadcrumb = useMemo(() => {
  const itens = [{ label: "Início", tipo: "inicio" }];

  if (categoriaAtiva !== "Todos") {
    itens.push({
      label: tituloCategoria(categoriaAtiva),
      tipo: "categoria",
    });
  }

  if (subcategoriaAtiva !== "Todos") {
    itens.push({
      label: tituloItem(subcategoriaAtiva),
      tipo: "subcategoria",
    });
  }

  if (subcategoria2Ativa !== "Todos") {
    itens.push({
      label: tituloItem(subcategoria2Ativa),
      tipo: "subcategoria2",
    });
  }

  return itens;
}, [categoriaAtiva, subcategoriaAtiva, subcategoria2Ativa]);

  const temBuscaAtiva = busca.trim() !== "";

const tituloTopo = useMemo(() => {
  if (temBuscaAtiva) {
    return `Resultados para "${busca.trim()}"`;
  }

  if (categoriaAtiva !== "Todos") {
    return tituloCategoria(categoriaAtiva);
  }

  return "Todos os produtos";
}, [categoriaAtiva, busca, temBuscaAtiva]);

const tituloCatalogo = useMemo(() => {
  if (temBuscaAtiva) {
    return `Resultados para "${busca.trim()}"`;
  }

  if (subcategoria2Ativa !== "Todos") {
    return tituloItem(subcategoria2Ativa);
  }

  if (subcategoriaAtiva !== "Todos") {
    return tituloItem(subcategoriaAtiva);
  }

  if (categoriaAtiva !== "Todos") {
    return tituloCategoria(categoriaAtiva);
  }

  return "Todos os produtos";
}, [categoriaAtiva, subcategoriaAtiva, subcategoria2Ativa, busca, temBuscaAtiva]);

  const estaEmPaginaFiltrada = useMemo(() => {
    return (
      categoriaAtiva !== "Todos" ||
      subcategoriaAtiva !== "Todos" ||
      subcategoria2Ativa !== "Todos"
    );
  }, [categoriaAtiva, subcategoriaAtiva, subcategoria2Ativa]);

const descricaoSecao = useMemo(() => {
  if (temBuscaAtiva) {
    return "Veja os produtos encontrados para a sua pesquisa.";
  }

  if (subcategoria2Ativa !== "Todos") {
    return `Explore nossa seleção da coleção ${tituloCategoria(
      categoriaAtiva
    )}, com foco em ${tituloItem(
      subcategoria2Ativa
    )} e peças produzidas em impressão 3D com qualidade, acabamento e funcionalidade.`;
  }

  if (subcategoriaAtiva !== "Todos") {
    return `Confira os produtos da coleção ${tituloCategoria(
      categoriaAtiva
    )}, com peças da linha ${tituloItem(
      subcategoriaAtiva
    )} produzidas em impressão 3D para unir design, funcionalidade e personalidade.`;
  }

  if (categoriaAtiva !== "Todos") {
    return `Veja os produtos da coleção ${tituloCategoria(
      categoriaAtiva
    )}, com peças desenvolvidas para unir design, praticidade e personalização.`;
  }

  return "Explore todo o catálogo de produtos em impressão 3D.";
}, [categoriaAtiva, subcategoriaAtiva, subcategoria2Ativa, busca, temBuscaAtiva]);

  useEffect(() => {
  const partes = ["Additive Hub"];

  if (categoriaAtiva !== "Todos") {
    partes.unshift(tituloCategoria(categoriaAtiva));
  }

  if (subcategoriaAtiva !== "Todos") {
    partes.unshift(tituloItem(subcategoriaAtiva));
  }

  if (subcategoria2Ativa !== "Todos") {
    partes.unshift(tituloItem(subcategoria2Ativa));
  }

  if (temBuscaAtiva) {
    partes.unshift(`Busca: ${busca.trim()}`);
  }

  document.title = partes.join(" | ");
}, [categoriaAtiva, subcategoriaAtiva, subcategoria2Ativa, busca, temBuscaAtiva]);

  const slideSelecionado = slidesDestaque[slideAtual];

  const abrirDetalhes = (produto) => {
    if (!produto) return;
    setProdutoSelecionado(produto);
    setImagemAtiva(0);
    setSelecoesVariacao(criarSelecoesIniciais(produto));
  };

  const fecharDetalhes = () => {
    setProdutoSelecionado(null);
    setImagemAtiva(0);
    setSelecoesVariacao({});
  };

  const quantidadeNoCarrinho = (produtoId) => {
    return carrinho
      .filter((item) => String(item.id) === String(produtoId))
      .reduce((total, item) => total + item.quantidade, 0);
  };

  const quantidadeDaCombinacaoNoCarrinho = (produto, selecoes = {}) => {
    const chave = gerarChaveCarrinho(produto, selecoes);
    return carrinho.find((item) => item.carrinhoKey === chave)?.quantidade || 0;
  };

  const animarProdutoParaCarrinho = (event) => {
    if (!event?.currentTarget || !botaoCarrinhoRef.current) return;

    const origem = event.currentTarget.getBoundingClientRect();
    const destino = botaoCarrinhoRef.current.getBoundingClientRect();

    const id = `${Date.now()}-${Math.random()}`;

    const item = {
      id,
      startX: origem.left + origem.width / 2,
      startY: origem.top + origem.height / 2,
      endX: destino.left + destino.width / 2,
      endY: destino.top + destino.height / 2,
    };

    setAnimacoesCarrinho((atual) => [...atual, item]);
    setCarrinhoDestacado(true);

    window.setTimeout(() => setCarrinhoDestacado(false), 450);
    window.setTimeout(() => {
      setAnimacoesCarrinho((atual) => atual.filter((anim) => anim.id !== id));
    }, 900);
  };

 const adicionarAoCarrinho = (produto, event, selecoes = {}) => {
  if (!produto) return;

  const abriuPeloModal = produtoSelecionado?.id === produto.id;

  const selecoesNormalizadas = Object.fromEntries(
    Object.entries(selecoes || {}).map(([chave, valor]) => [
      chave,
      normalizarTexto(valor),
    ])
  );

  if (
    produtoTemVariacoes(produto) &&
    !variacoesPreenchidas(produto, selecoesNormalizadas)
  ) {
    if (abriuPeloModal) {
      alert("Preencha todas as opções antes de adicionar ao carrinho.");
    } else {
      abrirDetalhes(produto);
    }
    return;
  }

  animarProdutoParaCarrinho(event);

  const resumoVariacoes = montarResumoVariacoes(produto, selecoesNormalizadas);
  const carrinhoKey = gerarChaveCarrinho(produto, selecoesNormalizadas);

  setCarrinho((anterior) => {
    const existente = anterior.find((item) => item.carrinhoKey === carrinhoKey);

    if (existente) {
      return anterior.map((item) =>
        item.carrinhoKey === carrinhoKey
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      );
    }

    return [
      ...anterior,
      {
        ...produto,
        quantidade: 1,
        carrinhoKey,
        selecoesVariacao: selecoesNormalizadas,
        resumoVariacoes,
      },
    ];
  });

  if (abriuPeloModal) {
    fecharDetalhes();
  }
};

  const diminuirQuantidade = (itemCarrinho) => {
    if (!itemCarrinho) return;

    setCarrinho((anterior) =>
      anterior
        .map((item) =>
          item.carrinhoKey === itemCarrinho.carrinhoKey
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  };

  const atualizarSelecaoVariacao = (nomeVariacao, valor) => {
    setSelecoesVariacao((anterior) => ({
      ...anterior,
      [nomeVariacao]: valor,
    }));
  };

  const irParaCatalogo = () => {
    const secao = document.getElementById("catalogo");
    secao?.scrollIntoView({ behavior: "smooth" });
  };

  const irParaQuemSomos = () => {
    const secao = document.getElementById("quem-somos");
    secao?.scrollIntoView({ behavior: "smooth" });
  };

  const limparFiltros = () => {
    setBusca("");
    setOrdenacao("destaque");
    setMenuMobileAberto(false);
    setCategoriaMobileAberta(null);
    navigate("/");

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  const selecionarCategoria = (categoriaEscolhida) => {
    setBusca("");
    setMenuMobileAberto(false);
    setCategoriaMobileAberta(null);

    if (categoriaEscolhida === "Todos") {
      navigate("/");
    } else {
      navigate(`/categoria/${categoriaEscolhida}`);
    }

    setTimeout(() => {
      irParaCatalogo();
    }, 50);
  };

  const selecionarSubcategoria = (categoriaEscolhida, subEscolhida) => {
    setBusca("");
    setMenuMobileAberto(false);
    setCategoriaMobileAberta(null);

    navigate(`/categoria/${categoriaEscolhida}/${slugCategoria(subEscolhida)}`);

    setTimeout(() => {
      irParaCatalogo();
    }, 50);
  };

  const selecionarSubcategoria2 = (categoriaEscolhida, subEscolhida, sub2Escolhida) => {
    setBusca("");
    setMenuMobileAberto(false);
    setCategoriaMobileAberta(null);

    navigate(
      `/categoria/${categoriaEscolhida}/${slugCategoria(subEscolhida)}/${slugCategoria(sub2Escolhida)}`
    );

    setTimeout(() => {
      irParaCatalogo();
    }, 50);
  };

  const proximoSlide = () => {
    setSlideAtual((atual) => (atual + 1) % slidesDestaque.length);
  };

  const slideAnterior = () => {
    setSlideAtual((atual) =>
      atual === 0 ? slidesDestaque.length - 1 : atual - 1
    );
  };

  const quantidadeModal = produtoSelecionado
    ? quantidadeDaCombinacaoNoCarrinho(produtoSelecionado, selecoesVariacao)
    : 0;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#fcfcfc] text-zinc-900"
      lang="pt-BR"
      translate="no"
    >
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
          <div className="flex flex-1 items-center gap-4 md:gap-12">
            <div className="flex items-center gap-3">
              <img
                src={assetUrl("logo.png")}
                alt="Additive Hub"
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                  Additive Hub
                </h1>
                <p className="text-sm text-zinc-500">Design e Impressão 3D</p>
              </div>
            </div>

            <nav className="ml-8 hidden flex-1 items-center justify-evenly lg:flex">
              {menuCategorias.map((categoriaItem) => {
                const temSubmenu = categoriaItem.itens.length > 0;

                if (!temSubmenu) {
                  const acao =
                    categoriaItem.chave === "quem-somos"
                      ? irParaQuemSomos
                      : () => selecionarCategoria(categoriaItem.chave);

                  return (
                    <button
                      key={categoriaItem.nome}
                      type="button"
                      onClick={acao}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      {categoriaItem.nome}
                    </button>
                  );
                }

                return (
                  <div key={categoriaItem.nome} className="group relative">
                    <button
                      type="button"
                      onClick={() => selecionarCategoria(categoriaItem.chave)}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      {categoriaItem.nome}
                    </button>

                    <div className="invisible absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-zinc-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => selecionarCategoria(categoriaItem.chave)}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#b38200] transition hover:bg-[#fff8df]"
                      >
                        Ver tudo em {categoriaItem.nome}
                      </button>

                      <div className="my-2 border-t border-zinc-100" />

                      {categoriaItem.itens.map((item) => (
                        <div key={item} className="group/item relative rounded-xl hover:bg-zinc-50">
                          <button
                            type="button"
                            onClick={() => selecionarSubcategoria(categoriaItem.chave, item)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700"
                          >
                            {item}

                            {categoriaItem.itensNivel2?.[item]?.length > 0 && (
                              <svg
                                className="h-4 w-4 text-zinc-400 transition group-hover/item:translate-x-1"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            )}
                          </button>

                          {categoriaItem.itensNivel2?.[item]?.length > 0 && (
                            <div className="invisible absolute left-full top-0 z-50 ml-1 w-64 rounded-2xl border border-zinc-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover/item:visible group-hover/item:opacity-100">
                              {categoriaItem.itensNivel2[item].map((itemNivel2) => (
                                <button
                                  type="button"
                                  key={`${item}-${itemNivel2}`}
                                  onClick={() =>
                                    selecionarSubcategoria2(categoriaItem.chave, item, itemNivel2)
                                  }
                                  className="block w-full rounded-xl px-3 py-1.5 text-left text-xs text-zinc-500 transition hover:bg-zinc-50"
                                >
                                  {itemNivel2}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuMobileAberto(true)}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white p-2.5 text-zinc-800 transition hover:bg-zinc-50 lg:hidden"
              aria-label="Abrir menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <a
              href="/#/acompanhar-pedido"
              className="hidden lg:inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Acompanhar pedido
            </a>

            <motion.button
              ref={botaoCarrinhoRef}
              type="button"
              onClick={() => {
                localStorage.setItem("carrinhoAdditiveHub", JSON.stringify(carrinho));
                window.location.href = "/#/carrinho";
              }}
              animate={
                carrinhoDestacado
                  ? { scale: [1, 1.12, 1], y: [0, -2, 0] }
                  : { scale: 1, y: 0 }
              }
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f4b400] px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
            >
              <IconeCarrinho className="h-4 w-4" />
              <span className="hidden sm:inline">Carrinho</span>
              {totalItensCarrinho > 0 && (
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-black px-2 text-xs font-bold text-white">
                  {totalItensCarrinho}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuMobileAberto && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setMenuMobileAberto(false);
                setCategoriaMobileAberta(null);
              }}
              aria-label="Fechar menu"
            />

            <motion.div
              className="absolute left-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white shadow-2xl"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
                <div>
                  <p className="text-lg font-bold text-zinc-900">Categorias</p>
                  <p className="text-sm text-zinc-500">Explore o catálogo</p>
                </div>

                <a
                  href="/#/acompanhar-pedido"
                  onClick={() => {
                    setMenuMobileAberto(false);
                    setCategoriaMobileAberta(null);
                  }}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Acompanhar Pedido
                </a>
              </div>

              <div className="p-3">
                <button
                  type="button"
                  onClick={() => selecionarCategoria("Todos")}
                  className="mb-2 block w-full rounded-2xl bg-[#f4b400] px-4 py-3 text-left text-sm font-semibold text-black"
                >
                  Ver todos os produtos
                </button>

                {menuCategorias.map((categoriaItem) => {
                  const temSubmenu = categoriaItem.itens.length > 0;
                  const aberta = categoriaMobileAberta === categoriaItem.nome;

                  if (!temSubmenu) {
                    const acao =
                      categoriaItem.chave === "quem-somos"
                        ? () => {
                            setMenuMobileAberto(false);
                            setCategoriaMobileAberta(null);
                            setTimeout(() => {
                              irParaQuemSomos();
                            }, 50);
                          }
                        : () => selecionarCategoria(categoriaItem.chave);

                    return (
                      <button
                        key={categoriaItem.nome}
                        type="button"
                        onClick={acao}
                        className="mb-2 block w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                      >
                        {categoriaItem.nome}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={categoriaItem.nome}
                      className="mb-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                    >
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => selecionarCategoria(categoriaItem.chave)}
                          className="flex-1 px-4 py-3 text-left text-sm font-semibold text-zinc-900"
                        >
                          {categoriaItem.nome}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setCategoriaMobileAberta((atual) =>
                              atual === categoriaItem.nome ? null : categoriaItem.nome
                            )
                          }
                          className="px-4 py-3 text-zinc-600"
                          aria-label={`Expandir ${categoriaItem.nome}`}
                        >
                          {aberta ? "−" : "+"}
                        </button>
                      </div>

                      {aberta && (
                        <div className="border-t border-zinc-100 bg-zinc-50 p-2">
                          <button
                            type="button"
                            onClick={() => selecionarCategoria(categoriaItem.chave)}
                            className="mb-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#b38200]"
                          >
                            Ver tudo em {categoriaItem.nome}
                          </button>

                          {categoriaItem.itens.map((item) => (
                            <div key={item}>
                              <button
                                type="button"
                                onClick={() =>
                                  selecionarSubcategoria(categoriaItem.chave, item)
                                }
                                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-white"
                              >
                                {item}
                              </button>

                              {categoriaItem.itensNivel2?.[item]?.length > 0 && (
                                <div className="pb-2 pl-3">
                                  {categoriaItem.itensNivel2[item].map((itemNivel2) => (
                                    <button
                                      key={`${item}-${itemNivel2}`}
                                      type="button"
                                      onClick={() =>
                                        selecionarSubcategoria2(
                                          categoriaItem.chave,
                                          item,
                                          itemNivel2
                                        )
                                      }
                                      className="block w-full rounded-xl px-3 py-1.5 text-left text-xs text-zinc-500 transition hover:bg-white"
                                    >
                                      {itemNivel2}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!estaEmPaginaFiltrada ? (
        <motion.section
          className="mx-auto max-w-7xl px-4 pb-8 pt-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-gradient-to-br from-white via-[#fffdf6] to-[#fff4cc] shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="grid gap-8 px-6 py-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-10 lg:items-stretch">
              <motion.div
                className="flex min-h-[380px] flex-col justify-center py-2 sm:min-h-[430px] lg:min-h-[500px]"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
              >
                <span className="inline-flex w-fit rounded-full border border-[#f4b400]/30 bg-[#f4b400]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b6900]">
                  {slideSelecionado?.tag || "Novidades"}
                </span>

                <h3 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                  {slideSelecionado?.titulo}
                </h3>

                <div className="mt-5 min-h-[190px] sm:min-h-[170px] lg:min-h-[210px]">
                  <p className="max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
                    {slideSelecionado?.tag === "Em breve" ? (
                      <>
                        {slideSelecionado.subtitulo.split("Aguarde")[0]}
                        <span className="mt-3 block font-semibold text-[#b38200]">
                          Aguarde — em breve disponível para encomenda.
                        </span>
                      </>
                    ) : (
                      slideSelecionado?.subtitulo
                    )}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  {slidesDestaque.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSlideAtual(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        slideAtual === index ? "w-10 bg-[#f4b400]" : "w-2.5 bg-zinc-300"
                      }`}
                      aria-label={`Ir para slide ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={slideAnterior}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={proximoSlide}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                  >
                    →
                  </button>
                </div>
              </motion.div>

              <motion.div
                className="self-center lg:self-stretch"
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              >
                <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.10)]">
                  <div className="relative h-[220px] w-full overflow-hidden bg-zinc-100 sm:h-[300px] lg:h-[500px]">
                    <ImagemProduto
                      src={slideSelecionado?.imagem}
                      alt={slideSelecionado?.titulo || "Banner em destaque"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      ) : (
        <motion.section
          className="mx-auto max-w-7xl px-4 pb-6 pt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
            <div className="px-6 py-7 md:px-8 md:py-8">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
                Coleção
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
  {tituloTopo}
</h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 md:text-base">
                {descricaoSecao}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700">
                  {produtosFiltrados.length} item(ns)
                </span>

                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Ver todos os produtos
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      <main
        id="catalogo"
        className={`mx-auto max-w-7xl px-4 pt-8 ${mostrarBarraCarrinhoMobile ? "pb-28" : "pb-16"} lg:pb-16`}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          {breadcrumb.map((item, index) => {
            const ultimo = index === breadcrumb.length - 1;

            return (
              <div key={`${item.tipo}-${item.label}`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (item.tipo === "inicio") return limparFiltros();
                    if (item.tipo === "categoria") return selecionarCategoria(categoriaAtiva);
                    if (item.tipo === "subcategoria") {
                      return selecionarSubcategoria(categoriaAtiva, subcategoriaAtiva);
                    }
                    if (item.tipo === "subcategoria2") {
                      return selecionarSubcategoria2(
                        categoriaAtiva,
                        subcategoriaAtiva,
                        subcategoria2Ativa
                      );
                    }
                  }}
                  className={`transition hover:text-zinc-900 ${
                    ultimo ? "font-semibold text-zinc-900" : ""
                  }`}
                >
                  {item.label}
                </button>

                {!ultimo && <span>/</span>}
              </div>
            );
          })}
        </div>

        <div className="mb-6 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Buscar produto
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, categoria, subcategoria, descrição ou tipo de peça"
                className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#f4b400] focus:bg-white"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-700">Categorias</p>

                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Limpar filtros
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categorias.map((categoriaItem) => {
                  const valorCategoria =
                    categoriaItem === "Todos" ? "Todos" : slugCategoria(categoriaItem);

                  const ativa = categoriaAtiva === valorCategoria;

                  return (
                    <button
                      key={categoriaItem === "Todos" ? "Todos" : tituloCategoria(categoriaItem)}
                      onClick={() => selecionarCategoria(valorCategoria)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        ativa
                          ? "bg-[#f4b400] text-black shadow-sm"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {categoriaItem === "Todos" ? "Todos" : tituloCategoria(categoriaItem)}
                    </button>
                  );
                })}
              </div>

              {subcategoriasVisiveis.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => selecionarCategoria(categoriaAtiva)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      subcategoriaAtiva === "Todos"
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Todas
                  </button>

                  {subcategoriasVisiveis.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => selecionarSubcategoria(categoriaAtiva, sub)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        subcategoriaAtiva === slugCategoria(sub)
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {subcategorias2Visiveis.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => selecionarSubcategoria(categoriaAtiva, subcategoriaAtiva)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      subcategoria2Ativa === "Todos"
                        ? "bg-[#f4b400] text-black"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Todos os tipos
                  </button>

                  {subcategorias2Visiveis.map((sub2) => (
                    <button
                      key={sub2}
                      onClick={() =>
                        selecionarSubcategoria2(categoriaAtiva, subcategoriaAtiva, sub2)
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        subcategoria2Ativa === slugCategoria(sub2)
                          ? "bg-[#f4b400] text-black"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {sub2}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

                {!estaEmPaginaFiltrada && !temBuscaAtiva && produtosEmDestaque.length > 0 && (
          <section className="mb-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
                  Seleção especial
                </p>
                <h3 className="mt-1 text-3xl font-bold">Produtos em destaque</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Itens que você escolheu para ganhar mais visibilidade.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {produtosEmDestaque.map((produto) => (
                <motion.article
  key={produto.id}
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.15 }}
  transition={{ duration: 0.35 }}
  whileHover={{ y: -6 }}
  className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)]"
>
  {/* GLOW EFFECT */}
  <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
    <div className="absolute inset-0 bg-gradient-to-br from-[#f4b400]/10 via-transparent to-[#f4b400]/20 blur-2xl" />
  </div>

  {/* IMAGEM */}
  <div className="relative overflow-hidden bg-zinc-100">
    <ImagemProduto
      src={produto.imagens?.[0]}
      alt={produto.nome}
      className="aspect-square w-full object-cover transition duration-700 group-hover:scale-110"
    />

    {/* BADGE CATEGORIA */}
    <div className="absolute top-2 left-2">
      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-zinc-800 shadow backdrop-blur">
        {produto.categoriaLabel || tituloCategoria(produto.categoria)}
      </span>
    </div>

    {/* BADGE DESTAQUE MELHORADO */}
    {produto.destaque === "destaque" && (
  <div className="absolute top-2 right-2">
    <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#f4b400] text-black shadow-md transition group-hover:scale-110">
      
      {/* glow */}
      <div className="absolute inset-0 rounded-full bg-[#f4b400] blur-md opacity-40 group-hover:opacity-70 transition" />

      <span className="relative">⭐</span>
    </div>
  </div>
)}
  </div>

  {/* CONTEÚDO */}
  <div className="flex flex-1 flex-col p-4">
    
    {/* TITULO */}
    <h4 className="line-clamp-2 text-[15px] font-bold text-zinc-900">
      {produto.nome}
    </h4>

    {/* SUB */}
    {produto.subcategoria && (
      <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
        {produto.subcategoria}
      </p>
    )}

    {/* PREÇO (MAIS FORTE) */}
    <div className="mt-3 flex items-end gap-2">
      <span className="text-2xl font-black text-zinc-900">
        {formatarMoeda(produto.preco)}
      </span>
    </div>

    {/* DESCRIÇÃO */}
    <p className="mt-2 line-clamp-2 text-xs text-zinc-600">
      {produto.descricao?.replace(/Tamanho aproximado:[^\n]*/i, "").trim()}
    </p>

    {/* BOTÕES */}
    <div className="mt-auto pt-4 space-y-2">
  <button
    onClick={() => navigate(`/produto/${produto.id}`)}
    className="w-full rounded-xl border border-zinc-300 bg-white py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
  >
    Ver produto
  </button>

  {produtoTemVariacoes(produto) ? (
    <button
      onClick={() => abrirDetalhes(produto)}
      className="w-full rounded-xl bg-[#f4b400] py-2.5 text-sm font-black text-black shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      Escolher opções
    </button>
  ) : quantidadeNoCarrinho(produto.id) > 0 ? (
    <div className="flex justify-center">
      <ControleQuantidade
        quantidade={quantidadeNoCarrinho(produto.id)}
        onDiminuir={() =>
          diminuirQuantidade(
            carrinho.find(
              (item) => String(item.id) === String(produto.id)
            )
          )
        }
        onAumentar={(e) => adicionarAoCarrinho(produto, e)}
      />
    </div>
  ) : (
    <button
      onClick={(e) => adicionarAoCarrinho(produto, e)}
      className="w-full rounded-xl bg-[#f4b400] py-2.5 text-sm font-black text-black shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      Adicionar ao carrinho
    </button>
  )}
</div>
  </div>
</motion.article>
              ))}
            </div>
          </section>
        )}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
              Catálogo
            </p>
            <h3 className="mt-1 text-3xl font-bold">{tituloCatalogo}</h3>
            <p className="mt-2 text-sm text-zinc-500">
              {produtosFiltrados.length} item(ns) encontrado(s)
            </p>

            {temBuscaAtiva ? (
              <p className="mt-1 text-sm text-zinc-500">
                Resultados mais relevantes para sua pesquisa
              </p>
            ) : (
              categoriaAtiva !== "Todos" && (
                <p className="mt-1 text-sm text-zinc-500">
                  {tituloCategoria(categoriaAtiva)}
                  {subcategoriaAtiva !== "Todos"
                    ? ` • ${tituloItem(subcategoriaAtiva).replace(/-/g, " ")}`
                    : ""}
                  {subcategoria2Ativa !== "Todos"
                    ? ` • ${tituloItem(subcategoria2Ativa).replace(/-/g, " ")}`
                    : ""}
                </p>
              )
            )}
          </div>

          <div className="min-w-[220px]">
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Ordenar por
            </label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#f4b400]"
            >
              <option value="destaque">Destaque</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
              <option value="nome-az">Nome A-Z</option>
              <option value="nome-za">Nome Z-A</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtosFiltrados.map((produto) => {
            const badge = getBadgeDestaque(produto.destaque);

            return (
              <motion.article
  key={produto.id}
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.15 }}
  transition={{ duration: 0.35 }}
  whileHover={{ y: -6 }}
  className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)]"
>
  {/* GLOW EFFECT */}
  <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
    <div className="absolute inset-0 bg-gradient-to-br from-[#f4b400]/10 via-transparent to-[#f4b400]/20 blur-2xl" />
  </div>

  {/* IMAGEM */}
  <div className="relative overflow-hidden bg-zinc-100">
    <ImagemProduto
      src={produto.imagens?.[0]}
      alt={produto.nome}
      className="aspect-square w-full object-cover transition duration-700 group-hover:scale-110"
    />

    {/* BADGE CATEGORIA */}
    <div className="absolute top-2 left-2">
      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-zinc-800 shadow backdrop-blur">
        {produto.categoriaLabel || tituloCategoria(produto.categoria)}
      </span>
    </div>

    {/* BADGE DESTAQUE MELHORADO */}
    {produto.destaque === "destaque" && (
  <div className="absolute top-2 right-2">
    <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#f4b400] text-black shadow-md transition group-hover:scale-110">
      
      {/* glow */}
      <div className="absolute inset-0 rounded-full bg-[#f4b400] blur-md opacity-40 group-hover:opacity-70 transition" />

      <span className="relative">⭐</span>
    </div>
  </div>
)}
  </div>

  {/* CONTEÚDO */}
  <div className="flex flex-1 flex-col p-4">
    
    {/* TITULO */}
    <h4 className="line-clamp-2 text-[15px] font-bold text-zinc-900">
      {produto.nome}
    </h4>

    {/* SUB */}
    {produto.subcategoria && (
      <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
        {produto.subcategoria}
      </p>
    )}

    {/* PREÇO (MAIS FORTE) */}
    <div className="mt-3 flex items-end gap-2">
      <span className="text-2xl font-black text-zinc-900">
        {formatarMoeda(produto.preco)}
      </span>
    </div>

    {/* DESCRIÇÃO */}
    <p className="mt-2 line-clamp-2 text-xs text-zinc-600">
      {produto.descricao?.replace(/Tamanho aproximado:[^\n]*/i, "").trim()}
    </p>

    {/* BOTÕES */}
    <div className="mt-auto pt-4 space-y-2">
  <button
    onClick={() => navigate(`/produto/${produto.id}`)}
    className="w-full rounded-xl border border-zinc-300 bg-white py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
  >
    Ver produto
  </button>

  {produtoTemVariacoes(produto) ? (
    <button
      onClick={() => abrirDetalhes(produto)}
      className="w-full rounded-xl bg-[#f4b400] py-2.5 text-sm font-black text-black shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      Escolher opções
    </button>
  ) : quantidadeNoCarrinho(produto.id) > 0 ? (
    <div className="flex justify-center">
      <ControleQuantidade
        quantidade={quantidadeNoCarrinho(produto.id)}
        onDiminuir={() =>
          diminuirQuantidade(
            carrinho.find(
              (item) => String(item.id) === String(produto.id)
            )
          )
        }
        onAumentar={(e) => adicionarAoCarrinho(produto, e)}
      />
    </div>
  ) : (
    <button
      onClick={(e) => adicionarAoCarrinho(produto, e)}
      className="w-full rounded-xl bg-[#f4b400] py-2.5 text-sm font-black text-black shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      Adicionar ao carrinho
    </button>
  )}
</div>
  </div>
</motion.article>
            );
          })}
        </div>

        {produtosFiltrados.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-zinc-700">
              Nenhum produto encontrado
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Tente buscar outro termo ou selecionar uma categoria diferente.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={limparFiltros}
                className="rounded-2xl bg-[#f4b400] px-5 py-3 font-semibold text-black transition hover:opacity-90"
              >
                Ver todos os produtos
              </button>
            </div>
          </div>
        )}
      </main>

      <section id="quem-somos" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-zinc-100">
            <ImagemProduto
              src="/imagens/banners/banner-quem-somos.png"
              alt="Quem somos Additive Hub"
              className="h-full min-h-[320px] w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#b38200]">
              Quem somos
            </p>
            <h3 className="mt-3 text-3xl font-bold">Additive Hub</h3>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              A Additive Hub é uma marca voltada para criação e produção de peças
              em impressão 3D, com foco em personalização, acabamento e design.
              Trabalhamos com chaveiros, itens decorativos, utilidades, brindes
              e projetos sob medida.
            </p>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Nossa proposta é unir criatividade, funcionalidade e apresentação
              profissional para transformar ideias em produtos com identidade.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-[#f4b400] px-6 py-3 font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Falar no WhatsApp
              </a>

              <button
                onClick={irParaCatalogo}
                className="rounded-2xl border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Ver produtos
              </button>
            </div>

            <div className="mt-6 border-t border-zinc-200 pt-5">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
                Acompanhe no Instagram
              </p>

              <a
                href="https://instagram.com/additive.hub"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37a4 4 0 1 1-1.37-1.37 4 4 0 0 1 1.37 1.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                @additive.hub
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Additive Hub • Design e Impressão 3D</p>
          <p>Desenvolvido por Jaaziel</p>
          <p>Peças personalizadas, utilidades, decoração e projetos sob medida</p>
        </div>
      </footer>

      <AnimatePresence>
        {mostrarBarraCarrinhoMobile && (
          <motion.div
            className="fixed inset-x-0 bottom-4 z-40 px-4 lg:hidden"
            initial={{ opacity: 0, y: 90 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 90 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="mx-auto flex max-w-md items-center gap-3">
              <motion.button
                type="button"
                onClick={() => {
                  localStorage.setItem("carrinhoAdditiveHub", JSON.stringify(carrinho));
                  window.location.href = "/#/carrinho";
                }}
                initial={{ scale: 0.96 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex-1 rounded-2xl bg-[#f4b400] px-4 py-3 text-left text-black shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                      <IconeCarrinho className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-none">Ver carrinho</p>
                      <p className="mt-1 text-xs text-black/75">
                        {totalItensCarrinho} item(ns) • {formatarMoeda(totalCarrinho)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-black px-2 text-xs font-bold text-white">
                    {totalItensCarrinho}
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {totalItensCarrinho > 0 && (
          <motion.div
            className="fixed bottom-[5.5rem] right-5 z-40 hidden lg:block"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("carrinhoAdditiveHub", JSON.stringify(carrinho));
                window.location.href = "/#/carrinho";
              }}
              className="group flex items-center gap-3 rounded-full bg-[#f4b400] px-4 py-3 text-left text-black shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <IconeCarrinho className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-black">
                  {totalItensCarrinho}
                </span>
              </span>

              <span className="min-w-0 pr-1">
                <span className="block text-sm font-bold leading-none">Ver carrinho</span>
                <span className="mt-1 block text-xs text-black/75">
                  {totalItensCarrinho} item(ns) • {formatarMoeda(totalCarrinho)}
                </span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:opacity-90 active:scale-[0.95] ${
          mostrarBarraCarrinhoMobile ? "bottom-24 lg:bottom-5" : ""
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M12 0a12 12 0 0 0-10.3 18.2L0 24l5.9-1.6A12 12 0 1 0 12 0zm0 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.5.9.9-3.4-.3-.4A9.8 9.8 0 1 1 12 21.8zm5.4-7.3c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-1 .1-.2-.2-.3-.3-.6-.5-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.7.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.3-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-.9 2.5.1 1.5 1 2.9 1.1 3.1.2.2 2.1 3.3 5.1 4.5.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4 0-.1-.2-.2-.5-.3z" />
        </svg>
        WhatsApp
      </a>

      <AnimatePresence>
        {produtoSelecionado && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
            onClick={fecharDetalhes}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center py-6">
              <motion.div
                className="grid w-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.18)] lg:max-h-[90vh] lg:grid-cols-2"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="flex flex-col bg-zinc-100">
                  <div className="relative h-[240px] w-full bg-zinc-100 sm:h-[300px] md:h-[360px] lg:h-[500px]">
                    <ImagemProduto
                      src={produtoSelecionado?.imagens?.[imagemAtiva]}
                      alt={`${produtoSelecionado?.nome || "Produto"} - foto ${imagemAtiva + 1}`}
                      className="h-full w-full object-cover md:scale-[1.05]"
                    />

                    <button
                      onClick={fecharDetalhes}
                      className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-white"
                    >
                      Fechar
                    </button>

                    {produtoSelecionado.imagens?.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setImagemAtiva((atual) =>
                              atual === 0 ? produtoSelecionado.imagens.length - 1 : atual - 1
                            )
                          }
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-white"
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setImagemAtiva((atual) =>
                              (atual + 1) % produtoSelecionado.imagens.length
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-white"
                        >
                          →
                        </button>
                      </>
                    )}
                  </div>

                  {produtoSelecionado.imagens?.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto border-t border-zinc-200 bg-white p-4">
                      {produtoSelecionado.imagens.map((img, index) => {
                        const ativa = imagemAtiva === index;

                        return (
                          <button
                            key={`${produtoSelecionado.id}-${index}`}
                            type="button"
                            onClick={() => setImagemAtiva(index)}
                            className={`shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                              ativa
                                ? "border-[#f4b400]"
                                : "border-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            <ImagemProduto
                              src={img}
                              alt={`${produtoSelecionado.nome} ${index + 1}`}
                              className="h-20 w-20 object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="max-h-[90vh] overflow-y-auto p-6 md:p-8">
                  <div>
                    <span className="inline-flex w-fit rounded-full border border-[#f4b400]/30 bg-[#f4b400]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b6900]">
                      {produtoSelecionado.categoriaLabel || produtoSelecionado.categoria || "Produto"}
                    </span>

                    <h3 className="mt-4 text-3xl font-bold">{produtoSelecionado.nome}</h3>

                    {produtoSelecionado.subcategoria && (
                      <p className="mt-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
                        {produtoSelecionado.subcategoria}
                      </p>
                    )}

                    <p className="mt-2 text-lg font-semibold text-[#b38200]">
                      {formatarMoeda(produtoSelecionado.preco)}
                    </p>

                    <p className="mt-5 whitespace-pre-line leading-7 text-zinc-600">
                      {produtoSelecionado.descricao}
                    </p>

                    {produtoTemVariacoes(produtoSelecionado) && (
  <div className="mt-6 space-y-4">
    {produtoSelecionado.variacoes.map((variacao) => (
      <div key={`${produtoSelecionado.id}-${variacao.nome}`}>
        <p className="mb-2 text-sm font-semibold text-zinc-800">
          {variacao.nome}
        </p>

        {variacao.tipo === "texto" ? (
          <input
            type="text"
            value={selecoesVariacao?.[variacao.nome] || ""}
            onChange={(e) =>
              atualizarSelecaoVariacao(variacao.nome, e.target.value)
            }
            placeholder={`Digite ${variacao.nome.toLowerCase()}...`}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-[#f4b400] focus:bg-[#fffdf5]"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(variacao.opcoes || []).map((opcao) => {
              const ativa = selecoesVariacao?.[variacao.nome] === opcao;

              return (
                <button
                  key={`${variacao.nome}-${opcao}`}
                  type="button"
                  onClick={() =>
                    atualizarSelecaoVariacao(variacao.nome, opcao)
                  }
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                    ativa
                      ? "border-[#f4b400] bg-[#fff8df] text-[#8b6900]"
                      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {opcao}
                </button>
              );
            })}
          </div>
        )}
      </div>
    ))}

    {!variacoesPreenchidas(produtoSelecionado, selecoesVariacao) && (
      <p className="text-sm font-medium text-amber-700">
        Preencha todas as opções para adicionar ao carrinho.
      </p>
    )}
  </div>
)}

                    <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm text-zinc-500">Destaque</p>
                      <p className="mt-1 font-medium text-zinc-900">
                        {produtoSelecionado.destaque
                          ? getBadgeDestaque(produtoSelecionado.destaque)?.label || produtoSelecionado.destaque
                          : "Produto padrão"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {produtoTemVariacoes(produtoSelecionado) ? (
                      quantidadeModal > 0 ? (
                        <ControleQuantidade
                          quantidade={quantidadeModal}
                          onDiminuir={() =>
                            diminuirQuantidade({
                              carrinhoKey: gerarChaveCarrinho(
                                produtoSelecionado,
                                selecoesVariacao
                              ),
                            })
                          }
                          onAumentar={(e) =>
                            adicionarAoCarrinho(
                              produtoSelecionado,
                              e,
                              selecoesVariacao
                            )
                          }
                        />
                      ) : (
                        <button
                          onClick={(e) =>
                            adicionarAoCarrinho(
                              produtoSelecionado,
                              e,
                              selecoesVariacao
                            )
                          }
                          className="rounded-2xl border border-[#f4b400] bg-[#fff8df] px-5 py-3 font-medium text-[#8b6900] transition hover:bg-[#fff2bf]"
                        >
                          Adicionar ao carrinho
                        </button>
                      )
                    ) : quantidadeNoCarrinho(produtoSelecionado.id) > 0 ? (
                      <ControleQuantidade
                        quantidade={quantidadeNoCarrinho(produtoSelecionado.id)}
                        onDiminuir={() =>
                          diminuirQuantidade(
                            carrinho.find(
                              (item) => String(item.id) === String(produtoSelecionado.id)
                            )
                          )
                        }
                        onAumentar={(e) => adicionarAoCarrinho(produtoSelecionado, e)}
                      />
                    ) : (
                      <button
                        onClick={(e) => adicionarAoCarrinho(produtoSelecionado, e)}
                        className="rounded-2xl border border-[#f4b400] bg-[#fff8df] px-5 py-3 font-medium text-[#8b6900] transition hover:bg-[#fff2bf]"
                      >
                        Adicionar ao carrinho
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/produto/${produtoSelecionado.id}`)}
                      className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      Abrir página do produto
                    </button>

                    <button
                      onClick={fecharDetalhes}
                      className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {animacoesCarrinho.map((anim) => (
          <motion.div
            key={anim.id}
            className="pointer-events-none fixed z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-[#f4b400] text-sm font-bold text-black shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            initial={{
              opacity: 0.95,
              x: anim.startX - 20,
              y: anim.startY - 20,
              scale: 1,
            }}
            animate={{
              opacity: [1, 1, 0.2],
              x: anim.endX - 20,
              y: anim.endY - 20,
              scale: [1, 0.95, 0.55],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            +
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}