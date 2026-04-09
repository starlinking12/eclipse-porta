import Footer from "./components/footer";
import Slider from "./components/slider";
import { useAccount } from "wagmi";

const App = () => {
  const { address } = useAccount();

  return (
    <>
      <Slider />
      <Footer />
    </>
  );
};

export default App;