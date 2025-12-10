import React from 'react';
import { useTranslation } from 'react-i18next';
import ResultItem from './ResultItem';

const ResultList = ({ results, query, showSummary }) => {
    const { t } = useTranslation();
    
    if (!results || results.length === 0) {
        return <div className="no-results">{t('results.noResults')}</div>;
    }

    const uniqueCategories = new Set(results.map(r => r.category).filter(Boolean)).size;
    const totalPages = results.reduce((sum, r) => sum + (r.page_count || 0), 0);
    const dates = results.map(r => r.date).filter(Boolean).map(d => new Date(d));
    const minDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split('T')[0] : 'N/A';
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split('T')[0] : 'N/A';

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
                    <div className="stat-value">{totalPages}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">{t('results.dateRange')}</div>
                    <div className="stat-value-small">{minDate} to {maxDate}</div>
                </div>
            </div>

            <button onClick={handleExport} className="export-btn-main">{t('results.exportButton')}</button>

            <hr />

            {results.map((result, idx) => (
                <ResultItem key={idx} result={result} query={query} showSummary={showSummary} />
            ))}
        </div>
    );
};

export default ResultList;
