import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LocalApp from './components/LocalApp';
import SepoliaApp from './components/SepoliaApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/local" element={<LocalApp />} />
        <Route path="/sepolia" element={<SepoliaApp />} />
        <Route path="/" element={<div>Select Environment</div>} />
      </Routes>
    </Router>
  );
}

export default App;
