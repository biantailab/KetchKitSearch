import React, { useState } from 'react';
import {
  getPubChemCID,
  getCASByCID,
  getPubChemData,
  getIUPACNameByCID,
  findDrugBankId,
  findWikipediaLink
} from './services/pubchem.ts';

function ControlPanel({
  smilesInput,
  onSmilesChange,
  onGetSmiles,
  onLoadSmiles,
  onClear,
  onCopy
}) {
  const [loading, setLoading] = useState(false);

  // Example selection
  const handleExampleChange = (e) => {
    const value = e.target.value;
    if (value) {
      onSmilesChange({ target: { value } });
    }
  };

  const handlePubChem = () => {
    if (smilesInput) {
      const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(smilesInput)}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleHNMR = () => {
    if (smilesInput) {
      const searchUrl = `https://www.nmrdb.org/new_predictor/index.shtml?v=v2.157.0&smiles=${encodeURIComponent(smilesInput)}`;
      window.open(searchUrl, '_blank');
    }
  };

  // Get dropdown
  const handleGetSelect = async (event) => {
    const value = event.target.value;
    if (!smilesInput || !value) return;
    setLoading(true);
    try {
      const cid = await getPubChemCID(smilesInput);
      if (!cid) {
        alert('Compound not found');
        return;
      }
      if (value === 'cas') {
        const cas = await getCASByCID(cid);
        if (cas) {
          await navigator.clipboard.writeText(cas);
          alert(`CAS ${cas} copied`);
        } else {
          alert('CAS number not found');
        }
      } else if (value === 'iupac') {
        const name = await getIUPACNameByCID(cid);
        if (name) {
          await navigator.clipboard.writeText(name);
          alert(`IUPAC Name: ${name} copied`);
        } else {
          alert('IUPAC Name not found');
        }
      }
    } catch {
      alert('Failed to fetch, please check your network');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleGetWikipedia = async () => {
    if (!smilesInput) return;
    setLoading(true);
    try {
      const cid = await getPubChemCID(smilesInput);
      if (!cid) {
        alert('Compound not found');
        return;
      }
      const data = await getPubChemData(cid);
      const wikipediaUrl = findWikipediaLink(data.Record?.Section, data.Record?.RecordTitle);
      if (wikipediaUrl) {
        window.open(wikipediaUrl, '_blank');
      } else {
        alert('Wikipedia link not found');
      }
    } catch {
      alert('Failed to fetch Wikipedia link');
    } finally {
      setLoading(false);
    }
  };

  const handleDrugBankSelect = async (event) => {
    const value = event.target.value;
    if (!smilesInput || !value) return;
    setLoading(true);
    try {
      const cid = await getPubChemCID(smilesInput);
      if (!cid) {
        alert('Compound not found');
        return;
      }
      if (value === 'exact') {
        const data = await getPubChemData(cid);
        const result = findDrugBankId(data.Record?.Section);
        if (result && result.url) {
          window.open(result.url, '_blank');
        } else {
          const casNumber = await getCASByCID(cid);
          if (casNumber) {
            const url = `https://go.drugbank.com/unearth/q?searcher=drugs&query=${encodeURIComponent(casNumber)}`;
            window.open(url, '_blank');
          } else {
            alert('DrugBank ID or CAS number not found');
          }
        }
      } else if (value === 'fuzzy') {
        const url = `https://go.drugbank.com/structures/search/small_molecule_drugs/structure?utf8=✓&searcher=structure&structure_search_type=substructure&structure=${encodeURIComponent(smilesInput)}#results`;
        window.open(url, '_blank');
      }
    } catch {
      alert('Failed to fetch DrugBank info');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div style={{ marginTop: '4px', marginBottom: '4px' }}>
      {loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div>Loading...</div>
        </div>
      )}
      {/* Responsive input area */}
      <div className="input-stars-row">
        <input
          id="smiles-input"
          type="text"
          value={smilesInput}
          onChange={onSmilesChange}
          placeholder="SMILES"
          style={{ flex: 1, minWidth: 0 }}
        />
        <a
          href="https://github.com/biantailab/KetchKitSearch"
          target="_blank"
          style={{ verticalAlign: 'middle', marginLeft: '2px' }}
        >
          <img
            src="https://img.shields.io/github/stars/biantailab/KetchKitSearch?style=social"
            alt="GitHub stars"
            style={{ height: '22px', verticalAlign: 'middle', position: 'relative' }}
          />
        </a>
      </div>
      {/* Responsive button area */}
      <div className="button-group" style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        <select onChange={handleExampleChange} style={{ height: '20px', cursor: 'pointer' }}>
          <option value="">Example:</option>
          <option value="C(C1=CC=CC=C1)[Ti](CC1=CC=CC=C1)(CC1=CC=CC=C1)CC1=CC=CC=C1">Benzyl titanium</option>
          <option value="O=C(O)C[C@H](CC(C)C)CN">Pregabalin</option>
          <option value="CNCCC(C1=CC=CC=C1)OC2=CC=C(C=C2)C(F)(F)F">Fluoxetine</option>
        </select>
        <button onClick={onGetSmiles} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }} title="Get SMILES">Get</button>
        <button onClick={onLoadSmiles} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }} title="Load SMILES">Load</button>
        <button onClick={onClear} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>Clear</button>
        <button onClick={onCopy} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>Copy</button>
        <select onChange={handleGetSelect} style={{ height: '20px', cursor: 'pointer' }}>
          <option value="">Get:</option>
          <option value="cas">CAS</option>
          <option value="iupac" title="IUPACName">Name</option>
        </select>
        <button onClick={handleHNMR} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>HNMR</button>
        <button onClick={handlePubChem} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>PubChem</button>
        <button onClick={handleGetWikipedia} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>Wikipedia</button>
        <select onChange={handleDrugBankSelect} style={{ height: '20px', cursor: 'pointer' }}>
          <option value="">DrugBank:</option>
          <option value="exact">exact</option>
          <option value="fuzzy">fuzzy</option>
        </select>
      </div>
      {/* Responsive styles */}
      <style>{`
        .input-stars-row {
          display: flex;
          align-items: center;
          width: 100%;
          height: 20px;
          max-width: 690px;
          gap: 4px;
          margin: 0 auto;
        }
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
        }
        .button-group button, .button-group select {
          min-width: 80px;
        }
        @media screen and (max-width: 700px) {
          .input-stars-row {
            max-width: 100vw;
          }
          .button-group {
            gap: 4px;
          }
          .button-group button, .button-group select {
            flex: 1 0 auto;
            min-width: 90px;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default ControlPanel; 