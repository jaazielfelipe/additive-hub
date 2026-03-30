import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");
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
  };

  if (mapa[chave]) return mapa[chave];

  return String(valor || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function tituloItem(valor) {
  return String(valor || "").trim();
}

const menuCategoriasPadrao = [
  {
    nome: "Casa & Organização",
    chave: "casa-oraganizacao",
    itens: [
      "Banheiro",
      "Cozinha",
      "Escritório",
      "Jogos & Hobby",
      "Lavanderia",
      "Quarto",
      "Sala",
    ],
  },
  {
    nome: "Chaveiros",
    chave: "chaveiros",
    itens: ["Slim", "3D"],
  },
  {
    nome: "Decoração",
    chave: "decoracao",
    itens: ["Imãs", "Letreiros", "Miniaturas", "Porta-retrato", "Vasos"],
  },
  {
    nome: "Quem somos",
    chave: "quem-somos",
    itens: [],
  },
];

const produtosPadrao = [
  {
    id: 1,
    nome: "Chaveiro Personalizado",
    categoria: "Chaveiro",
    subcategoria: "Slim Personalizado",
    preco: 8,
    destaque: "Personalizável com nome e cor",
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
    destaque: "Impressão detalhada em 3D",
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
    destaque: "Prático e resistente",
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
    destaque: "Design moderno e exclusivo",
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
    destaque: "Organização com estilo",
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
    destaque: "Feito conforme sua ideia",
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
    titulo: "Miniaturas Colecionáveis em 3D",
    subtitulo:
      "Explore uma coleção exclusiva de miniaturas inspiradas nos maiores clássicos do terror. Cada peça é produzida em impressão 3D com alto nível de detalhe, acabamento de qualidade e design marcante, perfeita para colecionadores e fãs do gênero.",
    imagem: "/imagens/banners/banner-1.png",
    produtoId: 1,
  },
  {
    id: 2,
    tag: "Em breve",
    titulo: "Funko-Pop Personalizado",
    subtitulo:
      "Estamos desenvolvendo uma nova linha de miniaturas estilo Funko-Pop totalmente personalizadas com base em pessoas reais. Ideal para presentes únicos, lembranças especiais ou até para eternizar momentos. Aguarde — em breve disponível para encomenda.",
    imagem: "/imagens/banners/banner-2.png",
    produtoId: 2,
  },
  {
    id: 3,
    tag: "Novidades",
    titulo: "Lançamentos e peças em destaque",
    subtitulo:
      "Acompanhe os modelos mais recentes e descubra novas ideias em impressão 3D para venda, presente e revenda.",
    imagem: "/imagens/banners/banner-3.png",
    produtoId: 3,
  },
  /* {
    id: 4,
    tag: "Novidades",
    titulo: "Especial de Páscoa 3D",
    subtitulo:
      "Prepare-se para a Páscoa com peças criativas e personalizadas. Temos porta-ovos, lembrancinhas, brindes e itens exclusivos em impressão 3D, perfeitos para presentear, vender ou decorar. Produção sob demanda com possibilidade de personalização em cores e nomes.",
    imagem: "/imagens/banners/banner-4.png",
    produtoId: 4,
  }, */
];

function assetUrl(caminho) {
  const limpo = String(caminho || "").replace(/^\/+/, "");
  return `${SITE_BASE_URL}${limpo}`;
}

function normalizarCaminhoImagemCSV(caminho) {
  let valor = String(caminho || "").trim().replace(/\r/g, "").replace(/\\/g, "/");

  if (!valor) return "";

  valor = valor.replace(/^https?:\/\/[^/]+/i, "");
  valor = valor.replace(/^\/+/, "");

  if (valor.startsWith("backend/data/imagens/produtos/")) {
    valor = valor.replace(/^backend\/data\/imagens\/produtos/i, "produtos/imagens");
  } else if (valor.startsWith("frontend/public/produtos/imagens/")) {
    valor = valor.replace(/^frontend\/public\/produtos\/imagens/i, "produtos/imagens");
  } else if (valor.startsWith("produtos/imagens/")) {
    return valor;
  } else if (valor.startsWith("imagens/produtos/")) {
    valor = valor.replace(/^imagens\/produtos/i, "produtos/imagens");
  }

  return valor;
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
      if (char === "\r" && proximo === "\n") {
        i += 1;
      }

      linhaAtual.push(campoAtual);
      campoAtual = "";

      const linhaTemConteudo = linhaAtual.some((campo) => String(campo).trim() !== "");
      if (linhaTemConteudo) {
        linhas.push(linhaAtual);
      }

      linhaAtual = [];
    } else {
      campoAtual += char;
    }
  }

  linhaAtual.push(campoAtual);
  const ultimaLinhaTemConteudo = linhaAtual.some(
    (campo) => String(campo).trim() !== ""
  );
  if (ultimaLinhaTemConteudo) {
    linhas.push(linhaAtual);
  }

  if (linhas.length < 2) return [];

  const limparCampo = (valor) =>
    String(valor ?? "")
      .replace(/\r/g, "")
      .trim();

  const cabecalhos = linhas[0].map((item) => limparCampo(item).toLowerCase());

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

    const variacoes = [
      montarVariacao(item.nome_variacao_1, item.variacoes_1),
      montarVariacao(item.nome_variacao_2, item.variacoes_2),
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
      destaque: item.destaque || "Produto em impressão 3D",
      descricao:
        item.descricao ||
        item["descrição"] ||
        "Peça produzida em impressão 3D com possibilidade de personalização sob demanda.",
      imagens: imagens.length > 0 ? imagens : ["/imagens/placeholder.png"],
      variacoes,

      peso: Number(String(item.peso || "0").replace(",", ".")) || 0,
      altura: Number(String(item.altura || "0").replace(",", ".")) || 0,
      largura: Number(String(item.largura || "0").replace(",", ".")) || 0,
      comprimento: Number(String(item.comprimento || "0").replace(",", ".")) || 0,
    };
  });
}

function getImagemSrc(imagem) {
  if (!imagem) {
    return assetUrl("imagens/placeholder.png");
  }

  if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
    return imagem;
  }

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
    acc[variacao.nome] = "";
    return acc;
  }, {});
}

function variacoesPreenchidas(produto, selecoes) {
  if (!produtoTemVariacoes(produto)) return true;

  return produto.variacoes.every((variacao) =>
    normalizarTexto(selecoes?.[variacao.nome])
  );
}

function montarResumoVariacoes(produto, selecoes) {
  if (!produtoTemVariacoes(produto)) return [];

  return produto.variacoes
    .map((variacao) => ({
      nome: variacao.nome,
      valor: normalizarTexto(selecoes?.[variacao.nome]),
    }))
    .filter((item) => item.valor);
}

function gerarChaveCarrinho(produto, selecoes = {}) {
  const base = String(produto?.id ?? "");

  if (!produtoTemVariacoes(produto)) {
    return base;
  }

  const sufixo = produto.variacoes
    .map((variacao) => `${variacao.nome}:${normalizarTexto(selecoes?.[variacao.nome])}`)
    .join("|");

  return `${base}__${sufixo}`;
}

export default function CatalogoOnline() {
  const [produtos, setProdutos] = useState(produtosPadrao);
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [subcategoriaAtiva, setSubcategoriaAtiva] = useState("Todos");
  const [subcategoria2Ativa, setSubcategoria2Ativa] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [slideAtual, setSlideAtual] = useState(0);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [categoriaMobileAberta, setCategoriaMobileAberta] = useState(null);
  const [animacoesCarrinho, setAnimacoesCarrinho] = useState([]);
  const [carrinhoDestacado, setCarrinhoDestacado] = useState(false);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
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
    localStorage.setItem("carrinhoAdditiveHub", JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    document.documentElement.lang = "pt-BR";
    document.documentElement.setAttribute("translate", "no");
    document.body.setAttribute("translate", "no");
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
    fetch(assetUrl("produtos/produtos.csv"))
      .then((res) => {
        if (!res.ok) {
          throw new Error("Arquivo CSV não encontrado");
        }
        return res.text();
      })
      .then((texto) => {
        const lista = parseCSV(texto);
        if (lista.length > 0) {
          setProdutos(lista);
        }
      })
      .catch((erro) => {
        console.error("Erro ao carregar CSV:", erro);
        setProdutos(produtosPadrao);
      });
  }, []);

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
    if (categoriaAtiva === "Todos") {
      return [];
    }

    return [
      ...new Set(
        produtos
          .filter((produto) => produto.categoria === categoriaAtiva)
          .map((produto) => produto.subcategoria)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [produtos, categoriaAtiva]);

  const subcategorias2Visiveis = useMemo(() => {
    if (categoriaAtiva === "Todos" || subcategoriaAtiva === "Todos") {
      return [];
    }

    return [
      ...new Set(
        produtos
          .filter(
            (produto) =>
              produto.categoria === categoriaAtiva &&
              produto.subcategoria === subcategoriaAtiva
          )
          .map((produto) => produto.subcategoria2)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [produtos, categoriaAtiva, subcategoriaAtiva]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const bateCategoria =
        categoriaAtiva === "Todos" || produto.categoria === categoriaAtiva;

      const bateSubcategoria =
        subcategoriaAtiva === "Todos" ||
        produto.subcategoria === subcategoriaAtiva;

      const bateSubcategoria2 =
        subcategoria2Ativa === "Todos" ||
        produto.subcategoria2 === subcategoria2Ativa;

      const termo = busca.toLowerCase().trim();
      const bateBusca =
        termo === "" ||
        produto.nome.toLowerCase().includes(termo) ||
        (produto.categoriaLabel || produto.categoria || "").toLowerCase().includes(termo) ||
        (produto.subcategoriaLabel || produto.subcategoria || "").toLowerCase().includes(termo) ||
        (produto.subcategoria2Label || produto.subcategoria2 || "").toLowerCase().includes(termo) ||
        produto.destaque.toLowerCase().includes(termo) ||
        produto.descricao.toLowerCase().includes(termo) ||
        (produto.variacoes || []).some(
          (variacao) =>
            variacao.nome.toLowerCase().includes(termo) ||
            variacao.opcoes.some((opcao) => opcao.toLowerCase().includes(termo))
        );

      return bateCategoria && bateSubcategoria && bateSubcategoria2 && bateBusca;
    });
  }, [produtos, categoriaAtiva, subcategoriaAtiva, subcategoria2Ativa, busca]);

  const totalItensCarrinho = useMemo(() => {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
  }, [carrinho]);

  const totalCarrinho = useMemo(() => {
    return carrinho.reduce(
      (total, item) => total + item.preco * item.quantidade,
      0
    );
  }, [carrinho]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.innerWidth >= 1024) {
      setMostrarBarraCarrinhoMobile(false);
      return;
    }

    if (totalItensCarrinho > 0) {
      setMostrarBarraCarrinhoMobile(true);
    } else {
      setMostrarBarraCarrinhoMobile(false);
    }
  }, [totalItensCarrinho]);

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

    window.setTimeout(() => {
      setCarrinhoDestacado(false);
    }, 450);

    window.setTimeout(() => {
      setAnimacoesCarrinho((atual) => atual.filter((anim) => anim.id !== id));
    }, 900);
  };

  const adicionarAoCarrinho = (produto, event, selecoes = {}) => {
    if (!produto) return;

    if (produtoTemVariacoes(produto) && !variacoesPreenchidas(produto, selecoes)) {
      if (produtoSelecionado?.id === produto.id) {
        alert("Selecione todas as variações antes de adicionar ao carrinho.");
      } else {
        abrirDetalhes(produto);
      }
      return;
    }

    animarProdutoParaCarrinho(event);

    const resumoVariacoes = montarResumoVariacoes(produto, selecoes);
    const carrinhoKey = gerarChaveCarrinho(produto, selecoes);

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
          selecoesVariacao: selecoes,
          resumoVariacoes,
        },
      ];
    });
  };

  const aumentarQuantidade = (itemCarrinho, event) => {
    if (!itemCarrinho) return;

    if (event) {
      animarProdutoParaCarrinho(event);
    }

    setCarrinho((anterior) =>
      anterior.map((item) =>
        item.carrinhoKey === itemCarrinho.carrinhoKey
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      )
    );
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

  const selecionarCategoria = (categoria) => {
    setCategoriaAtiva(categoria);
    setSubcategoriaAtiva("Todos");
    setSubcategoria2Ativa("Todos");
    setBusca("");
    setMenuMobileAberto(false);
    setCategoriaMobileAberta(null);

    setTimeout(() => {
      irParaCatalogo();
    }, 50);
  };

  const selecionarSubcategoria = (categoria, subcategoria) => {
    setCategoriaAtiva(categoria);
    setSubcategoriaAtiva(subcategoria);
    setSubcategoria2Ativa("Todos");
    setBusca("");
    setMenuMobileAberto(false);
    setCategoriaMobileAberta(null);

    setTimeout(() => {
      irParaCatalogo();
    }, 50);
  };

  const selecionarSubcategoria2 = (categoria, subcategoria, subcategoria2) => {
    setCategoriaAtiva(categoria);
    setSubcategoriaAtiva(subcategoria);
    setSubcategoria2Ativa(subcategoria2);
    setBusca("");
    setMenuMobileAberto(false);
    setCategoriaMobileAberta(null);

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
          <div className="flex items-center gap-4 md:gap-12 flex-1">
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
              {menuCategorias.map((categoria) => {
                const temSubmenu = categoria.itens.length > 0;

                if (!temSubmenu) {
                  const acao =
                    categoria.chave === "quem-somos"
                      ? irParaQuemSomos
                      : () => selecionarCategoria(categoria.chave);

                  return (
                    <button
                      key={categoria.nome}
                      type="button"
                      onClick={acao}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      {categoria.nome}
                    </button>
                  );
                }

                return (
                  <div key={categoria.nome} className="group relative">
                    <button
                      type="button"
                      onClick={() => selecionarCategoria(categoria.chave)}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      {categoria.nome}
                    </button>

                    <div className="invisible absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-zinc-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => selecionarCategoria(categoria.chave)}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#b38200] transition hover:bg-[#fff8df]"
                      >
                        Ver tudo em {categoria.nome}
                      </button>

                      <div className="my-2 border-t border-zinc-100" />

                      {categoria.itens.map((item) => (
                        <div key={item} className="rounded-xl hover:bg-zinc-50">
                          <button
                            type="button"
                            onClick={() => selecionarSubcategoria(categoria.chave, item)}
                            className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700"
                          >
                            {item}
                          </button>

                          {categoria.itensNivel2?.[item]?.length > 0 && (
                            <div className="pb-2 pl-3">
                              {categoria.itensNivel2[item].map((itemNivel2) => (
                                <button
                                  type="button"
                                  key={`${item}-${itemNivel2}`}
                                  onClick={() => selecionarSubcategoria2(categoria.chave, item, itemNivel2)}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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

                {menuCategorias.map((categoria) => {
                  const temSubmenu = categoria.itens.length > 0;
                  const aberta = categoriaMobileAberta === categoria.nome;

                  if (!temSubmenu) {
                    const acao =
                      categoria.chave === "quem-somos"
                        ? () => {
                            setMenuMobileAberto(false);
                            setCategoriaMobileAberta(null);
                            setTimeout(() => {
                              irParaQuemSomos();
                            }, 50);
                          }
                        : () => selecionarCategoria(categoria.chave);

                    return (
                      <button
                        key={categoria.nome}
                        type="button"
                        onClick={acao}
                        className="mb-2 block w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                      >
                        {categoria.nome}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={categoria.nome}
                      className="mb-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                    >
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => selecionarCategoria(categoria.chave)}
                          className="flex-1 px-4 py-3 text-left text-sm font-semibold text-zinc-900"
                        >
                          {categoria.nome}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setCategoriaMobileAberta((atual) =>
                              atual === categoria.nome ? null : categoria.nome
                            )
                          }
                          className="px-4 py-3 text-zinc-600"
                          aria-label={`Expandir ${categoria.nome}`}
                        >
                          {aberta ? "−" : "+"}
                        </button>
                      </div>

                      {aberta && (
                        <div className="border-t border-zinc-100 bg-zinc-50 p-2">
                          <button
                            type="button"
                            onClick={() => selecionarCategoria(categoria.chave)}
                            className="mb-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#b38200]"
                          >
                            Ver tudo em {categoria.nome}
                          </button>

                          {categoria.itens.map((item) => (
                            <div key={item}>
                              <button
                                type="button"
                                onClick={() =>
                                  selecionarSubcategoria(categoria.chave, item)
                                }
                                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-white"
                              >
                                {item}
                              </button>

                              {categoria.itensNivel2?.[item]?.length > 0 && (
                                <div className="pb-2 pl-3">
                                  {categoria.itensNivel2[item].map((itemNivel2) => (
                                    <button
                                      key={`${item}-${itemNivel2}`}
                                      type="button"
                                      onClick={() =>
                                        selecionarSubcategoria2(categoria.chave, item, itemNivel2)
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

      <main id="catalogo" className={`mx-auto max-w-7xl px-4 pt-8 ${mostrarBarraCarrinhoMobile ? "pb-28" : "pb-16"} lg:pb-16`}>
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
              <p className="mb-2 text-sm font-medium text-zinc-700">Categorias</p>
              <div className="flex flex-wrap gap-2">
                {categorias.map((categoria) => {
                  const ativa = categoriaAtiva === categoria;

                  return (
                    <button
                      key={categoria === "Todos" ? "Todos" : tituloCategoria(categoria)}
                      onClick={() => selecionarCategoria(categoria)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        ativa
                          ? "bg-[#f4b400] text-black shadow-sm"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {categoria === "Todos" ? "Todos" : tituloCategoria(categoria)}
                    </button>
                  );
                })}
              </div>

              {subcategoriasVisiveis.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSubcategoriaAtiva("Todos");
                      setSubcategoria2Ativa("Todos");
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      subcategoriaAtiva === "Todos"
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Todas
                  </button>

                  {subcategoriasVisiveis.map((subcategoria) => (
                    <button
                      key={subcategoria}
                      onClick={() => {
                        setSubcategoriaAtiva(subcategoria);
                        setSubcategoria2Ativa("Todos");
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        subcategoriaAtiva === subcategoria
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {subcategoria}
                    </button>
                  ))}
                </div>
              )}

              {subcategorias2Visiveis.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSubcategoria2Ativa("Todos")}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      subcategoria2Ativa === "Todos"
                        ? "bg-[#f4b400] text-black"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Todos os tipos
                  </button>

                  {subcategorias2Visiveis.map((subcategoria2) => (
                    <button
                      key={subcategoria2}
                      onClick={() => setSubcategoria2Ativa(subcategoria2)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        subcategoria2Ativa === subcategoria2
                          ? "bg-[#f4b400] text-black"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {subcategoria2}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
              Catálogo
            </p>
            <h3 className="mt-1 text-3xl font-bold">Produtos em destaque</h3>
            <p className="mt-2 text-sm text-zinc-500">
              {produtosFiltrados.length} item(ns) encontrado(s)
            </p>
            {categoriaAtiva !== "Todos" && (
              <p className="mt-1 text-sm text-zinc-500">
                {categoriaAtiva === "Todos" ? "Todos" : tituloCategoria(categoriaAtiva)}
                {subcategoriaAtiva !== "Todos" ? ` • ${subcategoriaAtiva}` : ""}
                {subcategoria2Ativa !== "Todos" ? ` • ${subcategoria2Ativa}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtosFiltrados.map((produto) => (
            <motion.article
              key={produto.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)]"
            >
              <div className="relative overflow-hidden bg-zinc-100">
                <ImagemProduto
                  src={produto.imagens?.[0]}
                  alt={produto.nome}
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 top-0 flex items-start p-2">
                  <span className="max-w-[60%] truncate rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-semibold text-zinc-800 shadow-sm backdrop-blur sm:text-xs">
                    {produto.categoriaLabel || tituloCategoria(produto.categoria)}
                  </span>
                </div>

                {produto.imagens?.length > 1 && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur sm:text-xs">
                    +{produto.imagens.length} fotos
                  </span>
                )}

                <div className="absolute bottom-2 right-2 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-bold text-[#8b6900] shadow-sm backdrop-blur">
                  Destaque
                </div>
              </div>

              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <div className="min-h-[3.3rem]">
                  <h4 className="line-clamp-2 text-sm font-bold leading-5 text-zinc-900 sm:text-[15px]">
                    {produto.nome}
                  </h4>

                  {produto.subcategoria && (
                    <p className="mt-1 line-clamp-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-[11px]">
                      {produto.subcategoria}
                    </p>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-xl font-black leading-none tracking-tight text-zinc-900 sm:text-2xl">
                    R$ {produto.preco.toFixed(2)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs font-medium text-[#b38200] sm:text-sm">
                    {produto.destaque}
                  </p>
                </div>

                <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs leading-5 text-zinc-600 sm:text-sm">
                  {produto.descricao}
                </p>

                {produtoTemVariacoes(produto) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {produto.variacoes.map((variacao) => (
                      <span
                        key={`${produto.id}-${variacao.nome}`}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600"
                      >
                        {variacao.nome}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-3">
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => abrirDetalhes(produto)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 sm:text-sm"
                    >
                      Ver produto
                    </button>

                    {produtoTemVariacoes(produto) ? (
                      <button
                        onClick={() => abrirDetalhes(produto)}
                        className="w-full rounded-xl bg-[#f4b400] px-3 py-2.5 text-xs font-extrabold text-black shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 sm:text-sm"
                      >
                        Escolher opções
                      </button>
                    ) : quantidadeNoCarrinho(produto.id) > 0 ? (
                      <div className="flex justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-1.5">
                        <ControleQuantidade
                          quantidade={quantidadeNoCarrinho(produto.id)}
                          onDiminuir={() =>
                            diminuirQuantidade(
                              carrinho.find((item) => String(item.id) === String(produto.id))
                            )
                          }
                          onAumentar={(e) => adicionarAoCarrinho(produto, e)}
                          compacto
                        />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => adicionarAoCarrinho(produto, e)}
                        className="w-full rounded-xl bg-[#f4b400] px-3 py-2.5 text-xs font-extrabold text-black shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 sm:text-sm"
                      >
                        Adicionar ao carrinho
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {produtosFiltrados.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-zinc-700">
              Nenhum produto encontrado
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Tente buscar outro termo ou selecionar uma categoria diferente.
            </p>
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
                      <p className="text-sm font-bold leading-none">
                        Ver carrinho
                      </p>
                      <p className="mt-1 text-xs text-black/75">
                        {totalItensCarrinho} item(ns) • R$ {totalCarrinho.toFixed(2)}
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
                <span className="block text-sm font-bold leading-none">
                  Ver carrinho
                </span>
                <span className="mt-1 block text-xs text-black/75">
                  {totalItensCarrinho} item(ns) • R$ {totalCarrinho.toFixed(2)}
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
          <path d="M12 0a12 12 0 0 0-10.3 18.2L0 24l5.9-1.6A12 12 0 1 0 12 0zm0 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.5.9.9-3.4-.3-.4A9.8 9.8 0 1 1 12 21.8zm5.4-7.3c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-1 .1-.2-.2-.3-.3-.6-.5-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.7.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.3-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-.9 2.5.1 1.5 1 2.9 1.1 3.1.2.2 2.1 3.3 5.1 4.5.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4 0-.1-.2-.2-.5-.3z"/>
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
                              atual === 0
                                ? produtoSelecionado.imagens.length - 1
                                : atual - 1
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
                      {produtoSelecionado.categoria || "Produto"}
                    </span>

                    <h3 className="mt-4 text-3xl font-bold">
                      {produtoSelecionado.nome}
                    </h3>

                    {produtoSelecionado.subcategoria && (
                      <p className="mt-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
                        {produtoSelecionado.subcategoria}
                      </p>
                    )}

                    <p className="mt-2 text-lg font-semibold text-[#b38200]">
                      R$ {produtoSelecionado.preco.toFixed(2)}
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

                            <div className="flex flex-wrap gap-2">
                              {variacao.opcoes.map((opcao) => {
                                const ativa =
                                  selecoesVariacao?.[variacao.nome] === opcao;

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
                          </div>
                        ))}

                        {!variacoesPreenchidas(produtoSelecionado, selecoesVariacao) && (
                          <p className="text-sm font-medium text-amber-700">
                            Selecione todas as opções para adicionar ao carrinho.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm text-zinc-500">Destaque</p>
                      <p className="mt-1 font-medium text-zinc-900">
                        {produtoSelecionado.destaque}
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
        {carrinhoAberto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCarrinhoAberto(false)}
          >
            <motion.div
              className="my-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.18)] md:my-8 md:max-h-[85vh]"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900">Seu carrinho</h3>
                  <p className="text-sm text-zinc-500">
                    Revise os itens antes de finalizar
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCarrinhoAberto(false)}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Fechar
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {carrinho.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-lg font-semibold text-zinc-700">
                      Seu carrinho está vazio
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      Adicione produtos para finalizar no WhatsApp.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {carrinho.map((item) => (
                        <div
                          key={item.carrinhoKey}
                          className="flex gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                        >
                          <ImagemProduto
                            src={item.imagens?.[0]}
                            alt={item.nome}
                            className="h-20 w-20 rounded-xl object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-bold text-zinc-900 sm:text-base">
                              {item.nome}
                            </h4>

                            {item.resumoVariacoes?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.resumoVariacoes.map((variacao) => (
                                  <span
                                    key={`${item.carrinhoKey}-${variacao.nome}`}
                                    className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                                  >
                                    {variacao.nome}: {variacao.valor}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="mt-2 text-xs text-zinc-500">
                              R$ {item.preco.toFixed(2)} por unidade
                            </p>

                            <p className="mt-1 text-sm font-semibold text-[#8b6900]">
                              Subtotal: R$ {(item.preco * item.quantidade).toFixed(2)}
                            </p>

                            <div className="mt-3">
                              <ControleQuantidade
                                quantidade={item.quantidade}
                                onDiminuir={() => diminuirQuantidade(item)}
                                onAumentar={() => aumentarQuantidade(item)}
                                compacto
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 space-y-4 border-t border-zinc-200 pt-5">
                      <div className="space-y-2 rounded-2xl bg-zinc-50 p-4">
                        <div className="flex items-center justify-between text-sm text-zinc-600">
                          <span>{totalItensCarrinho} item(ns)</span>
                          <span>Subtotal: R$ {totalCarrinho.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-zinc-600">
                          <span>Frete</span>
                          <span>
                            {freteSelecionado
                              ? `R$ ${freteSelecionado.preco.toFixed(2)}`
                              : "Não selecionado"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-lg font-bold text-zinc-900">
                          <span>Total final</span>
                          <span>R$ {totalComFrete.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm font-semibold text-zinc-900">Calcular frete</p>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={cepDestino}
                            onChange={(e) => setCepDestino(formatarCep(e.target.value))}
                            placeholder="Digite seu CEP"
                            inputMode="numeric"
                            maxLength={9}
                            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4b400]"
                          />

                          <button
                            type="button"
                            onClick={calcularFrete}
                            disabled={carregandoFrete || carrinho.length === 0}
                            className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                          >
                            {carregandoFrete ? "Calculando..." : "Calcular frete"}
                          </button>
                        </div>

                        {erroFrete && (
                          <p className="mt-3 text-sm text-red-600">{erroFrete}</p>
                        )}

                        {fretes.length > 0 && (
                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-zinc-900">
                                Escolha o frete
                              </p>
                              <p className="text-xs text-zinc-500">
                                Role para ver todas as opções
                              </p>
                            </div>

                            <div className="max-h-72 space-y-2 overflow-y-auto pr-1 overscroll-contain">
                              {fretes.map((opcao, index) => {
                                const nome =
                                  opcao.name ||
                                  opcao.service_description ||
                                  opcao.service ||
                                  opcao.company?.name ||
                                  `Opção ${index + 1}`;

                                const preco = obterPrecoFrete(opcao);

                                const prazoBruto =
                                  opcao.delivery_time ??
                                  opcao.delivery_range?.max ??
                                  opcao.delivery_range?.days ??
                                  opcao.delivery_days ??
                                  opcao.days ??
                                  opcao.prazo ??
                                  "-";

                                const prazo =
                                  typeof prazoBruto === "number"
                                    ? `${prazoBruto} dia(s)`
                                    : String(prazoBruto);

                                const chave = `${nome}-${index}`;
                                const recomendado = index === 0;

                                return (
                                  <button
                                    key={chave}
                                    type="button"
                                    onClick={() =>
                                      setFreteSelecionado({
                                        chave,
                                        nome,
                                        preco,
                                        prazo,
                                      })
                                    }
                                    className={`w-full rounded-2xl border p-4 text-left transition ${
                                      freteSelecionado?.chave === chave
                                        ? "border-[#f4b400] bg-[#fff8df]"
                                        : "border-zinc-200 bg-white hover:border-zinc-300"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-semibold text-zinc-900">{nome}</p>

                                          {recomendado && (
                                            <span className="rounded-full bg-[#f4b400] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
                                              Recomendado
                                            </span>
                                          )}
                                        </div>

                                        <p className="mt-1 text-sm text-zinc-600">
                                          Prazo: {prazo}
                                        </p>
                                      </div>

                                      <p className="shrink-0 text-sm font-bold text-zinc-900">
                                        R$ {preco.toFixed(2)}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
                  <h3 className="text-lg font-bold text-zinc-900">
                    Dados do comprador
                  </h3>

                  <p className="mt-1 text-sm text-zinc-600">
                    Preencha para concluir seu pedido
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={dadosCliente.nome}
                      onChange={(e) =>
                        atualizarDadosCliente("nome", e.target.value)
                      }
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                    <input
                      type="email"
                      placeholder="E-mail"
                      value={dadosCliente.email}
                      onChange={(e) =>
                        atualizarDadosCliente("email", e.target.value)
                      }
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                    <input
                      type="text"
                      placeholder="Telefone / WhatsApp"
                      value={dadosCliente.telefone}
                      onChange={(e) =>
                        atualizarDadosCliente("telefone", e.target.value)
                      }
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                    <input
                      type="text"
                      placeholder="CPF (opcional)"
                      value={dadosCliente.cpf}
                      onChange={(e) =>
                        atualizarDadosCliente("cpf", e.target.value)
                      }
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-zinc-200 bg-white px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setCarrinho([]);
                      setCepDestino("");
                      setFretes([]);
                      setFreteSelecionado(null);
                      setErroFrete("");
                    }}
                    className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
                  >
                    Limpar carrinho
                  </button>

                  <button
                    type="button"
                    onClick={finalizarPedidoWhatsApp}
                    disabled={carrinho.length === 0}
                    className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Pedir ajuda no WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={finalizarPedidoMercadoPago}
                    disabled={carrinho.length === 0 || !freteSelecionado || carregandoPagamento}
                    className="flex-1 rounded-2xl bg-[#009ee3] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {carregandoPagamento ? "Iniciando pagamento..." : "Pagar com Mercado Pago"}
                  </button>
                </div>
              </div>
            </motion.div>
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