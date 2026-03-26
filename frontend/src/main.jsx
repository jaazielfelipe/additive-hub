import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css"; // 👈 FALTAVA ISSO

import CatalogoOnline from "./pages/CatalogoOnline";
import PaginaSucesso from "./pages/PaginaSucesso";
import PaginaFalha from "./pages/PaginaFalha";
import PaginaPendente from "./pages/PaginaPendente";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogoOnline />} />
        <Route path="/pagamento/sucesso" element={<PaginaSucesso />} />
        <Route path="/pagamento/falha" element={<PaginaFalha />} />
        <Route path="/pagamento/pendente" element={<PaginaPendente />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);