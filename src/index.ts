import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Web3 } from "web3";
import compression from "compression";
const graphene = require("graphene-pk11");
import EthereumTx from "ethereumjs-tx";
import BigNumber from "bignumber.js";
const util = require("ethereumjs-util");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("./public"));

app.use(compression());

// HSM Module Config
const Module = graphene.Module;
var lib = "C:/SoftHSM2/lib/softhsm2-x64.dll"; //windows
const mod = Module.load(lib, "SoftHSM");
mod.initialize();

let slot = null;
let session = null;
// let activeSession = null;
app.post("/api/login", (req, res) => {
  try {
    const { slotNumber, password } = req.body;
    if (session) {
      session.logout();
    }

    // Load the specified slot
    slot = mod.getSlots(slotNumber);
    session = slot.open(
      graphene.SessionFlag.RW_SESSION | graphene.SessionFlag.SERIAL_SESSION
    );

    // Log in with the provided password
    session.login(password);

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: "Login error", details: error.message });
  }
});
app.post("/api/logout", async (req, res) => {
  try {
    // Log out from the active session
    if (session) {
      await session.logout();
      session = null;
    }

    res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout error", details: error.message });
  }
});

// Get keys list
app.get("/api/keys/all", (req, res) => {
  const EtherAddress = [];
  if (slot.flags & graphene.SlotFlag.TOKEN_PRESENT) {
    const keys = session.find({ class: graphene.ObjectClass.PUBLIC_KEY });
    for (let i = 0; i < keys.length; i++) {
      try {
        const puplicKey = decodeECPointToPublicKey(
          keys.items(i).getAttribute({ pointEC: null }).pointEC
        );
        let pkstr = keys
          .items(i)
          .getAttribute({ keyGenMechanism: null }).keyGenMechanism;
        const address = util.keccak256(puplicKey); // keccak256 hash of publicKey
        const buf2 = address;
        const EthAddr = "0x" + buf2.slice(-20).toString("hex"); // take lat 20 bytes as ethereum adress
        const label = keys.items(i).getAttribute({ label: null }).label;
        EtherAddress.push({ EthAddr, pkstr, label });
      } catch (e) {
        console.log(e);
      }
    }
    res.json(EtherAddress);
  }
});

app.post("/api/keys/generate", (req, res) => {
  const keylabel = req.body.label;
  const ID = () => {
    return Math.random().toString(36).substr(2, 9);
  };
  // generate ECDSA key pair
  const gkeys = session.generateKeyPair(
    graphene.KeyGenMechanism.ECDSA,
    {
      label: keylabel,
      id: Buffer.from([ID]), // uniquer id for keys in storage https://www.cryptsoft.com/pkcs11doc/v230/group__SEC__9__7__KEY__OBJECTS.html
      keyType: graphene.KeyType.ECDSA,
      token: true,
      verify: true,
      paramsECDSA: graphene.NamedCurve.getByName("secp256k1").value,
    },
    {
      keyType: graphene.KeyType.ECDSA,
      label: keylabel,
      id: Buffer.from([ID]), // uniquer id for keys in storage https://www.cryptsoft.com/pkcs11doc/v230/group__SEC__9__7__KEY__OBJECTS.html
      token: true,
      sign: true,
    }
  );
  let puplicKey = decodeECPointToPublicKey(
    gkeys.publicKey.getAttribute({ pointEC: null }).pointEC
  );
  const address = util.keccak256(puplicKey); // keccak256 hash of publicKey
  const buf2 = Buffer.from(address, "hex");
  const EthAddr = "0x" + buf2.slice(-20).toString("hex"); // take lat 20 bytes as ethereum adress
  let pkstr = puplicKey.toString("hex");
  res.json({ EthAddr });
});

app.post("/api/signTransaction", async (req, res) => {
  const EthAddr = req.body.ethereumAddress;
  const data = req.body.data;
  const label = req.body.label;
  const nonce = req.body.nonce;
  const gasPrice = req.body.gasPrice;
  const to = req.body.to;
  console.log(to);
  let Pkeys;
  //Get the Private key
  const allPkeys = session.find({ class: graphene.ObjectClass.PRIVATE_KEY });
  for (let i = 0; i < allPkeys.length; i++) {
    if (allPkeys.items(i).getAttribute({ label: null }).label == label) {
      Pkeys = allPkeys.items(i);
      break;
    }
  }

  //First sign : sign the ethreum address of the sender
  const encoded_msg = EthAddr;
  const msgHash = util.keccak(Buffer.from(encoded_msg)); // msg to be signed is the generated ethereum address
  const addressSign = calculateEthereumSig(msgHash, EthAddr, Pkeys);

  //using the r,s,v value from the first signautre in the transaction parameter
  const txParams = {
    nonce: Web3.utils.toHex(nonce),
    gasPrice: Web3.utils.toHex(gasPrice),
    gasLimit: 4000000,
    to: to,
    value: 0,
    data: data,
    r: addressSign.r, // using r from the first signature
    s: addressSign.s, // using s from the first signature
    v: addressSign.v,
  };

  const tx = new EthereumTx(txParams);
  const txHash = tx.hash(false);

  //Second sign: sign the raw transactions
  const txSig = calculateEthereumSig(txHash, EthAddr, Pkeys);
  tx.r = txSig.r;
  tx.s = txSig.s;
  tx.v = txSig.v;

  const serializedTx = tx.serialize().toString("hex");
  res.json(serializedTx);
});

const decodeECPointToPublicKey = (data) => {
  if (data.length === 0 || data[0] !== 4) {
    throw new Error("Only uncompressed point format supported");
  }
  // Accoring to ASN encoded value, the first 3 bytes are
  //04 - OCTET STRING
  //41 - Length 65 bytes
  //For secp256k1 curve it's always 044104 at the beginning
  return data.slice(3, 67);
};

const calculateEthereumSig = (msgHash, EthreAddr, privateKey) => {
  let flag = true;
  let tempsig;
  const secp256k1N = new BigNumber(
    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
    16
  );
  const secp256k1halfN = secp256k1N.dividedBy(new BigNumber(2));
  while (flag) {
    const sign = session.createSign("ECDSA", privateKey);
    tempsig = sign.once(msgHash);
    const ss = tempsig.slice(32, 64);
    const s_value = new BigNumber(ss.toString("hex"), 16);

    if (s_value.isLessThan(secp256k1halfN)) flag = false;
  }

  const rs = {
    r: tempsig.slice(0, 32),
    s: tempsig.slice(32, 64),
  };
  let v = 27;
  let pubKey = util.ecrecover(util.toBuffer(msgHash), v, rs.r, rs.s);
  let addrBuf = util.pubToAddress(pubKey);
  let RecoveredEthAddr = util.bufferToHex(addrBuf);
  let b = 160037;

  if (EthreAddr != RecoveredEthAddr) {
    v = 28;
    b = 160038;
    pubKey = util.ecrecover(util.toBuffer(msgHash), v, rs.r, rs.s);
    addrBuf = util.pubToAddress(pubKey);
    RecoveredEthAddr = util.bufferToHex(addrBuf);
  }
  return {
    r: rs.r,
    s: rs.s,
    v: b,
  };
};

//------------------------------------------------------------------------
app.listen(3004, () =>
  console.log("Web app listening at http://localhost:3004")
);
