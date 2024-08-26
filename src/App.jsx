import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import DailyOrders from "./client/components/DailyOrders";
import Appbar from "./client/components/Appbar";

function App() {
  return (
    <>
      <Appbar />
      <Routes>
        <Route path="/" element={<DailyOrders />} />
      </Routes>
    </>
  );
}

export default App;
