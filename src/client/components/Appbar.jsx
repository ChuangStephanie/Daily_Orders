import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";

export default function Appbar() {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ width: "100%" }}>
        <Toolbar>
          <Typography variant="title" component="div">
            <Link style={{ textTransform: "uppercase", color: "white" }} to="/">
              Techcess Solutions
            </Link>
          </Typography>
          <Box sx={{ flexGrow: 1 }}></Box>
          <Button
            color="inherit"
            onClick={() => {
              navigate("/");
            }}
          >
            Daily Orders
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              navigate("work-orders");
            }}
          >
            Work Orders
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              navigate("/wip");
            }}
          >
            WIP
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
