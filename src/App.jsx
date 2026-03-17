export default function CatalogoOnline() {
  const produtos = [
    {
      id: 1,
      nome: "Chaveiro Classic",
      categoria: "Plano",
      preco: 8,
      destaque: "Modelo leve e versátil",
      imagem: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      nome: "Chaveiro Personalizado",
      categoria: "Plano Personalizado",
      preco: 10,
      destaque: "Ideal para nomes e brindes",
      imagem: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      nome: "Chaveiro Relevo",
      categoria: "Plano com Relevo",
      preco: 10,
      destaque: "Visual mais marcante",
      imagem: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 4,
      nome: "Chaveiro 3D",
      categoria: "3D Simples",
      preco: 12,
      destaque: "Mais volume e presença",
      imagem: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 5,
      nome: "Chaveiro Mini Flex",
      categoria: "Mini Flexível",
      preco: 12,
      destaque: "Leve, divertido e diferenciado",
      imagem: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 6,
      nome: "Chaveiro Giratório",
      categoria: "3D Giratório",
      preco: 12,
      destaque: "Modelo interativo e criativo",
      imagem: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const whatsapp = "5599999999999";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Catálogo Online</h1>
            <p className="text-sm text-zinc-500">Produtos personalizados em impressão 3D</p>
          </div>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl px-4 py-2 bg-zinc-900 text-white text-sm font-medium shadow hover:opacity-90 transition"
          >
            Fazer pedido
          </a>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-700 text-white rounded-3xl p-8 shadow-lg">
          <span className="inline-block text-xs uppercase tracking-[0.2em] bg-white/10 rounded-full px-3 py-1 mb-4">
            Catálogo Digital
          </span>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight max-w-2xl">
            Chaveiros criativos para presentear, vender e colecionar
          </h2>
          <p className="mt-4 text-zinc-200 max-w-2xl text-base md:text-lg">
            Escolha seu modelo favorito e peça direto pelo WhatsApp com praticidade.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map((produto) => {
            const mensagem = encodeURIComponent(
              `Olá! Tenho interesse no ${produto.nome} (${produto.categoria}) por R$ ${produto.preco.toFixed(2)}.`
            );

            return (
              <article
                key={produto.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border hover:shadow-lg transition"
              >
                <img
                  src={produto.imagem}
                  alt={produto.nome}
                  className="w-full h-64 object-cover"
                />

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {produto.categoria}
                      </p>
                      <h3 className="text-xl font-bold">{produto.nome}</h3>
                    </div>
                    <span className="text-lg font-bold">R$ {produto.preco.toFixed(2)}</span>
                  </div>

                  <p className="text-sm text-zinc-600">{produto.destaque}</p>

                  <div className="flex gap-3 pt-2">
                    <a
                      href={`https://wa.me/${whatsapp}?text=${mensagem}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center rounded-2xl px-4 py-3 bg-zinc-900 text-white font-medium hover:opacity-90 transition"
                    >
                      Pedir no WhatsApp
                    </a>
                    <button className="rounded-2xl px-4 py-3 border font-medium hover:bg-zinc-50 transition">
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-zinc-500 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <p>© 2026 Catálogo Online • Feito para divulgação de produtos</p>
          <p>Personalize preços, fotos e link do WhatsApp antes de publicar</p>
        </div>
      </footer>
    </div>
  );
}
