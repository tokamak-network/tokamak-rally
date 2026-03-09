import { ethers } from 'ethers';

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111
const LEADERBOARD_ADDRESS = '0x3290A564E0602016F5DA40310BdaDdD471978306'; // Sepolia testnet

const LEADERBOARD_ABI = [
  "function submitRecord(uint256 _time, string calldata _carId, bytes32 _replayHash) external",
  "function setNickname(string calldata _nickname) external",
  "function getRecordCount() external view returns (uint256)",
  "function getRecord(uint256 idx) external view returns (tuple(address player, uint256 time, string carId, bytes32 replayHash, uint256 timestamp))",
  "function bestTime(address) external view returns (uint256)",
  "function bestRecordIndex(address) external view returns (uint256)",
  "function nicknames(address) external view returns (string)",
  "function getAllBestRecords(address[] calldata players) external view returns (tuple(address player, uint256 time, string carId, bytes32 replayHash, uint256 timestamp)[], string[])",
  "event RecordSubmitted(address indexed player, uint256 time, string carId, uint256 index)",
  "event NicknameSet(address indexed player, string nickname)",
];

const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

export class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.connected = false;
    this.contract = null;      // signer contract (write)
    this.readContract = null;   // read-only contract
    this.nickname = null;
    this._initReadContract();
  }

  _initReadContract() {
    if (LEADERBOARD_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      try {
        const readProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
        this.readContract = new ethers.Contract(LEADERBOARD_ADDRESS, LEADERBOARD_ABI, readProvider);
      } catch(e) { console.warn('Read contract init failed:', e); }
    }
  }

  isContractReady() {
    return LEADERBOARD_ADDRESS !== '0x0000000000000000000000000000000000000000' && (this.contract !== null || this.readContract !== null);
  }

  getReadContract() {
    return this.contract || this.readContract;
  }

  async connect() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    this.address = accounts[0];

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Testnet',
            rpcUrls: ['https://rpc.sepolia.org'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      }
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.connected = true;

    if (LEADERBOARD_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      this.contract = new ethers.Contract(LEADERBOARD_ADDRESS, LEADERBOARD_ABI, this.signer);
      try {
        this.nickname = await this.contract.nicknames(this.address);
      } catch (e) { /* ignore */ }
    }

    return this.address;
  }

  async submitRecord(timeMs, carId) {
    if (!this.contract) throw new Error('Contract not configured');
    const replayHash = ethers.keccak256(ethers.toUtf8Bytes(`${this.address}-${timeMs}-${carId}-${Date.now()}`));
    const tx = await this.contract.submitRecord(timeMs, carId, replayHash);
    await tx.wait();
    return tx.hash;
  }

  async setNickname(name) {
    if (!this.contract) throw new Error('Contract not configured');
    const tx = await this.contract.setNickname(name);
    await tx.wait();
    this.nickname = name;
    return tx.hash;
  }

  async getRecordCount() {
    const c = this.getReadContract();
    if (!c) return 0;
    return Number(await c.getRecordCount());
  }

  async getRecord(idx) {
    if (!this.contract) return null;
    return await this.contract.getRecord(idx);
  }

  async getAllRecords() {
    const c = this.getReadContract();
    if (!c) return [];
    const count = Number(await c.getRecordCount());
    const records = [];
    for (let i = 0; i < count; i++) {
      const r = await c.getRecord(i);
      records.push({
        player: r.player,
        time: Number(r.time),
        carId: r.carId,
        replayHash: r.replayHash,
        timestamp: Number(r.timestamp),
      });
    }
    return records;
  }

  getShortAddress() {
    if (!this.address) return '';
    return `${this.address.slice(0, 6)}...${this.address.slice(-4)}`;
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.connected = false;
    this.contract = null;
  }
}

// Singleton
export const wallet = new WalletManager();
