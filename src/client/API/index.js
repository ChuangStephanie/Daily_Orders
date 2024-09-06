import React, { useState } from "react";
export const baseURL = "https://daily-orders.onrender.com";

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

export async function processWorkOrders(files) {
  if (!files || files.length <= 1) {
    alert("Upload required files.");
    return;
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  })

  try {
    const response = await fetch(`${baseURL}/work-orders`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to process work orders: ${response.statusText}`);
    }

    const blob = await response.blob();

    const date = new Date()
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, ".");
    const fileName = `Work Orders ${date}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    //cleanup after download
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);

  } catch (error) {
    console.error(`Error processing work orders: ${error}`);
    throw error;
  }

};