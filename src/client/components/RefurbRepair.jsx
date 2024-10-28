import {
  Box,
  Button,
  Snackbar,
  SnackbarContent,
  CircularProgress,
  Slide,
  TextField,
  inputLabelClasses,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useState } from "react";
import { CloudUploadRounded } from "@mui/icons-material";
import { refurbRepairOrders } from "../API";
import "../CSS/RefurbRepair.css";

const SlideUp = (props) => {
  return <Slide {...props} direction="up" />;
};

export default function RefurbRepair() {
  const [file, setFile] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarColor, setSnackbarColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showSnackbar = (message, color) => {
    setSnackbarMessage(message);
    if (color) {
      setSnackbarColor(color);
    } else {
      setSnackbarColor("#49c758");
    }
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      showSnackbar("File uploaded");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await refurbRepairOrders(file);
      showSnackbar("File processed!");
    } catch (error) {
      showSnackbar("Error processing file", "red");
    } finally {        
      showSnackbar("File processed!");
      setLoading(false);
    }
  };

  return (
    <Box className="main-container">
      <h1>Refurb Repair</h1>
      <p>Upload repair sheet</p>
      <Box className="upload">
        <Button
          startIcon={<CloudUploadRounded />}
          component="label"
          variant="contained"
        >
          Repair Sheet
          <input
            type="file"
            name="Repair Sheet"
            hidden
            onChange={handleFileChange}
          />
        </Button>
        <Button
          className="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "Submit"
          )}
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        TransitionComponent={SlideUp}
        message={snackbarMessage}
        autoHideDuration={5000}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: snackbarColor,
          },
        }}
      />
    </Box>
  );
}
