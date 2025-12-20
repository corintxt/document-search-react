import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import ReactGA from 'react-ga4';
import Sidebar from './components/Sidebar';
import ResultList from './components/ResultList';
import DocumentList from './components/DocumentList';
import DocumentPanel from './components/DocumentPanel';
import BookmarkList from './components/BookmarkList';
import PasswordScreen from './components/PasswordScreen';
import './index.css';

function App() {
  const { t, i18n } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('authenticated') === 'true';
  });
  const [results, setResults] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [activeView, setActiveView] = useState('search'); // 'search', 'documents', or 'bookmarks'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [bookmarks, setBookmarks] = useState([]); // Array of bookmarked documents
  const [caseFilter, setCaseFilter] = useState(null); // Filter documents by case

  // Bookmark functions
  const toggleBookmark = (document) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.md5 === document.md5);
      if (exists) {
        return prev.filter(b => b.md5 !== document.md5);
      } else {
        return [...prev, document];
      }
    });
  };

  const isBookmarked = (md5) => {
    return bookmarks.some(b => b.md5 === md5);
  };

  const removeBookmark = (md5) => {
    setBookmarks(prev => prev.filter(b => b.md5 !== md5));
  };

  const [filters, setFilters] = useState({
    limit: null,
    search_type: 'All fields',
    date_from: null,
    date_to: null,
    show_summaries: false,
    category_filter: null,
    subcategory_filter: null
  });

  // Refs to always have access to current values
  const filtersRef = useRef(filters);
  const queryRef = useRef(query);
  const selectedTableIdRef = useRef(selectedTableId);

  // Keep refs in sync with state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    selectedTableIdRef.current = selectedTableId;
  }, [selectedTableId]);

  // Fetch dataset configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/config`);
        setDatasetInfo(response.data);
        // Set default selected table to first available
        if (response.data.tables && response.data.tables.length > 0) {
          setSelectedTableId(response.data.tables[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch config", error);
      }
    };
    fetchConfig();
  }, []);

  const handleSearch = useCallback(async (overrideFilters) => {
    // Ignore if overrideFilters is an event object (from onClick handlers)
    const isValidFilters = overrideFilters && typeof overrideFilters === 'object' && 'limit' in overrideFilters;
    setLoading(true);
    setError(null);
    try {
      // Use environment variable for API URL in production, fallback to proxy in development
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const payload = {
        query: queryRef.current,
        table_id: selectedTableIdRef.current,
        ...(isValidFilters ? overrideFilters : filtersRef.current)
      };
      const response = await axios.post(`${apiUrl}/api/search`, payload);
      setResults(response.data.results);

      // Track search query with Google Analytics
      ReactGA.event({
        category: 'Search',
        action: 'query',
        label: queryRef.current,
      });
    } catch (err) {
      console.error("Search failed", err);
      setError("Search failed: database configuration error. Please select a different dataset.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const params = selectedTableIdRef.current ? `?table_id=${selectedTableIdRef.current}` : '';
      const response = await axios.get(`${apiUrl}/api/documents${params}`);
      setDocuments(response.data.documents);
    } catch (err) {
      console.error("Failed to fetch documents", err);
      setError("Failed to load document list.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'documents' && documents.length === 0) {
      fetchDocuments();
    }
  };

  const handleSelectDocument = (doc) => {
    setSelectedDocument(doc);
  };

  const handleCaseClick = (caseName) => {
    setCaseFilter(caseName);
    setActiveView('documents');
    if (documents.length === 0) {
      fetchDocuments();
    }
  };

  // Show password screen if not authenticated (skip in dev mode)
  const isDev = import.meta.env.DEV;
  if (!isDev && !isAuthenticated) {
    return <PasswordScreen onAuthenticate={setIsAuthenticated} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        selectedTableId={selectedTableId}
      />

      <div className="main-content">
        <nav className="nav-header">
          <div className="nav-left">
            <button
              className={`nav-link ${activeView === 'search' ? 'active' : ''}`}
              onClick={() => handleViewChange('search')}
            >
              {t('nav.search')}
            </button>
            <button
              className={`nav-link ${activeView === 'documents' ? 'active' : ''}`}
              onClick={() => handleViewChange('documents')}
            >
              {t('nav.documentList')}
            </button>
            <button
              className={`nav-link ${activeView === 'bookmarks' ? 'active' : ''}`}
              onClick={() => handleViewChange('bookmarks')}
            >
              {t('nav.bookmarks')} {bookmarks.length > 0 && `(${bookmarks.length})`}
            </button>
          </div>
          <a
            href="https://email-search-afp.up.railway.app/"
            className="nav-link nav-external"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('nav.emailSearch')} →
          </a>
        </nav>

        <header className="app-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>{t('header.title')} • AFP-DDV</h1>
              {datasetInfo && datasetInfo.tables && datasetInfo.tables.length > 0 && (
                <div className="dataset-info">
                  {t('header.datasetInfo')}:{' '}
                  {datasetInfo.tables.length === 1 ? (
                    <code>{datasetInfo.dataset}.{datasetInfo.tables[0].table}</code>
                  ) : (
                    <select
                      className="dataset-select"
                      value={selectedTableId || ''}
                      onChange={(e) => {
                        setSelectedTableId(e.target.value);
                        setResults([]); // Clear results when switching tables
                      }}
                    >
                      {datasetInfo.tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              >
                EN
              </button>
              <button
                onClick={() => i18n.changeLanguage('fr')}
                className={`lang-btn ${i18n.language === 'fr' ? 'active' : ''}`}
              >
                FR
              </button>
            </div>
          </div>
        </header>

        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="search-button" onClick={handleSearch} disabled={loading}>
            {loading ? t('search.searching') : `🔍 ${t('search.button')}`}
          </button>
        </div>

        {activeView === 'search' ? (
          <>
            {loading ? (
              <div className="loading-spinner">{t('results.loading')}</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <ResultList
                results={results}
                query={query}
                showSummary={filters.show_summaries}
                isBookmarked={isBookmarked}
                onToggleBookmark={toggleBookmark}
                onCaseClick={handleCaseClick}
              />
            )}
          </>
        ) : activeView === 'documents' ? (
          <DocumentList
            documents={documents}
            onSelectDocument={handleSelectDocument}
            loading={loading}
            query={query}
            categoryFilter={filters.category_filter}
            subcategoryFilter={filters.subcategory_filter}
            caseFilter={caseFilter}
            onCaseClick={handleCaseClick}
            onClearCaseFilter={() => setCaseFilter(null)}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
          />
        ) : (
          <BookmarkList
            bookmarks={bookmarks}
            onSelectDocument={handleSelectDocument}
            onRemoveBookmark={removeBookmark}
            onCaseClick={handleCaseClick}
          />
        )}
      </div>

      {selectedDocument && (
        <DocumentPanel
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          isBookmarked={isBookmarked(selectedDocument.md5)}
          onToggleBookmark={toggleBookmark}
          onCaseClick={handleCaseClick}
        />
      )}
    </div>
  );
}

export default App;
