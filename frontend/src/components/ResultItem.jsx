import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Component to render a URL as a hoverable [link]
const LinkifiedUrl = ({ url }) => {
    // Clean up the URL (remove surrounding < > if present)
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
    
    // Regex to match URLs (including those wrapped in < >)
    const urlRegex = /(<https?:\/\/[^\s>]+>|https?:\/\/[^\s<>]+)/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
        // Add text before the URL
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        // Add the URL
        parts.push({ type: 'url', content: match[0] });
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex) });
    }
    
    return parts;
};

const Highlight = ({ text, query }) => {
    if (!text) return <span>{text}</span>;
    
    // First, process text to identify URLs
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
    
    // For text parts, apply highlighting
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

const ResultItem = ({ result, query, showSummary, isBookmarked, onToggleBookmark }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const bookmarked = isBookmarked ? isBookmarked(result.md5) : false;

    // Format the date from mtime timestamp
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
        <div className="result-card">
            <div className="result-header">
                <div className="result-subject">
                    <button 
                        className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
                        onClick={() => onToggleBookmark && onToggleBookmark(result)}
                        title={bookmarked ? t('bookmarks.remove') : t('bookmarks.add')}
                    >
                        {bookmarked ? '★' : '☆'}
                    </button>
                    <h5><Highlight text={result.filename} query={query} /></h5>
                </div>
                <div className="result-date">
                    <strong>{t('results.date')}:</strong> {formatDate(result.date)}
                </div>
            </div>

            <div className="result-meta">
                {result.page_count && <div><strong>{t('results.pages')}:</strong> {result.page_count}</div>}
                {result.size_human && <div><strong>{t('results.size')}:</strong> {result.size_human}</div>}
                {result.path && <div><strong>{t('results.path')}:</strong> {result.path}</div>}
            </div>

            <div className="result-body">
                {showSummary && result.summary ? (
                    <p><em><Highlight text={result.summary} query={query} /></em></p>
                ) : result.snippet ? (
                    <p>
                        <strong>{t('results.snippet')}: </strong>
                        <Highlight text={result.snippet.substring(0, 375)} query={query} />
                        {result.snippet.length > 375 && '...'}
                    </p>
                ) : result.text ? (
                    <p>
                        <strong>{t('results.text')}: </strong>
                        <Highlight text={result.text.substring(0, 375)} query={query} />
                        {result.text.length > 375 && '...'}
                    </p>
                ) : null}
            </div>

            <div className="result-footer">
                {result.category && (
                    <span className="category-badge">{result.category}</span>
                )}
                {result.subcategory && (
                    <span className="category-badge subcategory">{result.subcategory}</span>
                )}
                {result.text && (
                    <button className="view-full-btn-inline" onClick={() => setExpanded(!expanded)}>
                        {expanded ? t('results.collapse') : t('results.viewFull')}
                    </button>
                )}
                <span className="result-id">MD5: {result.md5}</span>
            </div>

            {expanded && result.text && (
                <div className="full-body">
                    <h6>{t('results.fullDocumentText')}</h6>
                    <div className="body-content">
                        <Highlight text={result.text} query={query} />
                    </div>
                </div>
            )}
            <hr />
        </div>
    );
};

export default ResultItem;
