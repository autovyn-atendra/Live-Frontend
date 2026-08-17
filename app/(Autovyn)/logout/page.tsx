"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

const LogoutPage = () => {

    useEffect(() => {
        const logout = async () => {
            await signOut();
        };
        logout();
    }, []);

    return (

        <div className="page h-screen">
            <div className="card">
                <div className="logo-wrap">
                    <div className="logo-icon">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <path d="M6 18 Q6 8 18 8 Q30 8 30 18 Q30 28 18 28 Q10 28 8 22" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" />
                            <circle cx="18" cy="18" r="4" fill="white" />
                            <path d="M14 14 L10 10 M22 14 L26 10 M14 22 L10 26 M22 22 L26 26" stroke="white" stroke-width="1.5" stroke-linecap="round" />
                        </svg>
                    </div>
                    <div className="brand-title">AUTO-VYN</div>
                    <div className="brand-sub">Automation Through Technologies</div>
                </div>

                <div className="divider"></div>

                <div className="spinner-wrap">
                    <div className="spinner"></div>
                </div>

                <div className="status-title">
                    Signing you out<span className="dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
                <div className="status-sub">
                    Please wait while we securely end your session and clear your credentials.
                </div>

                <div className="divider"></div>

                <div className="footer">
                    You will be redirected to the login page shortly.
                    <div className="version-badge">ERP Version 2.0</div>
                </div>
            </div>
            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                * {box - sizing: border-box; margin: 0; padding: 0; }
                body {font - family: 'Inter', sans-serif; }
                .page {
                    min - height: 100vh;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                }
                                .card {
                                    background: #fff;
                                border-radius: 12px;
                                padding: 2.5rem 2rem;
                                width: 100%;
                                max-width: 380px;
                                text-align: center;
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                                .logo-wrap {
                                    margin - bottom: 1.5rem;
                }
                                .logo-icon {
                                    width: 64px;
                                height: 64px;
                                background: linear-gradient(135deg, #0f3460, #1a6aab);
                                border-radius: 14px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin: 0 auto 0.75rem;
                }
                                .brand-title {
                                    font - size: 22px;
                                font-weight: 700;
                                color: #0f3460;
                                letter-spacing: 2px;
                }
                                .brand-sub {
                                    font - size: 11px;
                                color: #7a8394;
                                letter-spacing: 1px;
                                margin-top: 2px;
                }
                                .divider {
                                    height: 1px;
                                background: #e8ecf0;
                                margin: 1.5rem 0;
                }
                                .spinner-wrap {
                                    margin: 1rem auto 1.25rem;
                                width: 48px;
                                height: 48px;
                                position: relative;
                }
                                .spinner {
                                    width: 48px;
                                height: 48px;
                                border: 3px solid #e8ecf0;
                                border-top-color: #0f3460;
                                border-radius: 50%;
                                animation: spin 0.9s linear infinite;
                }
                                @keyframes spin {to {transform: rotate(360deg); } }
                                .status-title {
                                    font - size: 17px;
                                font-weight: 600;
                                color: #1a1a2e;
                                margin-bottom: 0.4rem;
                }
                                .status-sub {
                                    font - size: 13px;
                                color: #7a8394;
                                line-height: 1.6;
                }
                                .dots span {
                                    animation: blink 1.4s infinite;
                                opacity: 0;
                }
                                .dots span:nth-child(2) {animation - delay: 0.2s; }
                                .dots span:nth-child(3) {animation - delay: 0.4s; }
                                @keyframes blink {0 %, 80 %, 100 % { opacity: 0; } 40% {opacity: 1; } }
                                .footer {
                                    margin - top: 2rem;
                                font-size: 11px;
                                color: #b0b8c4;
                                letter-spacing: 0.5px;
                }
                                .version-badge {
                                    display: inline-block;
                                background: #f0f4f8;
                                color: #7a8394;
                                font-size: 10px;
                                padding: 3px 10px;
                                border-radius: 20px;
                                margin-top: 0.5rem;
                                letter-spacing: 0.5px;
                }
            `}</style>
        </div>

    );
};

export default LogoutPage;