import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 20;

const DocumentList = ({ documents, onSelectDocument, loading, query, categoryFilter, subcategoryFilter }) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);

    // Filter documents based on query and category
    const filteredDocuments = useMemo(() => {
        if (!documents) return [];
        
        return documents.filter(doc => {
            // Category filter
            if (categoryFilter && doc.category !== categoryFilter) {
                return false;
            }
            
            // Subcategory filter
            if (subcategoryFilter && doc.subcategory !== subcategoryFilter) {
                return false;
            }
            
            // Search query filter (search in filename, text, and summary)
            if (query && query.trim()) {
                const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
                const searchableText = [
                    doc.filename || '',
                    doc.text || '',
                    doc.summary || ''
                ].join(' ').toLowerCase();
                
                // All terms must match
                return searchTerms.every(term => searchableText.includes(term));
            }
            
            return true;
        });
    }, [documents, query, categoryFilter, subcategoryFilter]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [query, categoryFilter, subcategoryFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

    if (loading) {
        return <div className="loading-spinner">{t('results.loading')}</div>;
    }

    if (!documents || documents.length === 0) {
        return <div className="no-results">{t('documentList.noDocuments')}</div>;
    }

    if (filteredDocuments.length === 0) {
        return <div className="no-results">{t('results.noResults')}</div>;
    }

    return (
        <div className="document-list">
            <div className="document-list-header">
                <span>{t('documentList.totalDocuments', { count: filteredDocuments.length })}</span>
                {(query || categoryFilter || subcategoryFilter) && filteredDocuments.length !== documents.length && (
                    <span className="filter-info"> ({t('documentList.filtered', { total: documents.length })})</span>
                )}
            </div>
            <table className="document-table">
                <thead>
                    <tr>
                        <th>{t('documentList.filename')}</th>
                        <th>{t('documentList.category')}</th>
                        <th>{t('documentList.summary')}</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedDocuments.map((doc, idx) => (
                        <tr key={doc.md5 || idx}>
                            <td>
                                <button 
                                    className="filename-link"
                                    onClick={() => onSelectDocument(doc)}
                                >
                                    {doc.filename}
                                </button>
                            </td>
                            <td>
                                {doc.category && (
                                    <span className="category-badge compact">{doc.category}</span>
                                )}
                            </td>
                            <td className="summary-cell">
                                {doc.summary ? (
                                    <span className="summary-text">{doc.summary.substring(0, 150)}{doc.summary.length > 150 ? '...' : ''}</span>
                                ) : (
                                    <span className="no-summary">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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

export default DocumentList;
