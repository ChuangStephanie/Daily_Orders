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
  const [formValues, setFormValues] = useState([{ model: "", qty: "" }]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
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
        showSnackbar("Pallet Details uploaded");
      } else if (type === "repair") {
        setFile2(file);
        showSnackbar("Repair Sheet uploaded");
      }
    } else {
      showSnackbar("Only excel files accepted.", "red");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleChange = (i, e) => {
    const newFormValues = [...formValues];
    newFormValues[i][e.target.name] = e.target.value;
    setFormValues(newFormValues);
  };
  const addFormFields = () => {
    setFormValues([...formValues, { model: "", qty: "" }]);
    console.log("item added");
  };
  const removeFormFields = (i) => {
    const newFormValues = [...formValues];
    newFormValues.splice(i, 1);
    setFormValues(newFormValues);
    console.log("item removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file1 || !file2) {
      showSnackbar("Select files for work orders", "red");
      return;
    }

    const filesArray = [file1, file2];
    const machines = formValues;

    setLoading(true);

    try {
      await processWorkOrders(filesArray, machines, date);
      console.log("Uploaded:", filesArray, machines, date);
      showSnackbar("Work orders processed!");
    } catch (error) {
      console.error("Error processing orders.");
      showSnackbar("Error processing orders.", "red");
    } finally {
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
              <h2>Files</h2>
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
                {formValues.map((element, index) => (
                  <Box key={index}>
                    <TextField
                      select
                      variant="filled"
                      name="model"
                      label="Machine"
                      size="small"
                      value={element.model || ""}
                      onChange={(e) => handleChange(index, e)}
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
                      <MenuItem value="SE Gray">SE Gray</MenuItem>
                      <MenuItem value="SE White">SE White</MenuItem>
                      <MenuItem value="6001 Pro">6001 Pro Gray</MenuItem>
                      <MenuItem value="6002 Pro">6002 Pro Gray</MenuItem>
                      <MenuItem value="Scuba SE Gray">Scuba SE Gray</MenuItem>
                      <MenuItem value="Scuba SE White">Scuba SE White</MenuItem>
                      <MenuItem value="Scuba S1 Gray">Scuba S1 Gray</MenuItem>
                      <MenuItem value="Scuba S1 Blue">Scuba S1 Blue</MenuItem>
                      <MenuItem value="ZT2001 800B">ZT2001 800B Gray</MenuItem>
                      <MenuItem value="ZT2001 800">ZT2001 800 White</MenuItem>
                    </TextField>
                    <TextField
                      variant="filled"
                      name="qty"
                      label="Amount"
                      size="small"
                      type="number"
                      value={element.qty || ""}
                      onChange={(e) => handleChange(index, e)}
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
                    {index ? (
                      <Button
                        className="remove"
                        variant="contained"
                        size="small"
                        onClick={() => removeFormFields(index)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Box>
                ))}
              </Box>
              <Button
                className="add"
                variant="contained"
                size="small"
                onClick={addFormFields}
              >
                Add
              </Button>
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
