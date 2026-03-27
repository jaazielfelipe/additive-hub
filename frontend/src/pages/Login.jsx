import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const fazerLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      setCarregando(true);

      const response = await fetch(`${apiBaseUrl}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao fazer login.");
      }

      localStorage.setItem("adminTokenAdditiveHub", data.token);
      localStorage.setItem(
        "adminUsuarioAdditiveHub",
        JSON.stringify(data.usuario || {})
      );

      window.location.href = "/#/painel";
    } catch (error) {
      setErro(error.message || "Erro ao fazer login.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-md rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b38200]">
          Additive Hub
        </p>

        <h1 className="mt-3 text-3xl font-bold">Login do painel</h1>
        <p className="mt-2 text-zinc-600">
          Entre com seu e-mail e senha para acessar o painel.
        </p>

        <form onSubmit={fazerLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="admin@site.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="********"
              required
            />
          </div>

          {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-2xl bg-[#f4b400] px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}