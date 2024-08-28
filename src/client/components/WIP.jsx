import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  inputLabelClasses,
} from "@mui/material";
import "../CSS/WIP.css";

export default function WIP() {
  const [todayWip, setTodayWip] = useState("");
  const [yesterdayWip, setYesterdayWip] = useState("");
  const [received, setReceived] = useState("");
  const [fg, setFg] = useState("");
  const [scrap, setScrap] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const calcWip =
      (Number(yesterdayWip) || 0) +
      (Number(received) || 0) -
      ((Number(fg) || 0) + (Number(scrap) || 0));
    setTodayWip(calcWip);
  };

  const handleNumberChange = (setter) => (e) => {
    const value = e.target.value;
    setter(value);
  };

  return (
    <>
      <Box className="wip-count">
        <h1>Today's WIP Count</h1>
        <Box className="form" component="form" onSubmit={handleSubmit}>
          <Box className="calculate">
            <TextField
              variant="filled"
              label="Yesterday's Wip"
              size="small"
              type="number"
              value={yesterdayWip}
              onChange={handleNumberChange(setYesterdayWip)}
              InputLabelProps={{
                sx: {
                  color: "gray",
                  [`&.${inputLabelClasses.shrink}`]: {
                    color: "primary",
                  },
                },
              }}
              sx={{
                "& .MuiInputBase-input": {
                  color: "gray",
                },
              }}
            ></TextField>
            <TextField
              variant="filled"
              label="Received"
              size="small"
              type="number"
              value={received}
              onChange={handleNumberChange(setReceived)}
              InputLabelProps={{
                sx: {
                  color: "gray",
                  [`&.${inputLabelClasses.shrink}`]: {
                    color: "primary",
                  },
                },
              }}
              sx={{
                "& .MuiInputBase-input": {
                  color: "gray",
                },
              }}
            ></TextField>
            <TextField
              variant="filled"
              label="FG"
              size="small"
              type="number"
              value={fg}
              onChange={handleNumberChange(setFg)}
              InputLabelProps={{
                sx: {
                  color: "gray",
                  [`&.${inputLabelClasses.shrink}`]: {
                    color: "primary",
                  },
                },
              }}
              sx={{
                "& .MuiInputBase-input": {
                  color: "gray",
                },
              }}
            ></TextField>
            <TextField
              variant="filled"
              label="Scrap"
              size="small"
              type="number"
              value={scrap}
              onChange={handleNumberChange(setScrap)}
              InputLabelProps={{
                sx: {
                  color: "gray",
                  [`&.${inputLabelClasses.shrink}`]: {
                    color: "primary",
                  },
                },
              }}
              sx={{
                "& .MuiInputBase-input": {
                  color: "gray",
                },
              }}
            ></TextField>
          </Box>
          <Button variant="contained" type="submit">
            Submit
          </Button>
        </Box>
        <h3>WIP Today: {todayWip}</h3>
      </Box>
    </>
  );
}
