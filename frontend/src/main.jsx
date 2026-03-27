import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import CatalogoOnline from "./pages/CatalogoOnline";
import PaginaSucesso from "./pages/PaginaSucesso";
import PaginaFalha from "./pages/PaginaFalha";
import PaginaPendente from "./pages/PaginaPendente";
import Checkout from "./pages/Checkout";
import AcompanharPedido from "./pages/AcompanharPedido";
import Carrinho from "./pages/Carrinho";
import Painel from "./pages/Painel";
import Login from "./pages/Login";
import RotaProtegida from "./components/RotaProtegida";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<CatalogoOnline />} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/acompanhar-pedido" element={<AcompanharPedido />} />
        <Route path="/pagamento/sucesso" element={<PaginaSucesso />} />
        <Route path="/pagamento/falha" element={<PaginaFalha />} />
        <Route path="/pagamento/pendente" element={<PaginaPendente />} />
        
        <Route path="/login" element={<Login />} />
        <Route
  path="/painel"
  element={
    <RotaProtegida>
      <Painel />
    </RotaProtegida>
  }
/>

      </Routes>
    </HashRouter>
  </React.StrictMode>
);