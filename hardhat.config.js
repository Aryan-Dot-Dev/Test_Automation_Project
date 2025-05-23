require("@nomicfoundation/hardhat-toolbox")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 31337, // Standard Hardhat Network chain ID
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337, // Match the hardhat network chain ID
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
}
