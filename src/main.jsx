import React from "react";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { WagmiProvider } from "wagmi";
import { mainnet, arbitrum, polygon, bsc, optimism, avalanche, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const chains = [mainnet, arbitrum, polygon, bsc, optimism, avalanche, base];
const projectId = "2bf2541340dc39fea57ec973a360f93b";

const metadata = {
  name: "Eclipse Protocol",
  description: "Decentralized AI Infrastructure",
  url: "https://eclipse-porta-d.onrender.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
  redirect: {
    native: "https://eclipse-porta-d.onrender.com",
    universal: "https://eclipse-porta-d.onrender.com"
  }
};

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });
createWeb3Modal({ wagmiConfig, projectId, chains });

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);