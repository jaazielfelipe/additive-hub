import { useEffect, useMemo, useState } from "react";

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
      "imagens/produtos/chaveiro-personalizado/1.png",
      "imagens/produtos/chaveiro-personalizado/2.png",
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
      "imagens/produtos/miniatura-3d/1.png",
      "imagens/produtos/miniatura-3d/2.png",
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
      "imagens/produtos/suporte-celular/1.png",
      "imagens/produtos/suporte-celular/2.png",
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
      "imagens/produtos/peca-decorativa-3d/1.png",
      "imagens/produtos/peca-decorativa-3d/2.png",
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
      "imagens/produtos/organizador-mesa/1.png",
      "imagens/produtos/organizador-mesa/2.png",
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
    imagens: ["imagens/placeholder.png"],
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
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  if (linhas.length < 2) return [];

  const separarLinha = (linha) => {
    const resultado = [];
    let atual = "";
    let emAspas = false;

    for (let i = 0; i < linha.length; i += 1) {
      const char = linha[i];
      const proximo = linha[i + 1];

      if (char === '"') {
        if (emAspas && proximo === '"') {
          atual += '"';
          i += 1;
        } else {
          emAspas = !emAspas;
        }
      } else if (char === "," && !emAspas) {
        resultado.push(atual.trim());
        atual = "";
      } else {
        atual += char;
      }
    }

    resultado.push(atual.trim());
    return resultado;
  };

  const cabecalhos = separarLinha(linhas[0]).map((item) =>
    item.toLowerCase().trim()
  );

  return linhas.slice(1).map((linha, index) => {
    const colunas = separarLinha(linha);
    const item = {};

    cabecalhos.forEach((cabecalho, i) => {
      item[cabecalho] = colunas[i] ?? "";
    });

    const imagens = String(item.imagens || item.imagem || "imagens/placeholder.png")
      .split("|")
      .map((img) => img.trim())
      .filter(Boolean);

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
      imagens: imagens.length > 0 ? imagens : ["imagens/placeholder.png"],
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

  const caminhoLimpo = imagem.startsWith("/") ? imagem.slice(1) : imagem;
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

export default function CatalogoOnline() {
  const [produtos, setProdutos] = useState(produtosPadrao);
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [subcategoriaAtiva, setSubcategoriaAtiva] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [imagemAtiva, setImagemAtiva] = useState(0);

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
      .catch(() => {
        setProdutos(produtosPadrao);
      });
  }, []);

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

  const abrirDetalhes = (produto) => {
    setProdutoSelecionado(produto);
    setImagemAtiva(0);
  };

  const fecharDetalhes = () => {
    setProdutoSelecionado(null);
    setImagemAtiva(0);
  };

  const gerarMensagemWhatsApp = (produto) =>
    encodeURIComponent(
      `Olá! Tenho interesse neste produto da Additive Hub:\n\nProduto: ${produto.nome}\nCategoria: ${produto.categoria}\nSubcategoria: ${produto.subcategoria}\nValor: R$ ${produto.preco.toFixed(
        2
      )}\n\nPode me passar mais informações?`
    );

  const irParaCatalogo = () => {
    const secao = document.getElementById("catalogo");
    secao?.scrollIntoView({ behavior: "smooth" });
  };

  const selecionarCategoria = (categoria) => {
    setCategoriaAtiva(categoria);
    setSubcategoriaAtiva("Todos");
    setBusca("");
    setTimeout(() => {
      irParaCatalogo();
    }, 50);
  };

  const selecionarSubcategoria = (categoria, subcategoria) => {
    setCategoriaAtiva(categoria);
    setSubcategoriaAtiva(subcategoria);
    setBusca("");
    setTimeout(() => {
      irParaCatalogo();
    }, 50);
  };

  return (
    <div
      className="min-h-screen bg-[#fcfcfc] text-zinc-900"
      lang="pt-BR"
      translate="no"
    >
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
          <div className="flex items-center gap-12">
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
                  return (
                    <button
                      key={categoria.nome}
                      type="button"
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

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f4b400] px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
          >
            <IconeCarrinho className="h-4 w-4" />
            Carrinho
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-10">
        <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-gradient-to-br from-white via-[#fffdf6] to-[#fff4cc] shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="grid gap-10 px-6 py-10 md:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-14">
            <div>
              <span className="inline-flex rounded-full border border-[#f4b400]/30 bg-[#f4b400]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b6900]">
                Catálogo online
              </span>

              <h2 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                Impressão 3D com visual profissional e peças personalizadas sob
                medida
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
                Criamos chaveiros, utilidades, decoração, brindes e projetos
                personalizados em impressão 3D, unindo design, criatividade e
                acabamento de qualidade.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-[#f4b400] px-6 py-3.5 font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
                >
                  Pedir pelo WhatsApp
                </a>

                <button
                  onClick={irParaCatalogo}
                  className="rounded-2xl border border-zinc-300 bg-white px-6 py-3.5 font-medium text-zinc-800 transition hover:bg-zinc-50"
                >
                  Ver catálogo
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm text-zinc-500">Personalização</p>
                  <p className="mt-1 font-semibold">Peças únicas</p>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm text-zinc-500">Produção</p>
                  <p className="mt-1 font-semibold">Sob demanda</p>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm text-zinc-500">Atendimento</p>
                  <p className="mt-1 font-semibold">Via WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 self-center">
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">Especialidade</p>
                <h3 className="mt-2 text-2xl font-bold">
                  Design 3D personalizado
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Desenvolvemos peças decorativas, funcionais e exclusivas para
                  presentes, revenda, organização e projetos especiais.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-zinc-500">Catálogo</p>
                  <p className="mt-2 text-lg font-semibold">
                    Atualização por CSV
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-zinc-500">Projetos</p>
                  <p className="mt-2 text-lg font-semibold">Sob medida</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-2">
        <div className="grid gap-4 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h3 className="text-lg font-semibold">
              Como atualizar os produtos por Excel
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Salve sua planilha como{" "}
              <span className="font-semibold text-zinc-900">CSV</span> e coloque
              o arquivo{" "}
              <span className="font-semibold text-zinc-900">produtos.csv</span>{" "}
              dentro da pasta{" "}
              <span className="font-semibold text-zinc-900">public</span> com as
              colunas: id, nome, categoria, subcategoria, preco, destaque,
              descricao e imagens.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700">
            Excel → Salvar como CSV → public/produtos.csv
          </div>
        </div>
      </section>

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
            <article
              key={produto.id}
              className="group overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.10)]"
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

                <p className="line-clamp-3 text-sm leading-6 text-zinc-600">
                  {produto.descricao}
                </p>

                <div className="flex gap-3 pt-1">
                  <a
                    href={`https://wa.me/${whatsapp}?text=${gerarMensagemWhatsApp(
                      produto
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-2xl bg-[#f4b400] px-4 py-3 text-center font-semibold text-black transition hover:opacity-90"
                  >
                    Solicitar orçamento
                  </a>

                  <button
                    onClick={() => abrirDetalhes(produto)}
                    className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            </article>
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

      {produtoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="grid max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.18)] lg:grid-cols-2">
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
                <span className="inline-flex rounded-full bg-[#f4b400] px-3 py-1 text-xs font-semibold text-black">
                  {produtoSelecionado.categoria}
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

                <p className="mt-5 leading-7 text-zinc-600">
                  {produtoSelecionado.descricao}
                </p>

                <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Destaque</p>
                  <p className="mt-1 font-medium text-zinc-900">
                    {produtoSelecionado.destaque}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`https://wa.me/${whatsapp}?text=${gerarMensagemWhatsApp(
                    produtoSelecionado
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-2xl bg-[#f4b400] px-5 py-3 text-center font-semibold text-black transition hover:opacity-90"
                >
                  Solicitar pelo WhatsApp
                </a>

                <button
                  onClick={fecharDetalhes}
                  className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}