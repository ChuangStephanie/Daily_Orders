import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import DailyOrders from "./client/components/DailyOrders";
import Appbar from "./client/components/Appbar";
import WIP from "./client/components/WIP";

function App() {
  return (
    <>
      <Appbar />
      <Routes>
        <Route path="/" element={<DailyOrders />} />
        <Route path="/wip" element={<WIP />} />
      </Routes>
    </>
  );
}

export default App;
