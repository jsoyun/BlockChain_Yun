//암호화

const fs = require("fs");
//타원곡선개념을 사용한 다지털 터널 알고리즘을 짤거임
// 타원 곡선 디지털 서명 알고리즘
const ecdsa = require("elliptic");
// const { generateKey } = require("crypto");
const transaction_1 = require("./r_transaction");
const ec = new ecdsa.ec("secp256k1");

const privateKeyLocation =
  "node1/wallet/" + (process.env.PRIVATE_KEY || "default");
const privateKeyFile = privateKeyLocation + "/private_key";

//비밀키(인증서) 출력하는 함수
function getPrivateKeyFromWallet() {
  //지갑에 만들어놓은 걸 읽을 수 있게 해줌
  const buffer = fs.readFileSync(privateKeyFile, "utf8");
  return buffer.toString();
}

//공개키 (지갑주소) 만들기
function getPublicKeyFromWallet() {
  const privateKey = getPrivateKeyFromWallet();
  const key = ec.keyFromPrivate(privateKey, "hex");
  return key.getPublic().encode("hex");
}

//비밀키 생성
function generatePrivatekey() {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate();
  //16진수로 만들어서 리턴
  return privateKey.toString(16);
}

function initWallet() {
  if (fs.existsSync(privateKeyFile)) {
    console.log("기존지갑 private key 경로 :" + privateKeyFile);
    return;
  }
  if (!fs.existsSync("node1/wallet/")) {
    fs.mkdirSync("node1/wallet/");
  }
  if (!fs.existsSync(privateKeyLocation)) {
    fs.mkdirSync(privateKeyLocation);
  }
  if (!fs.existsSync(privateKeyFile)) {
    console.log("주소값 키값을 생성중");
    const newPrivatekey = generatePrivatekey();
    fs.writeFileSync(privateKeyFile, newPrivatekey);
    console.log("개인키 생성이 완료됐습니다");
  }
  const newPrivatekey = generatePrivatekey();
  fs.writeFileSync(privateKeyFile, newPrivatekey);
  console.log("새로운 지갑 생성 private key 경로 :" + privateKeyFile);
}

//잔고보여주는 함수
const getBalance = (address, unspentTxOuts) => {
  return _(unspentTxOuts)
    .filter((uTxO) => uTxO.address === address)
    .map((uTxO) => uTxO.amount)
    .sum();
};

//트랜잭션아웃풋들로 남은 금액양들 찾기
const findTxOutsForAmount = (amount, myUnspentTxOuts) => {
  let currentAmount = 0;
  const includedUnspentTxOuts = [];

  for (const myUnspentTxOut of myUnspentTxOuts) {
    includedUnspentTxOuts.push(myUnspentTxOut);
    currentAmount = currentAmount + myUnspentTxOut.amount;
    if (currentAmount >= amount) {
      const leftOverAmount = currentAmount - amount;
      return { includedUnspentTxOuts, leftOverAmount };
    }
  }
  throw Error("not enough coins to send transaction");
};

//트랜잭션 아웃풋 만드는 함수
const createTxOuts = (receiverAddress, myAddress, amount, leftOverAmount) => {
  const txOut1 = new transaction_1.TxOut(receiverAddress, amount);
  if (leftOverAmount === 0) {
    return [txOut1];
  } else {
    const leftOverTx = new transaction_1.TxOut(myAddress, leftOverAmount);
    return [txOut1, leftOverTx];
  }
};
//트랜잭션 만드는 함수
const createTransaction = (
  receiverAddress,
  amount,
  privateKey,
  unspentTxOuts
) => {
  const myAddress = transaction_1.getPublicKey(privateKey);
  const myUnspentTxOuts = unspentTxOuts.filter(
    (uTxO) => uTxO.address === myAddress
  );
  const { includedUnspentTxOuts, leftOverAmount } = findTxOutsForAmount(
    amount,
    myUnspentTxOuts
  );
  const toUnsignedTxIn = (unspentTxOut) => {
    const txIn = new transaction_1.TxIn();
    txIn.txOutId = unspentTxOut.txOutId;
    txIn.txOutIndex = unspentTxOut.txOutIndex;
    return txIn;
  };
  const unsignedTxIns = includedUnspentTxOuts.map(toUnsignedTxIn);
  const tx = new transaction_1.Transaction();
  tx.txIns = unsignedTxIns;
  tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);
  tx.id = transaction_1.getTransactionId(tx);
  tx.txIns = tx.txIns.map((txIn, index) => {
    txIn.signature = transaction_1.signTxIn(
      tx,
      index,
      privateKey,
      unspentTxOuts
    );
  });
  return tx;
};

module.exports = {
  getPrivateKeyFromWallet,
  getPublicKeyFromWallet,
  generatePrivatekey,
  initWallet,
  getBalance,
  createTransaction,
};
