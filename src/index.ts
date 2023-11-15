import express from "express";
import axios from "axios"; // Import Axios for making HTTP requests

const app = express();
app.use(express.json());
const PORT = 3002;

// Your existing routes for the first server

app.post("/api/login", async (req, res) => {
  try {
    const requestData = {
      slotNumber: req.body.slotNumber,
      password: req.body.password,
    };
    const response = await axios.post(
      "http://localhost:3004/api/login",
      requestData
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error in making request to the second server",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/api/logout", async (req, res) => {
  try {
    const response = await axios.post("http://localhost:3004/api/logout");
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error in making request to the second server",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/keys/all", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:3004/api/keys/all");
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error in making request to the second server",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/keys/generate", async (req, res) => {
  try {
    // Make a request to the second server to generate the key
    const requestData = { label: req.body.label };
    const response = await axios.post(
      "http://localhost:3004/api/keys/generate",
      requestData
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error in making request to the second server",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/signTransaction", async (req, res) => {
  try {
    const { ethereumAddress, data, label, nonce, gasPrice, to } = req.body;
    console.log(to);
    const response = await axios.post(
      "http://localhost:3004/api/signTransaction",
      { ethereumAddress, data, label, nonce, gasPrice, to }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error in making request to the second server",
      error.message
    );
    res.status(500).json({ error: "internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`First server listening at http://localhost:${PORT}`);
});
