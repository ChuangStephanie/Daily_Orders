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
import { processWorkOrders } from "../API";
import "../CSS/WorkOrders.css";

const SlideUp = (props) => {
  return <Slide {...props} direction="up" />;
};

export default function WorkOrders() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [date, setDate] = useState(null);
  const [machine, setMachine] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("#49c758");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showSnackbar = (message, color) => {
    setSnackbarMessage(message);
    if (color) {
      setSnackbarColor(color);
    }
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleFile1Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile1(file);
      showSnackbar("File uploaded");
    }
  };

  const handleFile2Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile2(file);
      showSnackbar("File uploaded");
    }
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file.name.endsWith(".xlsx")) {
      if (type === "pallet") {
        setFile1(file);
        showSnackbar("Pallet Details uploaded.");
      } else if (type === "repair") {
        setFile2(file);
        showSnackbar("Repair Sheet uploaded.");
      }
    } else {
      showSnackbar("Only excel files accepted.", "red");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleMachineChange = (e) => {
    setMachine(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file1 || !file2) {
      showSnackbar("Select files for work orders", "red");
      return;
    }

    const filesArray = [file1, file2];

    setLoading(true);

    try {
      await processWorkOrders(filesArray);
      console.log("Uploaded files:", filesArray);
    } catch (error) {
      console.error("Error processing orders.");
      setError("Failed to process orders.");
    } finally {
      showSnackbar("Work orders processed!");
      setLoading(false);
    }
  };

  return (
    <Box className="main-container">
      <h1 className="title">Work Orders</h1>
      <Box className="work-orders">
        <Box className="form">
          <Box className="inputs">
            <Box className="uploads">
              <h2>Uploads</h2>
              <Box
                className="palletDrop"
                onDrop={(e) => handleDrop(e, "pallet")}
                onDragOver={handleDragOver}
                sx={{
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  padding: 4,
                  margin: 1,
                  textAlign: "center",
                  position: "relative",
                  "&:hover": {
                    borderColor: "#888",
                  },
                }}
              >
                <Box className="palletDetails">
                  <Button
                    className="pallet"
                    startIcon={<CloudUploadRounded />}
                    component="label"
                    variant="contained"
                  >
                    Pallet Details
                    <input
                      type="file"
                      name="Pallet Details"
                      hidden
                      onChange={handleFile1Change}
                    />
                  </Button>
                </Box>
              </Box>
              <Box
                className="repairDrop"
                onDrop={(e) => handleDrop(e, "repair")}
                onDragOver={handleDragOver}
                sx={{
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  padding: 4,
                  margin: 1,
                  textAlign: "center",
                  position: "relative",
                  "&:hover": {
                    borderColor: "#888",
                  },
                }}
              >
                <Box className="repairSheet">
                  <Button
                    className="repair"
                    startIcon={<CloudUploadRounded />}
                    component="label"
                    variant="contained"
                  >
                    Repair Sheet
                    <input
                      type="file"
                      name="Repair Sheet"
                      hidden
                      onChange={handleFile2Change}
                    />
                  </Button>
                </Box>
              </Box>
              <Box className="date">
                <p>Insert date in format of MM/DD/YYYY</p>
                <TextField
                  variant="filled"
                  label="Input Date"
                  size="small"
                  onChange={handleDateChange}
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
                />
              </Box>
            </Box>
            <Box className="scrap">
              <h2>Scrap</h2>
              <Box className="scrapFields">
                <TextField
                  select
                  variant="filled"
                  label="Machine"
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
                    minWidth: 120,
                    "& .MuiInputBase-input": {
                      color: "gray",
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value="SEgray" >SE Gray</MenuItem>
                  <MenuItem value="SEwhite" >SE White</MenuItem>
                  <MenuItem value="6001" >6001 Pro</MenuItem>
                  <MenuItem value="6002" >6002 Pro</MenuItem>
                </TextField>
                <TextField
                  variant="filled"
                  label="Amount"
                  size="small"
                  type="number"
                  InputLabelProps={{
                    sx: {
                      color: "gray",
                      [`&.${inputLabelClasses.shrink}`]: {
                        color: "primary",
                      },
                    },
                  }}
                  sx={{
                    maxWidth: 120,
                    "& .MuiInputBase-input": {
                      color: "gray",
                    },
                  }}
                />
                <Button className="add" variant="contained" size="small">
                  Add
                </Button>
              </Box>
            </Box>
          </Box>
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
          {error && <p style={{ color: "red" }}>{error}</p>}
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
    </Box>
  );
}
