import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResultItem from './ResultItem';

const ITEMS_PER_PAGE = 20;

const ResultList = ({ results, query, showSummary, isBookmarked, onToggleBookmark, onCaseClick }) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);

    if (!results || results.length === 0) {
        return <div className="no-results">{t('results.noResults')}</div>;
    }

    const uniqueCategories = new Set(results.map(r => r.category).filter(Boolean)).size;
    const totalDocPages = results.reduce((sum, r) => sum + (r.page_count || 0), 0);
    const dates = results.map(r => r.date).filter(Boolean).map(d => new Date(d));
    const minDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split('T')[0] : 'N/A';
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split('T')[0] : 'N/A';

    // Pagination
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedResults = results.slice(startIndex, endIndex);

    const handleExport = () => {
        // Escape CSV values properly
        const escapeCsvValue = (val) => {
            if (val == null) return '';
            const str = String(val);
            // If value contains comma, quote, or newline, wrap in quotes and escape quotes
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headers = Object.keys(results[0]).join(',');
        const csv = [
            headers,
            ...results.map(row => Object.values(row).map(escapeCsvValue).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_search_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="result-list">
            <div className="results-success">✅ {t('results.found', { count: results.length })}</div>

            <div className="stats-grid">
                <div className="stat-box">
                    <div className="stat-label">{t('results.totalResults')}</div>
                    <div className="stat-value">{results.length}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">{t('results.uniqueCategories')}</div>
                    <div className="stat-value">{uniqueCategories}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">{t('results.totalPages')}</div>
                    <div className="stat-value">{totalDocPages}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">{t('results.dateRange')}</div>
                    <div className="stat-value-small">{minDate} to {maxDate}</div>
                </div>
            </div>

            <button onClick={handleExport} className="export-btn-main">{t('results.exportButton')}</button>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        «
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        ‹
                    </button>
                    <span className="pagination-info">
                        {t('documentList.page', { current: currentPage, total: totalPages })}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        ›
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        »
                    </button>
                </div>
            )}

            <hr />

            {paginatedResults.map((result, idx) => (
                <ResultItem
                    key={startIndex + idx}
                    result={result}
                    query={query}
                    showSummary={showSummary}
                    isBookmarked={isBookmarked}
                    onToggleBookmark={onToggleBookmark}
                    onCaseClick={onCaseClick}
                />
            ))}

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        «
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        ‹
                    </button>
                    <span className="pagination-info">
                        {t('documentList.page', { current: currentPage, total: totalPages })}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        ›
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        »
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResultList;
