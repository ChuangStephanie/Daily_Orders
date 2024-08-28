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
  let today = 0;
  const handleSubmit = () => {};
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
          <Button variant="contained" type="submit" >Submit</Button>
        </Box>
        <h3>WIP Today: {today}</h3>
      </Box>
    </>
  );
}
