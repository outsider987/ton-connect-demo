import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UsdtPayment from './pages/UsdtPayment';
import TonPayment from './pages/TonPayment';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/usdt" element={<UsdtPayment />} />
      <Route path="/ton" element={<TonPayment />} />
    </Routes>
  );
}

export default App;
