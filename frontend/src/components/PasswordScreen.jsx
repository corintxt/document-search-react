import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PasswordScreen = ({ onAuthenticate }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const appPassword = import.meta.env.VITE_APP_PASSWORD;
        
        if (password === appPassword) {
            sessionStorage.setItem('authenticated', 'true');
            onAuthenticate(true);
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="password-screen">
            <div className="password-box">
                <h1>{t('auth.title')}</h1>
                <p>{t('auth.prompt')}</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError(false);
                        }}
                        placeholder={t('auth.placeholder')}
                        autoFocus
                    />
                    <button type="submit">{t('auth.submit')}</button>
                </form>
                {error && <p className="password-error">{t('auth.error')}</p>}
            </div>
        </div>
    );
};

export default PasswordScreen;
