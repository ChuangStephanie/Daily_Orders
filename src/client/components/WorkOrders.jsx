import {
  Box,
  Button,
  Snackbar,
  SnackbarContent,
  CircularProgress,
  Slide,
  TextField,
  inputLabelClasses,
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("#49c758")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showSnackbar = (message, color) => {
    setSnackbarMessage(message);
    if (color) {
      setSnackbarColor(color)
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
    <Box className="work-orders">
      <h1 className="title" >Work Orders</h1>
      <Box
        className="palletDrop"
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
            <input type="file" name="Pallet Details" hidden onChange={handleFile1Change} />
          </Button>
        </Box>
      </Box>
      <Box
        className="repairDrop"
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
            <input type="file" name="Repair Sheet" hidden onChange={handleFile2Change} />
          </Button>
        </Box>
      </Box>
      <Box className="input">
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
        ></TextField>
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
