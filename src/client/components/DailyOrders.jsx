import { useState } from "react";
import {
  Box,
  Button,
  Snackbar,
  SnackbarContent,
  CircularProgress,
  Slide,
} from "@mui/material";
import { CloudUploadRounded } from "@mui/icons-material";
import { uploadFile, uploadProcessedFile } from "../API";
import "../CSS/DailyOrders.css";

const SlideUp = (props) => {
  return <Slide {...props} direction="up" />;
};

export default function DailyOrders() {
  const [upload, setUpload] = useState(null);
  const [processed, setProcessed] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (e.target.name === "upload-file") {
      setUpload(file);
      console.log("File uploaded");
      showSnackbar("Today's file uploaded");
    } else if (e.target.name === "processed-file") {
      setProcessed(file);
      console.log("Proessed file uploaded");
      showSnackbar("Processed file uploaded");
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!upload || !processed) {
      alert("Please upload required files.");
      return;
    }
    setLoading(true);

    try {
      await uploadProcessedFile(processed);
      console.log(processed);
      await uploadFile(upload);
      console.log(upload);
    } catch (error) {
      console.error("Error sorting files");
      setError("Failed to find today's order.");
    } finally {
      showSnackbar("Orders sent!");
      setLoading(false);
    }
  };

  return (
    <Box className="daily-orders">
      <h1 className="title">Daily Orders</h1>
      <p>Drag and drop or select button to upload files</p>
      <Box className="file-uploads">
        <Box
          className="new-file"
          sx={{
            border: "2px dashed #ccc",
            borderRadius: 2,
            padding: 2,
            margin: 1,
            textAlign: "center",
            position: "relative",
            "&:hover": {
              borderColor: "#888",
            },
          }}
        >
          <Button
            className="new"
            component="label"
            variant="contained"
            startIcon={<CloudUploadRounded />}
          >
            New Orders
            <input
              type="file"
              name="upload-file"
              hidden
              onChange={handleFileChange}
              accept=".xlsx"
            />
          </Button>
        </Box>
        <Box
          className="processed-file"
          sx={{
            border: "2px dashed #ccc",
            borderRadius: 2,
            padding: 2,
            margin: 1,
            textAlign: "center",
            position: "relative",
            "&:hover": {
              borderColor: "#888",
            },
          }}
        >
          <Button
            className="processed"
            component="label"
            variant="contained"
            startIcon={<CloudUploadRounded />}
          >
            Processed Sheet
            <input
              type="file"
              name="processed-file"
              hidden
              onChange={handleFileChange}
              accept=".xlsx"
            />
          </Button>
        </Box>
      </Box>
      <Button
        className="submit"
        variant="contained"
        onClick={handleSubmit}
        disabled={loading}
        sx={{
          "&.Mui-disabled": {
            backgroundColor: "#5e7889",
            color: "white",
          },
        }}
      >
        {loading ? (
          <CircularProgress size={24} sx={{ color: "white" }} />
        ) : (
          "Submit"
        )}
      </Button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <Snackbar
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        TransitionComponent={SlideUp}
        message={snackbarMessage}
        autoHideDuration={5000}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: "#49c758",
          },
        }}
      />
    </Box>
  );
}
