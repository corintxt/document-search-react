import React from 'react';
import { useTranslation } from 'react-i18next';

const BookmarkList = ({ bookmarks, onSelectDocument, onRemoveBookmark }) => {
    const { t } = useTranslation();

    const handleExport = () => {
        if (!bookmarks || bookmarks.length === 0) return;

        // Escape CSV values properly
        const escapeCsvValue = (val) => {
            if (val == null) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headers = Object.keys(bookmarks[0]).join(',');
        const csv = [
            headers,
            ...bookmarks.map(row => Object.values(row).map(escapeCsvValue).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarked_documents_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (!bookmarks || bookmarks.length === 0) {
        return (
            <div className="bookmark-list-empty">
                <h2>{t('bookmarks.title')}</h2>
                <p className="no-results">{t('bookmarks.empty')}</p>
            </div>
        );
    }

    return (
        <div className="document-list">
            <div className="document-list-header">
                <span>{t('bookmarks.title')} ({bookmarks.length})</span>
                <button onClick={handleExport} className="export-btn-main">{t('bookmarks.export')}</button>
            </div>
            <table className="document-table bookmark-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}></th>
                        <th style={{ width: '25%' }}>{t('documentList.filename')}</th>
                        <th style={{ width: '12%' }}>{t('documentList.category')}</th>
                        <th style={{ width: 'auto' }}>{t('documentList.summary')}</th>
                    </tr>
                </thead>
                <tbody>
                    {bookmarks.map((doc) => (
                        <tr key={doc.md5}>
                            <td>
                                <button 
                                    className="bookmark-btn bookmarked"
                                    onClick={() => onRemoveBookmark(doc.md5)}
                                    title={t('bookmarks.remove')}
                                >
                                    ★
                                </button>
                            </td>
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
        </div>
    );
};

export default BookmarkList;
