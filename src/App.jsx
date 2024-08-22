import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import DailyOrders from "./client/components/DailyOrders";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DailyOrders />} />
      </Routes>
    </>
  );
}

export default App;
