import React, { useState, useEffect } from 'react';
import initRDKitModule from '@rdkit/rdkit';
import KetcherBox from './ketcher-component.tsx';
import 'ketcher-react/dist/index.css'
import ControlPanel from './ControlPanel.jsx';

function App() {
  const [ketcher, setKetcher] = useState(null);
  const [RDKit, setRDKit] = useState(null); 
  const [smilesInput, setSmilesInput] = useState('');

  useEffect(() => {
    const loadRDKit = async () => {
      const RDKitModule = await initRDKitModule({
        locateFile: () => `${import.meta.env.BASE_URL}RDKit_minimal.wasm`,
      });
      setRDKit(RDKitModule);
      console.log("RDKit.js loaded:", RDKitModule.version());
    };
    loadRDKit();
  }, []);

  const handleGetSmiles = async () => {
    if (!ketcher || !ketcher.getSmiles) {
      return;
    }
    try {
      const smiles = await ketcher.getSmiles();
      setSmilesInput(smiles);
    } catch {
      // 
    }
  };

  const handleLoadSmiles = async () => {
    if (!ketcher || !smilesInput.trim()) {
      return;
    }
    try {
      await ketcher.setMolecule(smilesInput);
    } catch {
      // 
    }
  };

  const handleClear = async () => {
    setSmilesInput("");
    if (ketcher && ketcher.setMolecule) {
      try {
        await ketcher.setMolecule("");
      } catch {
        // 
      }
    }
  };

  const handleCopy = async () => {
    if (!smilesInput) {
      return;
    }
    try {
      await navigator.clipboard.writeText(smilesInput);
    } catch {
      //
    }
  };

  const handleSmilesChange = (e) => {
    setSmilesInput(e.target.value);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginBottom: '4px', background: '#fff' }}>
        <ControlPanel
          smilesInput={smilesInput}
          onSmilesChange={handleSmilesChange}
          onGetSmiles={handleGetSmiles}
          onLoadSmiles={handleLoadSmiles}
          onClear={handleClear}
          onCopy={handleCopy}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}>
        <KetcherBox onKetcherInit={setKetcher}/>
      </div>
    </div>
  )
}

export default App