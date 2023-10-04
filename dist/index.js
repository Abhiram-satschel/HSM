"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios")); // Import Axios for making HTTP requests
const Abi_json_1 = __importDefault(require("./Abi.json"));
const web3_1 = require("web3");
const web3 = new web3_1.Web3(new web3_1.Web3.providers.HttpProvider("https://polygon-mumbai.infura.io/v3/fa806ffb8afb4754a3fcd2ef247de5af"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = 3002;
const contract = new web3.eth.Contract(Abi_json_1.default);
// Your existing routes for the first server
app.post("/api/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestData = {
            slotNumber: req.body.slotNumber,
            password: req.body.password,
        };
        const response = yield axios_1.default.post("http://localhost:3003/api/login", requestData);
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/api/logout", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post("http://localhost:3003/api/logout");
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.get("/api/keys/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get("http://localhost:3003/api/keys/all");
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/api/keys/generate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestData = { keylabel: req.body.keylabel };
        const response = yield axios_1.default.post("http://localhost:3003/api/keys/generate", requestData);
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/api/tx/generator/createAsset", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, symbol, totalSupply, requiredSignatures, initialSigners, label, ethereumAddress, } = req.body;
        const data = contract.methods.createAsset(name, symbol, totalSupply, requiredSignatures, initialSigners).encodeABI();
        const nonce = Number(yield web3.eth.getTransactionCount(ethereumAddress));
        const gasPrice = Number(yield web3.eth.getGasPrice());
        const response = yield axios_1.default.post("http://localhost:3003/api/signTransaction", { data, label, ethereumAddress, nonce, gasPrice });
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "internal Server Error" });
    }
}));
app.post("/api/tx/generator/mint", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { assetId, toAddress, amount, label, ethereumAddress } = req.body;
        const data = contract.methods.mint(assetId, toAddress, amount).encodeABI();
        const nonce = Number(yield web3.eth.getTransactionCount(ethereumAddress));
        const gasPrice = Number(yield web3.eth.getGasPrice());
        const response = yield axios_1.default.post("http://localhost:3003/api/signTransaction", { data, label, ethereumAddress, nonce, gasPrice });
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "internal Server Error" });
    }
}));
app.post("/api/tx/generator/signTransaction", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { assetId, label, ethereumAddress } = req.body;
        const data = contract.methods.signTransaction(assetId).encodeABI();
        const nonce = Number(yield web3.eth.getTransactionCount(ethereumAddress));
        const gasPrice = Number(yield web3.eth.getGasPrice());
        const response = yield axios_1.default.post("http://localhost:3003/api/signTransaction", { data, label, ethereumAddress, nonce, gasPrice });
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "internal Server Error" });
    }
}));
app.post("/api/tx/generator/whitelist", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { assetId, addressToWhitelist, label, ethereumAddress } = req.body;
        const data = contract.methods.whitelist(assetId, addressToWhitelist).encodeABI();
        const nonce = Number(yield web3.eth.getTransactionCount(ethereumAddress));
        const gasPrice = Number(yield web3.eth.getGasPrice());
        const response = yield axios_1.default.post("http://localhost:3003/api/signTransaction", { data, label, ethereumAddress, nonce, gasPrice });
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "internal Server Error" });
    }
}));
app.post("/api/tx/generator/transfer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { assetId, toAddress, amount, label, ethereumAddress } = req.body;
        const data = contract.methods.transfer(assetId, toAddress, amount).encodeABI();
        const nonce = Number(yield web3.eth.getTransactionCount(ethereumAddress));
        const gasPrice = Number(yield web3.eth.getGasPrice());
        const response = yield axios_1.default.post("http://localhost:3003/api/signTransaction", { data, label, ethereumAddress, nonce, gasPrice });
        res.json(response.data);
    }
    catch (error) {
        console.error("Error in making request to the second server", error.message);
        res.status(500).json({ error: "internal Server Error" });
    }
}));
app.post("/api/tx/submit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rawTx = req.body.rawtx;
    // Transaction ready for submission
    try {
        const txHash = yield web3.eth.sendSignedTransaction("0x" + rawTx);
        const transactionHash = txHash.transactionHash;
        res.json({ transactionHash });
    }
    catch (error) {
        console.error("Transaction error:", error);
        res.status(500).json({
            error: "Transaction error",
            details: error.message,
            reason: error.reason || undefined,
        });
    }
}));
app.listen(PORT, () => {
    console.log(`First server listening at http://localhost:${PORT}`);
});
