import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Sidebar = ({ filters, setFilters, onSearch, selectedTableId }) => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const params = selectedTableId ? `?table_id=${selectedTableId}` : '';
                const res = await axios.get(`${apiUrl}/api/categories${params}`);
                setCategories([t('sidebar.allCategories'), ...(res.data.categories || [])]);
                setSubcategories([t('sidebar.allSubcategories'), ...(res.data.subcategories || [])]);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, [t, selectedTableId]);

    const handleChange = (key, value) => {
        // Compute next filters from current props (avoid side-effects in setState updater)
        const next = { ...filters, [key]: value };
        setFilters(next);
        if ((key === 'category_filter' || key === 'subcategory_filter') && typeof onSearch === 'function') {
            onSearch(next);
        }
    };

    return (
        <div className="sidebar">
            <h2>{t('sidebar.searchFilters')}</h2>

            <div className="filter-group">
                <label>{t('sidebar.maxResults')}:</label>
                <select
                    value={filters.limit === null ? 'all' : filters.limit}
                    onChange={(e) => handleChange('limit', e.target.value === 'all' ? null : parseInt(e.target.value))}
                >
                    {[50, 100, 200, 500, 1000].map(val => (
                        <option key={val} value={val}>{val}</option>
                    ))}
                    <option value="all">{t('sidebar.all')}</option>
                </select>
            </div>

            <div className="filter-group">
                <label>{t('sidebar.searchIn')}:</label>
                <div className="radio-group">
                    {[
                        { value: 'Text', label: t('sidebar.text') },
                        { value: 'Case', label: t('sidebar.caseName') },
                        { value: 'Summary', label: t('sidebar.summary') }
                    ].map(type => (
                        <label key={type.value}>
                            <input
                                type="radio"
                                value={type.value}
                                checked={filters.search_type === type.value}
                                onChange={(e) => handleChange('search_type', e.target.value)}
                            />
                            {type.label}
                        </label>
                    ))}
                </div>
            </div>

            {categories.length > 1 && (
                <div className="filter-group">
                    <label>{t('sidebar.filterByCategory')}:</label>
                    <select
                        value={filters.category_filter || t('sidebar.allCategories')}
                        onChange={(e) => handleChange('category_filter', e.target.value === t('sidebar.allCategories') ? null : e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            )}

            {subcategories.length > 1 && (
                <div className="filter-group">
                    <label>{t('sidebar.filterBySubcategory')}:</label>
                    <select
                        value={filters.subcategory_filter || t('sidebar.allSubcategories')}
                        onChange={(e) => handleChange('subcategory_filter', e.target.value === t('sidebar.allSubcategories') ? null : e.target.value)}
                    >
                        {subcategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            )}

            <h3>{t('sidebar.dateRange')}</h3>
            <div className="filter-group">
                <label>
                    <input
                        type="checkbox"
                        checked={!!filters.date_from}
                        onChange={(e) => {
                            if (e.target.checked) {
                                const today = new Date().toISOString().split('T')[0];
                                setFilters({ ...filters, date_from: today, date_to: today });
                            } else {
                                setFilters({ ...filters, date_from: null, date_to: null });
                            }
                        }}
                    />
                    {t('sidebar.filterByDate')}
                </label>
                {filters.date_from && (
                    <div className="date-inputs">
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleChange('date_from', e.target.value)}
                        />
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleChange('date_to', e.target.value)}
                        />
                    </div>
                )}
            </div>

            <h3>{t('sidebar.displayOptions')}</h3>
            <div className="filter-group">
                <label>
                    <input
                        type="checkbox"
                        checked={filters.show_summaries}
                        onChange={(e) => handleChange('show_summaries', e.target.checked)}
                    />
                    {t('sidebar.showSummary')}
                </label>
                <p style={{ fontStyle: 'italic', fontSize: '0.85em', marginTop: '0.5em', color: '#666' }}>
                    {t('sidebar.summaryDisclaimer')}
                </p>
            </div>

        </div>
    );
};

export default Sidebar;
