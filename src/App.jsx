import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import DailyOrders from "./client/components/DailyOrders";
import Appbar from "./client/components/Appbar";
import WIP from "./client/components/WIP";
import WorkOrders from "./client/components/WorkOrders";

function App() {
  return (
    <>
      <Appbar />
      <Routes>
        <Route path="/" element={<DailyOrders />} />
        <Route path="/wip" element={<WIP />} />
        <Route path="/work-orders" element={<WorkOrders />} />
      </Routes>
    </>
  );
}

export default App;
