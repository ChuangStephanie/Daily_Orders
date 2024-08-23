import React, { useState } from "react";
export const baseURL = "http://localhost:5050/api";

export async function uploadFile(file) {
  if (!file) {
    alert("No file uploaded.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${baseURL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    // file name
    const newDate = new Date();
    const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
    const date = newDate.getDate().toString().padStart(2, "0");
    const today = `${month}.${date}`;
    const fileName = `AiperDropshipOrderDetails ${today}.xlsx`;

    // response in blob format
    const blob = await response.blob();

    // url for blob
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    //cleanup after download
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

export async function uploadProcessedFile(processed) {
  if (!processed) {
    alert("No file uploaded.");
    return;
  }

  const formData = new FormData();
  formData.append("file", processed);

  try {
    const response = await fetch(`${baseURL}/upload-processed`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload processed file: ${response.statusText}`
      );
    }
    return await response.text();
  } catch (error) {
    console.error("Error uploading processed file:", error);
    throw error;
  }
}
