import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const menuCategorias = [
  {
    nome: "Chaveiro",
    itens: [
      "Slim Classic",
      "Slim Smart",
      "Slim Personalizado",
      "Slim Relevo",
      "3D Basic",
      "3D Classic",
      "3D Spin",
      "3D Mini-Flexi",
    ],
  },
  {
    nome: "Decoração",
    itens: ["Miniaturas", "Itens para cozinha", "Itens para ambiente"],
  },
  {
    nome: "Cozinha & Confeitaria",
    itens: ["Cortadores", "Marcadores", "Utensílios personalizados"],
  },
  {
    nome: "Utilidades",
    itens: ["Organizadores", "Suportes", "Acessórios funcionais"],
  },
  {
    nome: "Personalizados",
    itens: ["Projetos sob medida", "Brindes personalizados", "Peças exclusivas"],
  },
  {
    nome: "Quem somos",
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
  },
];

const slidesDestaque = [
  {
    id: 1,
    tag: "Novidades",
    titulo: "Especial de Páscoa 3D",
    subtitulo:
      "Prepare-se para a Páscoa com peças criativas e personalizadas. Temos porta-ovos, lembrancinhas, brindes e itens exclusivos em impressão 3D, perfeitos para presentear, vender ou decorar. Produção sob demanda com possibilidade de personalização em cores e nomes.",
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
];

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
      .map((img) => limparCampo(img))
      .filter(Boolean)
      .map((img) => (img.startsWith("/") ? img : `/${img}`));

    return {
      id: Number(item.id) || index + 1,
      nome: item.nome || "Produto sem nome",
      categoria: item.categoria || "Outros",
      subcategoria: item.subcategoria || "",
      preco: Number(String(item.preco || "0").replace(",", ".")) || 0,
      destaque: item.destaque || "Produto em impressão 3D",
      descricao:
        item.descricao ||
        "Peça produzida em impressão 3D com possibilidade de personalização sob demanda.",
      imagens: imagens.length > 0 ? imagens : ["/imagens/placeholder.png"],
    };
  });
}

function getImagemSrc(imagem) {
  if (!imagem) {
    return `${import.meta.env.BASE_URL}imagens/placeholder.png`;
  }

  if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
    return imagem;
  }

  const caminhoLimpo = imagem
    .replace(/\r/g, "")
    .trim()
    .replace(/^\/+/, "");

  return `${import.meta.env.BASE_URL}${caminhoLimpo}`;
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
        e.currentTarget.src = `${import.meta.env.BASE_URL}imagens/placeholder.png`;
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
      className={`inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-2 py-2 ${
        compacto ? "" : "shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={onDiminuir}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white text-lg font-bold text-zinc-800 transition hover:bg-zinc-50"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold text-zinc-900">
        {quantidade}
      </span>
      <button
        type="button"
        onClick={onAumentar}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white text-lg font-bold text-zinc-800 transition hover:bg-zinc-50"
      >
        +
      </button>
    </div>
  );
}

export default function CatalogoOnline() {
  const [produtos, setProdutos] = useState(produtosPadrao);
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [subcategoriaAtiva, setSubcategoriaAtiva] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [slideAtual, setSlideAtual] = useState(0);
  const [carrinho, setCarrinho] = useState([]);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [categoriaMobileAberta, setCategoriaMobileAberta] = useState(null);
  const [animacoesCarrinho, setAnimacoesCarrinho] = useState([]);
  const [carrinhoDestacado, setCarrinhoDestacado] = useState(false);

  const botaoCarrinhoRef = useRef(null);
  const whatsapp = "5511978635579";

  useEffect(() => {
    document.documentElement.lang = "pt-BR";
    document.documentElement.setAttribute("translate", "no");
    document.body.setAttribute("translate", "no");
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}produtos.csv`)
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

  const categorias = useMemo(() => {
    const lista = [...new Set(produtos.map((produto) => produto.categoria))];
    return ["Todos", ...lista];
  }, [produtos]);

  const subcategoriasVisiveis = useMemo(() => {
    if (categoriaAtiva === "Todos") {
      return [];
    }

    const lista = [
      ...new Set(
        produtos
          .filter((produto) => produto.categoria === categoriaAtiva)
          .map((produto) => produto.subcategoria)
          .filter(Boolean)
      ),
    ];

    return lista;
  }, [produtos, categoriaAtiva]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const bateCategoria =
        categoriaAtiva === "Todos" || produto.categoria === categoriaAtiva;

      const bateSubcategoria =
        subcategoriaAtiva === "Todos" ||
        produto.subcategoria === subcategoriaAtiva;

      const termo = busca.toLowerCase().trim();
      const bateBusca =
        termo === "" ||
        produto.nome.toLowerCase().includes(termo) ||
        produto.categoria.toLowerCase().includes(termo) ||
        (produto.subcategoria || "").toLowerCase().includes(termo) ||
        produto.destaque.toLowerCase().includes(termo) ||
        produto.descricao.toLowerCase().includes(termo);

      return bateCategoria && bateSubcategoria && bateBusca;
    });
  }, [produtos, categoriaAtiva, subcategoriaAtiva, busca]);

  const totalItensCarrinho = useMemo(() => {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
  }, [carrinho]);

  const slideSelecionado = slidesDestaque[slideAtual];
  const produtoDoSlide =
    produtos.find((produto) => produto.id === slideSelecionado?.produtoId) || null;

  const abrirDetalhes = (produto) => {
    if (!produto) return;
    setProdutoSelecionado(produto);
    setImagemAtiva(0);
  };

  const fecharDetalhes = () => {
    setProdutoSelecionado(null);
    setImagemAtiva(0);
  };

  const quantidadeNoCarrinho = (produtoId) => {
    return carrinho.find((item) => item.id === produtoId)?.quantidade || 0;
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

  const adicionarAoCarrinho = (produto, event) => {
    if (!produto) return;

    animarProdutoParaCarrinho(event);

    setCarrinho((anterior) => {
      const existente = anterior.find((item) => item.id === produto.id);

      if (existente) {
        return anterior.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      return [...anterior, { ...produto, quantidade: 1 }];
    });
  };

  const aumentarQuantidade = (produto, event) => {
    if (!produto) return;

    animarProdutoParaCarrinho(event);

    setCarrinho((anterior) =>
      anterior.map((item) =>
        item.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      )
    );
  };

  const diminuirQuantidade = (produto) => {
    if (!produto) return;

    setCarrinho((anterior) =>
      anterior
        .map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
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

  return (
    <div
      className="min-h-screen bg-[#fcfcfc] text-zinc-900"
      lang="pt-BR"
      translate="no"
    >
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
          <div className="flex items-center gap-4 md:gap-12">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
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

            <nav className="ml-8 hidden items-center gap-1 lg:flex">
              {menuCategorias.map((categoria) => {
                const temSubmenu = categoria.itens.length > 0;

                if (!temSubmenu) {
                  const acao =
                    categoria.nome === "Quem somos"
                      ? irParaQuemSomos
                      : () => selecionarCategoria(categoria.nome);

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
                      onClick={() => selecionarCategoria(categoria.nome)}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      {categoria.nome}
                    </button>

                    <div className="invisible absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-zinc-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => selecionarCategoria(categoria.nome)}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#b38200] transition hover:bg-[#fff8df]"
                      >
                        Ver tudo em {categoria.nome}
                      </button>

                      <div className="my-2 border-t border-zinc-100" />

                      {categoria.itens.map((item) => (
                        <button
                          type="button"
                          key={item}
                          onClick={() => selecionarSubcategoria(categoria.nome, item)}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                        >
                          {item}
                        </button>
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

            <motion.button
              ref={botaoCarrinhoRef}
              type="button"
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

                <button
                  type="button"
                  onClick={() => {
                    setMenuMobileAberto(false);
                    setCategoriaMobileAberta(null);
                  }}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
                >
                  Fechar
                </button>
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
                      categoria.nome === "Quem somos"
                        ? () => {
                            setMenuMobileAberto(false);
                            setCategoriaMobileAberta(null);
                            setTimeout(() => {
                              irParaQuemSomos();
                            }, 50);
                          }
                        : () => selecionarCategoria(categoria.nome);

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
                          onClick={() => selecionarCategoria(categoria.nome)}
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
                            onClick={() => selecionarCategoria(categoria.nome)}
                            className="mb-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#b38200]"
                          >
                            Ver tudo em {categoria.nome}
                          </button>

                          {categoria.itens.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() =>
                                selecionarSubcategoria(categoria.nome, item)
                              }
                              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-white"
                            >
                              {item}
                            </button>
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
          <div className="grid gap-8 px-6 py-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-10">
            <motion.div
              className="flex flex-col justify-center py-2"
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

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
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
              className="self-center"
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            >
              <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.10)]">
                <div className="relative h-[420px] w-full bg-zinc-100 lg:h-[500px]">
                  <ImagemProduto
                    src={slideSelecionado?.imagem}
                    alt={slideSelecionado?.titulo || "Banner em destaque"}
                    className="h-full w-full scale-[1.12] object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <main id="catalogo" className="mx-auto max-w-7xl px-4 pb-16 pt-8">
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
                      key={categoria}
                      onClick={() => selecionarCategoria(categoria)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        ativa
                          ? "bg-[#f4b400] text-black shadow-sm"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {categoria}
                    </button>
                  );
                })}
              </div>

              {subcategoriasVisiveis.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSubcategoriaAtiva("Todos")}
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
                      onClick={() => setSubcategoriaAtiva(subcategoria)}
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
                {categoriaAtiva}
                {subcategoriaAtiva !== "Todos" ? ` • ${subcategoriaAtiva}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {produtosFiltrados.map((produto) => (
            <motion.article
              key={produto.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              className="group overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.10)]"
            >
              <div className="relative overflow-hidden">
                <ImagemProduto
                  src={produto.imagens?.[0]}
                  alt={produto.nome}
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                />

                {produto.imagens?.length > 1 && (
                  <span className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    +{produto.imagens.length} fotos
                  </span>
                )}

                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur">
                    {produto.categoria}
                  </span>
                  <span className="rounded-full bg-[#f4b400] px-3 py-1 text-xs font-bold text-black shadow-sm">
                    R$ {produto.preco.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <h4 className="text-xl font-bold">{produto.nome}</h4>
                  <p className="mt-1 text-sm font-medium text-[#b38200]">
                    {produto.destaque}
                  </p>
                  {produto.subcategoria && (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {produto.subcategoria}
                    </p>
                  )}
                </div>

                <p className="line-clamp-3 whitespace-pre-line text-sm leading-6 text-zinc-600">
                  {produto.descricao}
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={() => abrirDetalhes(produto)}
                    className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
                  >
                    Detalhes
                  </button>

                  {quantidadeNoCarrinho(produto.id) > 0 ? (
                    <ControleQuantidade
                      quantidade={quantidadeNoCarrinho(produto.id)}
                      onDiminuir={() => diminuirQuantidade(produto)}
                      onAumentar={(e) => aumentarQuantidade(produto, e)}
                      compacto
                    />
                  ) : (
                    <button
                      onClick={(e) => adicionarAoCarrinho(produto, e)}
                      className="rounded-2xl border border-[#f4b400] bg-[#fff8df] px-4 py-3 font-medium text-[#8b6900] transition hover:bg-[#fff2bf]"
                    >
                      Adicionar ao carrinho
                    </button>
                  )}
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

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#b38200]">
              Diferenciais
            </p>
            <h3 className="mt-3 text-2xl font-bold">
              Por que escolher a Additive Hub
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Projetos criativos com foco em personalização, funcionalidade e
              apresentação profissional.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
            <p className="font-semibold">Personalização real</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Adaptamos peças para presentes, lembranças, organização,
              decoração e projetos exclusivos.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
            <p className="font-semibold">Atendimento próximo</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Você fala direto pelo WhatsApp para alinhar detalhes, orçamento e
              personalização da peça.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-6 rounded-[2rem] border border-zinc-200 bg-gradient-to-r from-[#fffdf6] to-[#fff4cc] p-8 shadow-sm lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#b38200]">
              Processo
            </p>
            <h3 className="mt-3 text-2xl font-bold">Como funciona</h3>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-sm">
            <p className="font-semibold">1. Envie sua ideia</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Conte o que você precisa: chaveiro, item decorativo, utilidade,
              brinde, protótipo ou peça personalizada.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-sm">
            <p className="font-semibold">2. Produção personalizada</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Desenvolvemos e produzimos em impressão 3D com foco em estética,
              funcionalidade e acabamento.
            </p>
          </div>
        </div>
      </section>

      <section id="quem-somos" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-zinc-100">
            <ImagemProduto
              src="/imagens/banners/banner-2.png"
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
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Additive Hub • Design e Impressão 3D</p>
          <p>Peças personalizadas, utilidades, decoração e projetos sob medida</p>
        </div>
      </footer>

      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 rounded-full bg-[#f4b400] px-5 py-3 font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:opacity-90"
      >
        WhatsApp
      </a>

      <AnimatePresence>
        {produtoSelecionado && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={fecharDetalhes}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="grid max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.18)] lg:grid-cols-2"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex flex-col bg-zinc-100">
                <div className="relative min-h-[320px] flex-1">
                  <ImagemProduto
                    src={produtoSelecionado.imagens?.[imagemAtiva]}
                    alt={produtoSelecionado.nome}
                    className="h-full w-full object-cover"
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

              <div className="flex flex-col justify-between p-6 md:p-8">
                <div>
                  <span className="inline-flex w-fit rounded-full border border-[#f4b400]/30 bg-[#f4b400]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b6900]">
                    {slideSelecionado?.tag || "Novidades"}
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

                  <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Destaque</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {produtoSelecionado.destaque}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {quantidadeNoCarrinho(produtoSelecionado.id) > 0 ? (
                    <ControleQuantidade
                      quantidade={quantidadeNoCarrinho(produtoSelecionado.id)}
                      onDiminuir={() => diminuirQuantidade(produtoSelecionado)}
                      onAumentar={(e) => aumentarQuantidade(produtoSelecionado, e)}
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