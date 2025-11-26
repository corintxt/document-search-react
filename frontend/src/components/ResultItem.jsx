import React, { useState } from 'react';

const Highlight = ({ text, query }) => {
    if (!query || !text) return <span>{text}</span>;

    const parts = text.split(new RegExp(`(${query.split(' ').join('|')})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() || query.split(' ').some(q => q.toLowerCase() === part.toLowerCase()) ?
                    <span key={i} className="highlight">{part}</span> : part
            )}
        </span>
    );
};

const ResultItem = ({ result, query, showSummary }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="result-card">
            <div className="result-header">
                <div className="result-subject">
                    <h5><Highlight text={result.Subject} query={query} /></h5>
                </div>
                <div className="result-date">
                    <strong>Date:</strong> {result.date}
                </div>
            </div>

            <div className="result-meta">
                <div><strong>From:</strong> {result.sender}</div>
                <div><strong>To:</strong> {result.recipient}</div>
            </div>

            <div className="result-body">
                {showSummary && result.summary ? (
                    <p><em><Highlight text={result.summary} query={query} /></em></p>
                ) : (
                    <p>
                        <strong>Body: </strong>
                        <Highlight text={result.Body.substring(0, 500)} query={query} />
                        {result.Body.length > 500 && '...'}
                    </p>
                )}
            </div>

            <div className="result-footer">
                {result.category && (
                    <span className="category-badge">{result.category}</span>
                )}
                <span className="result-id">ID: {result.id} • Source file: {result.filename}</span>
            </div>

            <button className="view-full-btn" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Collapse' : '🔗 View Full'}
            </button>

            {expanded && (
                <div className="full-body">
                    <h6>Full Email Body</h6>
                    <div className="body-content">
                        <Highlight text={result.Body} query={query} />
                    </div>
                </div>
            )}
            <hr />
        </div>
    );
};

export default ResultItem;
