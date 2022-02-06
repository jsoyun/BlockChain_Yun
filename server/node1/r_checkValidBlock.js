//블록구조 유효한지
//현재 블록의 인덱스가 이전 블록의 인덱스보다 1만큼 큰지
//이전블록의 해시값과 현재 블록의 이전해시가 같은지
//데이터 필드로부터 계산한 머클루트와 블록헤더의 머클루트가 동일한지
//이 조건 다 맞으면 올바른 구조체이다
// const {
//   // Blocks,
//   // getLastBlock,
//   // createHash,
//   // nextBlock,
//   // isValidTimestamp,
// } = require("./r_blockchain");
// const { Blockchain } = require("../models");
// const merkle = require("merkle");
// const transaction_1 = require("./r_transaction");
// // const { processTransactions } = require("./r_transaction");

// //유효한 블록구조인지 검사하는 함수
// const isValidBlockStructure = (block) => {
//   return (
//     typeof block.index === "number" &&
//     typeof block.hash === "string" &&
//     typeof block.previousHash === "string" &&
//     typeof block.timestamp === "number" &&
//     typeof block.data === "object"
//   );
// };
// // //다음블록이 유효한지 보는 함수
// // function isValidNewBlock(newBlock, prevBlock) {
// //   const { createHash, isValidTimestamp } = require("./r_blockchain");
// //   if (!isValidBlockStructure(newBlock)) {
// //     console.log("Invalid Block Structure");
// //     console.log(newBlock);
// //     return false;
// //   }
// //   //현재 블록 이전블록 비교
// //   else if (newBlock.header.index !== prevBlock.header.index + 1) {
// //     console.log("Invalid Index");
// //     return false;
// //   }
// //   //이전블록의 해시값과 현재 블록의 해시
// //   else if (createHash(prevBlock) !== newBlock.header.previousHash) {
// //     console.log("Invalid previousHash");
// //     return false;
// //   } else if (
// //     (newBlock.body.length === 0 &&
// //       "0".repeat(64) !== newBlock.header.merkleRoot) ||
// //     (newBlock.body.length !== 0 &&
// //       merkle("sha256").sync(newBlock.body).root() !==
// //         newBlock.header.merkleRoot)
// //   ) {
// //     console.log("Invalid merkleRoot");
// //     return false;
// //   } else if (!isValidTimestamp(newBlock, prevBlock)) {
// //     console.log("시간안됨요");
// //     return false;
// //   }
// //   return true;
// // }
// const isValidNewBlock = (newBlock, previousBlock) => {
//   if (!isValidBlockStructure(newBlock)) {
//     console.log("invalid block structure");
//     console.log(newBlock);
//     return false;
//   }
//   if (previousBlock.index + 1 !== newBlock.index) {
//     console.log("invalid index");
//     return false;
//   } else if (previousBlock.hash !== newBlock.previousHash) {
//     console.log("invalid previoushash");
//     return false;
//   } else if (!isValidTimestamp(newBlock, previousBlock)) {
//     console.log("invalid timestamp");
//     return false;
//   } else if (!hasValidHash(newBlock)) {
//     return false;
//   }
//   return true;
// };

// //유효한 타임스탬프인지 보는 함수
// const isValidTimestamp = (newBlock, previousBlock) => {
//   return (
//     previousBlock.timestamp - 60 < newBlock.timestamp &&
//     newBlock.timestamp - 60 < getCurrentTimestamp()
//   );
// };

// const hasValidHash = (block) => {
//   if (!hashMatchesBlockContent(block)) {
//     console.log("invalid hash, got:" + block.hash);
//     return false;
//   }
//   if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
//     console.log(
//       "block difficulty not satisfied. Expected: " +
//         block.difficulty +
//         "got: " +
//         block.hash
//     );
//   }
//   return true;
// };

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

// //유효한 체인인지 검증하는 함수
// function isValidChain(newBlocks) {
//   const { Blocks } = require("./r_blockchain");
//   //제네시스블록부터 확인,0번이 제네시스블록임
//   if (JSON.stringify(newBlocks[0]) !== JSON.stringify(Blocks[0])) {
//     console.log("새로받은 블록체인이랑 내 블록체인의 제네시스 블록이 달라요");
//     return false;
//   }
//   var tempBlocks = [newBlocks[0]];
//   for (var i = 1; i < newBlocks.length; i++) {
//     if (isValidNewBlock(newBlocks[i], tempBlocks[i - 1])) {
//       tempBlocks.push(newBlocks[i]);
//     } else {
//       return false;
//     }
//   }
//   return true;
// }
// const block = nextBlock(["new Tr"]);
// const chain = isValidChain(block);
// console.log(chain);

//기존 addBlock
// function addBlock(newBlock) {
//   const { getLastBlock } = require("./r_blockchain");
//   if (isValidNewBlock(newBlock, getLastBlock())) {
//     const { Blocks } = require("./r_blockchain");
//     Blocks.push(newBlock);
//     Blockchain.create({ Blockchain: newBlock });

//     return true;
//   }
//   return false;
// }

// let unspentTxOuts = [];
//addBlock했을때 보상거래내역 들어오게,addBlockToChain임.
// function addBlock(newBlock) {
//   const { getLastBlock } = require("./r_blockchain");
//   if (isValidNewBlock(newBlock, getLastBlock())) {
//     const retVal = transaction_1.processTransactions(
//       newBlock.data,
//       unspentTxOuts,
//       newBlock.index
//     );
//     if (retVal === null) {
//       return false;
//     } else {
//       const { Blocks } = require("./r_blockchain");
//       Blocks.push(newBlock);
//       Blockchain.create({ Blockchain: newBlock });
//       unspentTxOuts = retVal;

//       return true;
//     }
//   }
//   return false;
// }

// //블럭만들기
// const block = nextBlock(['new Transaction'])
// addBlock(block)

module.exports = {
  addBlock,
  isValidChain,
  isValidBlockStructure,
};
