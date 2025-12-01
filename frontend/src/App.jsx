import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ResultList from './components/ResultList';
import './index.css';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const [filters, setFilters] = useState({
    limit: 100,
    search_type: 'All fields',
    date_from: null,
    date_to: null,
    sender_filter: '',
    recipient_filter: '',
    show_summaries: false,
    category_filter: null
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Use environment variable for API URL in production, fallback to proxy in development
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const payload = {
        query: query,
        ...filters
      };
      const response = await axios.post(`${apiUrl}/api/search`, payload);
      setResults(response.data.results);
    } catch (error) {
      console.error("Search failed", error);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
      />

      <div className="main-content">
        <header className="app-header">
          <h1>Email Search Tool</h1>
          <div className="dataset-info">Target dataset: <code>{import.meta.env.VITE_DATASET || 'Configured Dataset'}</code></div>
        </header>

        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter keywords to search..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="search-button" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">🔍 Searching emails...</div>
        ) : (
          <ResultList results={results} query={query} showSummary={filters.show_summaries} />
        )}
      </div>
    </div>
  );
}

export default App;
