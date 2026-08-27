import { Link } from "react-router-dom";
import Button from "../components/Button";
import "./Home.css";

function Home() {
  return (
    <div className="home">
      <h2>Design your own custom merch</h2>
      <p>Upload your artwork, preview it on real products, and bring your ideas to life.</p>
      <Link to="/catalog">
        <Button variant="primary">Start designing</Button>
      </Link>
    </div>
  );
}

export default Home;