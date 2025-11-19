import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LifeMapView from './components/LifeMapView';

function App() {
  console.log('App component rendering');
  console.log('App: window.location:', window.location.href);
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/life-map" element={<LifeMapView />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

