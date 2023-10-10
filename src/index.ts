import express from "express";
import axios from "axios"; // Import Axios for making HTTP requests
import ABI from "./Abi.json";
import { Web3 } from "web3";

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    "https://polygon-mumbai.infura.io/v3/fa806ffb8afb4754a3fcd2ef247de5af"
  )
);

const app = express();
app.use(express.json());
const PORT = 3002;

const contract = new web3.eth.Contract(ABI);

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
    const requestData = { keylabel: req.body.keylabel };
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
app.post("/api/tx/generator/createAsset", async (req, res) => {
  try {
    const {
      name,
      symbol,
      totalSupply,
      requiredSignatures,
      initialSigners,
      label,
      ethereumAddress,
    } = req.body;
    const data = (
      contract.methods.createAsset as (...args: any[]) => {
        encodeABI: () => string;
      }
    )(
      name,
      symbol,
      totalSupply,
      requiredSignatures,
      initialSigners
    ).encodeABI();
    const nonce = Number(await web3.eth.getTransactionCount(ethereumAddress));
    const gasPrice = Number(await web3.eth.getGasPrice());
    const response = await axios.post(
      "http://localhost:3004/api/signTransaction",
      { data, label, ethereumAddress, nonce, gasPrice }
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
app.post("/api/tx/generator/mint", async (req, res) => {
  try {
    const { assetId, toAddress, amount, label, ethereumAddress } = req.body;
    const data = (
      contract.methods.mint as (...args: any[]) => { encodeABI: () => string }
    )(assetId, toAddress, amount).encodeABI();
    const nonce = Number(await web3.eth.getTransactionCount(ethereumAddress));
    const gasPrice = Number(await web3.eth.getGasPrice());

    const response = await axios.post(
      "http://localhost:3004/api/signTransaction",
      { data, label, ethereumAddress, nonce, gasPrice }
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

app.post("/api/tx/generator/signTransaction", async (req, res) => {
  try {
    const { assetId, label, ethereumAddress } = req.body;
    const data = (
      contract.methods.signTransaction as (...args: any[]) => {
        encodeABI: () => string;
      }
    )(assetId).encodeABI();
    const nonce = Number(await web3.eth.getTransactionCount(ethereumAddress));
    const gasPrice = Number(await web3.eth.getGasPrice());

    const response = await axios.post(
      "http://localhost:3004/api/signTransaction",
      { data, label, ethereumAddress, nonce, gasPrice }
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

app.post("/api/tx/generator/whitelist", async (req, res) => {
  try {
    const { assetId, addressToWhitelist, label, ethereumAddress } = req.body;
    const data = (
      contract.methods.whitelist as (...args: any[]) => {
        encodeABI: () => string;
      }
    )(assetId, addressToWhitelist).encodeABI();
    const nonce = Number(await web3.eth.getTransactionCount(ethereumAddress));
    const gasPrice = Number(await web3.eth.getGasPrice());

    const response = await axios.post(
      "http://localhost:3004/api/signTransaction",
      { data, label, ethereumAddress, nonce, gasPrice }
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

app.post("/api/tx/generator/transfer", async (req, res) => {
  try {
    const { assetId, toAddress, amount, label, ethereumAddress } = req.body;
    const data = (
      contract.methods.transfer as (...args: any[]) => {
        encodeABI: () => string;
      }
    )(assetId, toAddress, amount).encodeABI();
    const nonce = Number(await web3.eth.getTransactionCount(ethereumAddress));
    const gasPrice = Number(await web3.eth.getGasPrice());
    const response = await axios.post(
      "http://localhost:3004/api/signTransaction",
      { data, label, ethereumAddress, nonce, gasPrice }
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

app.post("/api/tx/submit", async (req, res) => {
  const rawTx = req.body.rawtx;

  // Transaction ready for submission
  try {
    const txHash = await web3.eth.sendSignedTransaction("0x" + rawTx);
    const transactionHash = txHash.transactionHash;
    res.json({ transactionHash });
  } catch (error) {
    console.error("Transaction error:", error);
    res.status(500).json({
      error: "Transaction error",
      details: error.message,
      reason: error.reason || undefined,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`First server listening at http://localhost:${PORT}`);
});
