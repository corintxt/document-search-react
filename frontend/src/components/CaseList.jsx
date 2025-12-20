import React from 'react';
import { useTranslation } from 'react-i18next';

const CaseList = ({ cases, onCaseClick, loading }) => {
    const { t } = useTranslation();

    if (loading) {
        return <div className="loading-spinner">{t('caseList.loading')}</div>;
    }

    if (!cases || cases.length === 0) {
        return <div className="no-results">{t('caseList.noCases')}</div>;
    }

    return (
        <div className="case-list">
            <div className="case-list-header">
                <h2>{t('caseList.title')}</h2>
                <span className="case-count">{cases.length} cases</span>
            </div>
            <div className="case-grid">
                {cases.map((caseItem, idx) => (
                    <button
                        key={caseItem.case || idx}
                        className="case-card"
                        onClick={() => onCaseClick(caseItem.case)}
                    >
                        <div className="case-name">{caseItem.case}</div>
                        <div className="case-doc-count">
                            {t('caseList.documents', { count: caseItem.document_count })}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CaseList;
