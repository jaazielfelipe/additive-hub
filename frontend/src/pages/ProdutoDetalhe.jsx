import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

function getImagemSrc(imagem) {
  if (!imagem) return assetUrl("imagens/placeholder.png");

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
    };
  });
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutoDetalhe() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [produtos, setProdutos] = useState([]);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarCSV() {
      const caminhos = [assetUrl("produtos.csv"), assetUrl("produtos/produtos.csv")];

      for (const caminho of caminhos) {
        try {
          const res = await fetch(caminho, { cache: "no-store" });
          if (!res.ok) continue;

          const texto = await res.text();
          const inicio = texto.trim().toLowerCase();

          if (inicio.startsWith("<!doctype html") || inicio.startsWith("<html")) {
            continue;
          }

          const lista = parseCSV(texto);
          if (lista.length > 0) {
            setProdutos(lista);
            setCarregando(false);
            return;
          }
        } catch (erro) {
          console.error(`Erro ao carregar CSV em ${caminho}:`, erro);
        }
      }

      setProdutos([]);
      setCarregando(false);
    }

    carregarCSV();
  }, []);

  const produto = useMemo(() => {
    return produtos.find((item) => String(item.id) === String(id)) || null;
  }, [produtos, id]);

  const relacionados = useMemo(() => {
    if (!produto) return [];

    return produtos
      .filter(
        (item) =>
          item.id !== produto.id &&
          slugCategoria(item.categoria) === slugCategoria(produto.categoria)
      )
      .slice(0, 4);
  }, [produtos, produto]);

  useEffect(() => {
    if (produto) {
      document.title = `${produto.nome} | Additive Hub`;
    } else {
      document.title = "Produto | Additive Hub";
    }
  }, [produto]);

  useEffect(() => {
    setImagemAtiva(0);
  }, [id]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] px-4 py-16 text-zinc-900">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-zinc-500">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] px-4 py-16 text-zinc-900">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <p className="mt-3 text-zinc-500">
            Esse produto não foi localizado no catálogo.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-2xl bg-[#f4b400] px-6 py-3 font-semibold text-black transition hover:opacity-90"
          >
            Voltar ao catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            ← Voltar
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Ver catálogo
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <button type="button" onClick={() => navigate("/")} className="hover:text-zinc-900">
            Início
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate(`/categoria/${produto.categoria}`)}
            className="hover:text-zinc-900"
          >
            {produto.categoriaLabel || tituloCategoria(produto.categoria)}
          </button>

          {produto.subcategoria && (
            <>
              <span>/</span>
              <button
                type="button"
                onClick={() =>
                  navigate(`/categoria/${produto.categoria}/${slugCategoria(produto.subcategoria)}`)
                }
                className="hover:text-zinc-900"
              >
                {produto.subcategoria}
              </button>
            </>
          )}

          <span>/</span>
          <span className="font-semibold text-zinc-900">{produto.nome}</span>
        </div>

        <section className="grid gap-8 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1fr] lg:p-8">
          <div>
            <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-zinc-100">
              <ImagemProduto
                src={produto.imagens?.[imagemAtiva]}
                alt={produto.nome}
                className="aspect-square w-full object-cover"
              />
            </div>

            {produto.imagens?.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {produto.imagens.map((img, index) => {
                  const ativa = imagemAtiva === index;

                  return (
                    <button
                      key={`${produto.id}-${index}`}
                      type="button"
                      onClick={() => setImagemAtiva(index)}
                      className={`overflow-hidden rounded-2xl border-2 transition ${
                        ativa
                          ? "border-[#f4b400]"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <ImagemProduto
                        src={img}
                        alt={`${produto.nome} ${index + 1}`}
                        className="h-20 w-20 object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="inline-flex w-fit rounded-full border border-[#f4b400]/30 bg-[#f4b400]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b6900]">
              {produto.categoriaLabel || tituloCategoria(produto.categoria)}
            </span>

            <h1 className="mt-4 text-3xl font-bold md:text-4xl">{produto.nome}</h1>

            {produto.subcategoria && (
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
                {produto.subcategoria}
                {produto.subcategoria2 ? ` • ${produto.subcategoria2}` : ""}
              </p>
            )}

            <p className="mt-4 text-3xl font-black tracking-tight text-zinc-900">
              {formatarMoeda(produto.preco)}
            </p>

            <p className="mt-3 text-base font-medium text-[#b38200]">
              {produto.destaque}
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-900">Descrição</p>
              <p className="mt-3 whitespace-pre-line leading-7 text-zinc-600">
                {produto.descricao}
              </p>
            </div>

            {produto.variacoes?.length > 0 && (
              <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold text-zinc-900">Opções disponíveis</p>

                <div className="mt-4 space-y-4">
                  {produto.variacoes.map((variacao) => (
                    <div key={`${produto.id}-${variacao.nome}`}>
                      <p className="mb-2 text-sm font-medium text-zinc-800">
                        {variacao.nome}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {variacao.opcoes.map((opcao) => (
                          <span
                            key={`${variacao.nome}-${opcao}`}
                            className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
                          >
                            {opcao}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/carrinho")}
                className="rounded-2xl bg-[#f4b400] px-6 py-3 font-semibold text-black transition hover:opacity-90"
              >
                Ir para o carrinho
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-2xl border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Continuar comprando
              </button>
            </div>
          </div>
        </section>

        {relacionados.length > 0 && (
          <section className="mt-10">
            <div className="mb-5">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
                Você também pode gostar
              </p>
              <h2 className="mt-1 text-2xl font-bold">Produtos relacionados</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relacionados.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/produto/${item.id}`)}
                    className="block w-full text-left"
                  >
                    <div className="bg-zinc-100">
                      <ImagemProduto
                        src={item.imagens?.[0]}
                        alt={item.nome}
                        className="aspect-square w-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-bold text-zinc-900">
                        {item.nome}
                      </h3>
                      <p className="mt-2 text-lg font-black text-zinc-900">
                        {formatarMoeda(item.preco)}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                        {item.destaque}
                      </p>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}