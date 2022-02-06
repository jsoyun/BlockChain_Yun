// 블록의 생성 검증  합의 알고리즘 포함 / (프로토콜을 변경하려면 여기서 수정?)
//createGenesisBlock() getBlocks() getLastBlock() createHash() calculateHash()
//nextBlock(bodyData)  addBlock(bodyData)

const fs = require("fs");
const merkle = require("merkle");
const cryptojs = require("crypto-js"); //암호화
// const { isValidChain, addBlock } = require("./r_checkValidBlock");
// const { importBlockDB } = require("./r_util");
const { Blockchain } = require("../models");
const P2PServer = require("./r_P2PServer");
const transaction_1 = require("./r_transaction");
const wallet_1 = require("./r_encryption");

//예상 채굴시간을 변수로 설정한다
const BLOCK_GENERATION_INTERVAL = 10; //second
//난이도 조절 단위수를 변수로 설정한다
const DIFFICULT_ADJUSTMENT_INTERVAL = 10; //in blocks

//블록구조 헤더와 바디
// class Block {
//   constructor(header, body) {
//     this.header = header;
//     this.body = body;
//   }
// }
// //헤더구조
// class BlockHeader {
//   constructor(
//     version,
//     index,
//     previousHash,
//     timestamp,
//     merkleRoot,
//     // bit,
//     difficulty,
//     nonce
//   ) {
//     this.version = version;
//     this.index = index;
//     this.previousHash = previousHash;
//     this.timestamp = timestamp;
//     this.merkleRoot = merkleRoot;
//     // this.bit = bit;
//     this.difficulty = difficulty; //채굴난이도. 아직안씀
//     this.nonce = nonce;
//   }
// }

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

let unspentTxOuts = [];

//버전 계산하는 함수
function getVersion() {
  const package = fs.readFileSync("package.json");
  console.log(JSON.parse(package).version);
  return JSON.parse(package).version;
}

//제네시스 블록
const genesisBlock = new Block(
  0,
  "91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627",
  "",
  1465154705,
  [],
  0,
  0
);

// function createGenesisBlock() {
//   const version = getVersion();
//   //맨처음 인덱스
//   const index = 0;
//   const previousHash = "0".repeat(64);
//   // const timestamp = parseInt(Date.now() / 1000);
//   //최초 비트코인최초탄생일
//   const timestamp = 1231006505;
//   const body = ["윤민팀 제네시스바디"];
//   const tree = merkle("sha256").sync(body);
//   const merkleRoot = tree.root() || "0".repeat(64);
//   // const bit = 0;

//   //난이도 추가
//   const difficulty = 2;

//   const nonce = 10;

//   //헤더에 대입
//   const header = new BlockHeader(
//     version,
//     index,
//     previousHash,
//     timestamp,
//     merkleRoot,
//     // bit,
//     difficulty,
//     nonce
//   );
//   return new Block(header, body);
// }

//블록 여러개 저장할 수 있는 배열을 만들어줌
let Blocks = [genesisBlock];

// console.log(Blocks);

//현재 있는 블록들 다 가져오는 함수
function getBlocks() {
  //db를 띄우게 해보자고 넣어본 함수인데
  //콘솔로 정보들어오는것만확인함
  // const GET_BLOCK = importBlockDB();
  // console.log("겟", GET_BLOCK);
  return Blocks;
}

//제일 마지막에 만든 블록가져오는 함수
function getLastBlock() {
  return Blocks[Blocks.length - 1];
}

function getDifficulty(blocks) {
  //마지막 블럭
  const lastBlock = blocks[blocks.length - 1];
  //마지막 블럭헤더인덱스가 0이 아니고 난이도조절수만큼 나눈 나머지가 0이면
  if (
    lastBlock.index !== 0 &&
    lastBlock.index % DIFFICULT_ADJUSTMENT_INTERVAL === 0
  ) {
    //난이도 조절함수 실행
    return getAdjustDifficulty(lastBlock, blocks);
  }
  //난이도 리턴
  return lastBlock.difficulty;
}

//난이도 조절함수
function getAdjustDifficulty(lastBlock, blocks) {
  //이전조절블록 = [블록길이-10]의 블록
  const preAdjustmentBlock =
    blocks[blocks.length - DIFFICULT_ADJUSTMENT_INTERVAL];
  //예상시간 = 예상채굴시간(10초) * 난이도조절단위수(블록 10.. 인덱스라고 걍 이해함.)
  const timeExpected =
    BLOCK_GENERATION_INTERVAL * DIFFICULT_ADJUSTMENT_INTERVAL;
  //경과시간(생성되는데 걸린 시간) = 마지막블록의 헤더가 생성된 시간 - [블록길이-10]의 블록의 생성시간
  const timeTaken = lastBlock.timestamp - preAdjustmentBlock.timestamp;
  //생성시간 /2는 우리가 임의로 넣어두는 알고리즘 임
  if (timeExpected / 2 > timeTaken) {
    return preAdjustmentBlock.difficulty - 1;
  } else if (timeTaken > timeExpected * 2) {
    return preAdjustmentBlock.difficulty + 1;
  } else {
    return preAdjustmentBlock.difficulty;
  }
}

//현재 타임스템프 찍어주는 함수
function getCurrentTimestamp() {
  //Math.round 반올림함수
  return Math.round(new Date().getTime() / 1000);
}

// 날것의 다음 블록 생성하는 함수
const generateRawNextBlock = (blockData) => {
  const previousBlock = getLastBlock();
  console.log("확인", previousBlock);

  const difficulty = getDifficulty(getBlocks());
  console.log("디피컬트", difficulty);
  const nextIndex = previousBlock.index + 1;
  const nextTimestamp = getCurrentTimestamp();
  const newBlock = findBlock(
    nextIndex,
    previousBlock.hash,
    nextTimestamp,
    blockData,
    difficulty
  );
  if (addBlock(newBlock)) {
    P2PServer.broadcast();
    return newBlock;
  } else {
    return null;
  }
};
//다음블록 생성하는 함수
const generateNextBlock = () => {
  const coinbaseTx = transaction_1.getCoinbaseTransaction(
    wallet_1.getPublicKeyFromWallet(),
    getLastBlock().index + 1
  );
  const blockData = [coinbaseTx];
  return generateRawNextBlock(blockData);
};

//트랜잭션과 함께 다음블록생성하는 함수
const generatenextBlockWithTransaction = (receiverAddress, amount) => {
  if (!transaction_1.isValidAddress(receiverAddress)) {
    throw Error("invalid address 유효하지 않은 주소");
  }
  if (typeof amount !== "number") {
    throw Error("invalid amount");
  }
  const coinbaseTx = transaction_1.getCoinbaseTransaction(
    wallet_1.getPublicKeyFromWallet(),
    getLastBlock().index + 1
  );
  const tx = wallet_1.createTransaction(
    receiverAddress,
    amount,
    wallet_1.getPublicKeyFromWallet(),
    unspentTxOuts
  );
  const blockDate = [coinbaseTx, tx];
  return generateRawNextBlock(blockDate);
};

function findBlock(index, previousHash, timestamp, data, difficulty) {
  //
  let nonce = 0;
  while (true) {
    var hash = calculateHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
      nonce
    );
    // console.log(hash);
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(
        index,
        hash,
        previousHash,
        timestamp,
        data,
        difficulty,
        nonce
      );
    }

    nonce++;
  }
}

//잔고세는 함수
const getAccountBalance = () => {
  return wallet_1.getBalance(wallet_1.getPrivateKeyFromWallet(), unspentTxOuts);
};

const calculateHashForBlock = (block) =>
  calculateHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
    block.difficulty,
    block.nonce
  );
//해시 계산 함수(nonce추가해서 hash만듦)
const calculateHash = (
  index,
  previousHash,
  timestamp,
  data,
  // bit,
  difficulty,
  nonce
) => {
  cryptojs
    .SHA256(index + previousHash + timestamp + data + difficulty + nonce)
    .toString();
};

//유효한 블록구조인지 검사하는 함수
const isValidBlockStructure = (block) => {
  return (
    typeof block.index === "number" &&
    typeof block.hash === "string" &&
    typeof block.previousHash === "string" &&
    typeof block.timestamp === "number" &&
    typeof block.data === "object"
  );
};
// //다음블록이 유효한지 보는 함수
// function isValidNewBlock(newBlock, prevBlock) {
//   const { createHash, isValidTimestamp } = require("./r_blockchain");
//   if (!isValidBlockStructure(newBlock)) {
//     console.log("Invalid Block Structure");
//     console.log(newBlock);
//     return false;
//   }
//   //현재 블록 이전블록 비교
//   else if (newBlock.header.index !== prevBlock.header.index + 1) {
//     console.log("Invalid Index");
//     return false;
//   }
//   //이전블록의 해시값과 현재 블록의 해시
//   else if (createHash(prevBlock) !== newBlock.header.previousHash) {
//     console.log("Invalid previousHash");
//     return false;
//   } else if (
//     (newBlock.body.length === 0 &&
//       "0".repeat(64) !== newBlock.header.merkleRoot) ||
//     (newBlock.body.length !== 0 &&
//       merkle("sha256").sync(newBlock.body).root() !==
//         newBlock.header.merkleRoot)
//   ) {
//     console.log("Invalid merkleRoot");
//     return false;
//   } else if (!isValidTimestamp(newBlock, prevBlock)) {
//     console.log("시간안됨요");
//     return false;
//   }
//   return true;
// }
const isValidNewBlock = (newBlock, previousBlock) => {
  if (!isValidBlockStructure(newBlock)) {
    console.log("invalid block structure");
    console.log(newBlock);
    return false;
  }
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log("invalid index");
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log("invalid previoushash");
    return false;
  } else if (!isValidTimestamp(newBlock, previousBlock)) {
    console.log("invalid timestamp");
    return false;
  } else if (!hasValidHash(newBlock)) {
    return false;
  }
  return true;
};

//누적된 난이도를 가져오는 함수,,쓰나..?
const getAccumulatedDifficulty = (aBlockchain) => {
  return aBlockchain
    .map((block) => block.difficulty)
    .map((difficulty) => Math.pow(2, difficulty))
    .reduce((a, b) => a + b);
};

//유효한 타임스탬프인지 보는 함수
const isValidTimestamp = (newBlock, previousBlock) => {
  return (
    previousBlock.timestamp - 60 < newBlock.timestamp &&
    newBlock.timestamp - 60 < getCurrentTimestamp()
  );
};

const hasValidHash = (block) => {
  if (!hashMatchesBlockContent(block)) {
    console.log("invalid hash, got:" + block.hash);
    return false;
  }
  if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
    console.log(
      "block difficulty not satisfied. Expected: " +
        block.difficulty +
        "got: " +
        block.hash
    );
  }
  return true;
};

const hashMatchesBlockContent = (block) => {
  const blockHash = calculateHashForBlock(block);
  return blockHash === block.hash;
};
function hashMatchesDifficulty(hash, difficulty) {
  //difficulty 난이도가 높아짐에 따라 0개수가 늘어남
  const requirePrefix = "0".repeat(difficulty);
  //높으면 높을수록 조건을 맞츠기가 까다로워짐
  return hash.startsWith(requirePrefix);
}

//얘는 그냥 냅둠
//유효한 체인인지 검증하는 함수
function isValidChain(newBlocks) {
  //제네시스블록부터 확인,0번이 제네시스블록임
  if (JSON.stringify(newBlocks[0]) !== JSON.stringify(Blocks[0])) {
    console.log("새로받은 블록체인이랑 내 블록체인의 제네시스 블록이 달라요");
    return false;
  }
  var tempBlocks = [newBlocks[0]];
  for (var i = 1; i < newBlocks.length; i++) {
    if (isValidNewBlock(newBlocks[i], tempBlocks[i - 1])) {
      tempBlocks.push(newBlocks[i]);
    } else {
      return false;
    }
  }
  return true;
}

function addBlock(newBlock) {
  if (isValidNewBlock(newBlock, getLastBlock())) {
    const retVal = transaction_1.processTransactions(
      newBlock.data,
      unspentTxOuts,
      newBlock.index
    );
    if (retVal === null) {
      return false;
    } else {
      const { Blocks } = require("./r_blockchain");
      Blocks.push(newBlock);
      Blockchain.create({ Blockchain: newBlock });
      unspentTxOuts = retVal;

      return true;
    }
  }
  return false;
}

//누적난이도함수 추가해본 버전
async function replaceChain(newBlocks) {
  if (
    isValidChain(newBlocks) &&
    //이거 추가해봄
    getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlocks())
  ) {
    if (
      newBlocks.length > Blocks.length ||
      (newBlocks.length === Blocks.length && random.boolean())
    ) {
      Blocks = newBlocks;
      P2PServer.broadcast(P2PServer.responseLatestMsg());

      // 새로 받은 블록체인으로 교체하기 위해 DB를 먼저 비워줌
      Blockchain.destroy({ where: {}, truncate: true });
      // 받은 블록체인을 제네시스 블록부터 순서대로 집어넣어줌
      for (let i = 0; i < newBlocks.length; i++) {
        await Blockchain.create({ Blockchain: newBlocks[i] });
      }
    }
  } else {
    console.log("받은 원장에 문제가 있음");
  }
}
//data에는 블록이 들어오는 거고 이 블록을 가지고
//해시값만드는 함수
function createHash(data) {
  //인자로 받은 것중에 헤더를 뽑아내서
  const {
    version,
    index,
    previousHash,
    timestamp,
    merkleRoot,
    // bit,
    difficulty,
    nonce,
  } = data.header;
  const blockString =
    version +
    index +
    previousHash +
    timestamp +
    merkleRoot +
    // bit +
    difficulty +
    nonce;
  //다합쳐서 해시로 만들고 리턴
  const hash = cryptojs.SHA256(blockString).toString();
  return hash;
}

// //다음블록 만들었을 때 기존 블록 정보 가져와
// function nextBlock(bodyData) {
//   //마지막 블록
//   const prevBlock = getLastBlock();
//   const version = getVersion();
//   //넥스트블록의 인덱스는 이전블록 헤더인덱스+1
//   const index = prevBlock.header.index + 1;
//   //이전 블록의 해시값
//   const previousHash = createHash(prevBlock);
//   const timestamp = parseInt(Date.now() / 1000);
//   const tree = merkle("sha256").sync(bodyData);
//   const merkleRoot = tree.root() || "0".repeat(64);
//   //난이도 조절함수 추가 //utils에 getDifficulty 함수 있음요
//   const difficulty = getDifficulty(getBlocks());

//   // console.log("나니도", difficulty);
//   const header = findBlock(
//     version,
//     index,
//     previousHash,
//     timestamp,
//     merkleRoot,
//     difficulty
//   );
//   // console.log("넥스트", header);
//   return new Block(header, bodyData);
// }

//블록 추가하는 함수
//넣는 인자 bodyData에서 newBlock으로 바꿈요
// function addBlock(newBlock) {
//   // const newBlock = nextBlock(bodyData);
//   // console.log("블록스찍히나", Blocks);
//   Blocks.push(newBlock);
//   Blockchain.create({ Blockchain: newBlock });
// }

//원래 기존 replaceChain함수
// async function replaceChain(newBlocks) {
//   if (isValidChain(newBlocks)) {
//     if (
//       newBlocks.length > Blocks.length ||
//       (newBlocks.length === Blocks.length && random.boolean())
//     ) {
//       Blocks = newBlocks;
//       P2PServer.broadcast(P2PServer.responseLatestMsg());

//       // 새로 받은 블록체인으로 교체하기 위해 DB를 먼저 비워줌
//       Blockchain.destroy({ where: {}, truncate: true });
//       // 받은 블록체인을 제네시스 블록부터 순서대로 집어넣어줌
//       for (let i = 0; i < newBlocks.length; i++) {
//         await Blockchain.create({ Blockchain: newBlocks[i] });
//       }
//     }
//   } else {
//     console.log("받은 원장에 문제가 있음");
//   }
// }

// //누적난이도함수 추가해본 버전
// async function replaceChain(newBlocks) {
//   if (
//     isValidChain(newBlocks) &&
//     //이거 추가해봄
//     getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlocks())
//   ) {
//     if (
//       newBlocks.length > Blocks.length ||
//       (newBlocks.length === Blocks.length && random.boolean())
//     ) {
//       Blocks = newBlocks;
//       P2PServer.broadcast(P2PServer.responseLatestMsg());

//       // 새로 받은 블록체인으로 교체하기 위해 DB를 먼저 비워줌
//       Blockchain.destroy({ where: {}, truncate: true });
//       // 받은 블록체인을 제네시스 블록부터 순서대로 집어넣어줌
//       for (let i = 0; i < newBlocks.length; i++) {
//         await Blockchain.create({ Blockchain: newBlocks[i] });
//       }
//     }
//   } else {
//     console.log("받은 원장에 문제가 있음");
//   }
// }

function hexToBinary(s) {
  //헤더부분을 sha256 암호화한 결과
  //16진수 64자리를 2진수로 변환하기
  const lookupTable = {
    0: "0000",
    1: "0001",
    2: "0010",
    3: "0011",
    4: "0100",
    5: "0101",
    6: "0110",
    7: "0111",
    8: "1000",
    9: "1001",
    A: "1010",
    B: "1011",
    C: "1100",
    D: "1101",
    E: "1110",
    F: "1111",
  };

  let ret = "";
  for (let i = 0; i < s.length; i++) {
    if (lookupTable[s[i]]) {
      ret += lookupTable[s[i]];
    } else {
      return null;
    }
  }
  return ret;
}

// const hashMatchesBlockContent = (block) => {
//   const blockHash = calculateHashForBlock(block);
//   return blockHash === block.hash;
// };
// function hashMatchesDifficulty(hash, difficulty) {
//   //difficulty 난이도가 높아짐에 따라 0개수가 늘어남
//   const requirePrefix = "0".repeat(difficulty);
//   //높으면 높을수록 조건을 맞츠기가 까다로워짐
//   return hash.startsWith(requirePrefix);
// }

// //유효한 타임스탬프인지 보는 함수
// function isValidTimestamp(newBlock, prevBlock) {
//   // if (prevBlock.header.timestamp - 60 > newBlock.header.timestamp) {
//   //   return false;
//   // }
//   // //검증자의 시간과 새로운 블록의 시간과 비교! 검증자가 검증하는데
//   // //검증하는 시간이랑 만들어진 블록의 시간이 너무 차이가 나면 버림
//   // if (newBlock.header.timestamp - 60 > getCurrentTimestamp()) {
//   //   return false;
//   // }
//   // return true;

//   //naive코인처럼 하나로 묶어도 됨.
//   return (
//     prevBlock.header.timestamp - 60 < newBlock.header.timestamp &&
//     newBlock.header.timestamp - 60 < getCurrentTimestamp()
//   );
//   //두 조건다 통과되면 true 뱉어
// }

//블록체인 초기화하는 함수, 그니까 db넣고 하면서 조절하는 애임.
function blockchainInit(YM) {
  YM.forEach((blocks) => {
    // DB에 있는 제이슨 형식의 블록들을 객체형식으로 가져와서 bc배열에 푸시푸시
    Blocks.push(blocks.Blockchain);
  });

  if (Blocks.length === 0) {
    //0이면 제네시스없는거니깐 넣어주셈
    // Blockchain.create({ Blockchain: createGenesisBlock() });
    Blockchain.create({ Blockchain: genesisBlock });
    // Blocks.push(createGenesisBlock());
    Blocks.push(genesisBlock);
  }
}

module.exports = {
  hashMatchesDifficulty,
  isValidBlockStructure,
  isValidTimestamp,
  getBlocks,
  createHash,
  Blocks,
  getLastBlock,
  // nextBlock,
  addBlock,
  getVersion,
  // createGenesisBlock,
  replaceChain,
  // BlockHeader,
  Block,
  blockchainInit,
  generateRawNextBlock,
  generateNextBlock,
  generatenextBlockWithTransaction,
  getAccountBalance,
}; //내보내주는거
