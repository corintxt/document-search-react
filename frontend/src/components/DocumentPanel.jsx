import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Component to render a URL as a hoverable [link]
const LinkifiedUrl = ({ url }) => {
    const cleanUrl = url.replace(/^<|>$/g, '').trim();

    return (
        <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
            title={cleanUrl}
        >
            [link]
        </a>
    );
};

// Process text to convert URLs to clickable [link] elements
const processTextWithLinks = (text) => {
    if (!text) return [];

    const urlRegex = /(<https?:\/\/[^\s>]+>|https?:\/\/[^\s<>]+)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'url', content: match[0] });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts;
};

const Highlight = ({ text, query }) => {
    if (!text) return <span>{text}</span>;

    const partsWithUrls = processTextWithLinks(text);

    if (!query) {
        return (
            <span>
                {partsWithUrls.map((part, i) =>
                    part.type === 'url'
                        ? <LinkifiedUrl key={i} url={part.content} />
                        : <span key={i}>{part.content}</span>
                )}
            </span>
        );
    }

    const highlightText = (str) => {
        const queryTerms = query.split(' ').filter(q => q.length > 0);
        const regex = new RegExp(`(${queryTerms.map(q => q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
        const parts = str.split(regex);

        return parts.map((part, i) => {
            const isMatch = queryTerms.some(q => q.toLowerCase() === part.toLowerCase());
            return isMatch
                ? <span key={i} className="highlight">{part}</span>
                : <span key={i}>{part}</span>;
        });
    };

    return (
        <span>
            {partsWithUrls.map((part, i) =>
                part.type === 'url'
                    ? <LinkifiedUrl key={i} url={part.content} />
                    : <span key={i}>{highlightText(part.content)}</span>
            )}
        </span>
    );
};

const DocumentPanel = ({ document, onClose, isBookmarked, onToggleBookmark, onCaseClick }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    if (!document) return null;

    const formatDate = (dateVal) => {
        if (!dateVal) return 'N/A';
        try {
            const d = new Date(dateVal);
            return d.toLocaleDateString();
        } catch {
            return dateVal;
        }
    };

    return (
        <div className="document-panel-overlay" onClick={onClose}>
            <div className="document-panel" onClick={(e) => e.stopPropagation()}>
                <div className="document-panel-header">
                    <div className="document-panel-title">
                        <button
                            className={`bookmark-btn large ${isBookmarked ? 'bookmarked' : ''}`}
                            onClick={() => onToggleBookmark && onToggleBookmark(document)}
                            title={isBookmarked ? t('bookmarks.remove') : t('bookmarks.add')}
                        >
                            {isBookmarked ? '★' : '☆'}
                        </button>
                        <div className="document-title-info">
                            {document.case && (
                                <div className="document-case">
                                    <strong>{t('results.case')}:</strong>{' '}
                                    <button
                                        className="case-link"
                                        onClick={() => {
                                            onCaseClick(document.case);
                                            onClose();
                                        }}
                                    >
                                        {document.case}
                                    </button>
                                </div>
                            )}
                            <h3><strong>{t('results.document')}:</strong> {document.filename}</h3>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="document-panel-content">
                    <div className="result-meta">
                        <div><strong>{t('results.date')}:</strong> {formatDate(document.date)}</div>
                        {document.page_count && <div><strong>{t('results.pages')}:</strong> {document.page_count}</div>}
                        {document.size_human && <div><strong>{t('results.size')}:</strong> {document.size_human}</div>}
                        {document.path && <div><strong>{t('results.path')}:</strong> {document.path}</div>}
                    </div>

                    <div className="document-panel-badges">
                        {document.category && (
                            <span className="category-badge">{document.category}</span>
                        )}
                        {document.subcategory && (
                            <span className="category-badge subcategory">{document.subcategory}</span>
                        )}
                    </div>

                    {document.summary && (
                        <div className="document-summary">
                            <h4>{t('sidebar.showSummary')}</h4>
                            <p><em>{document.summary}</em></p>
                        </div>
                    )}

                    {document.snippet && (
                        <div className="document-snippet">
                            <h4>{t('results.snippet')}</h4>
                            <p><Highlight text={document.snippet} /></p>
                        </div>
                    )}

                    {document.text && (
                        <>
                            <button className="view-full-btn" onClick={() => setExpanded(!expanded)}>
                                {expanded ? t('results.collapse') : t('results.viewFull')}
                            </button>

                            {expanded && (
                                <div className="full-body">
                                    <h4>{t('results.fullDocumentText')}</h4>
                                    <div className="body-content">
                                        <Highlight text={document.text} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="document-panel-footer">
                        <span className="result-id">MD5: {document.md5}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentPanel;
