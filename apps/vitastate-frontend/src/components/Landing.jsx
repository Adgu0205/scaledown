import React, { useState, useEffect } from 'react';
import './Landing.css';

export default function Landing({ onStart }) {
    const words = ["State", "Mind", "Health", "Fitness"];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="landing-page">
            <div className="content-layer">
                <div className="title-container">
                    <span className="static-text">Vita-</span>
                    <div className="rotating-container">
                        <div
                            className="rotating-wrapper"
                            style={{ transform: `translateY(-${index * 1.2}em)` }}
                        >
                            {words.map((word, i) => (
                                <span key={i} className="rotating-item">
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <button onClick={onStart} className="start-btn">
                    Let's Start
                </button>

                <p className="tagline">
                    Get a clear snapshot of your health while exercising your fingers.
                </p>
            </div>

            <footer className="landing-footer">
                <div className="footer-left">@2026 development</div>
                <div className="footer-center">Vita-State</div>
                <div className="footer-right">
                    Made by: <a href="https://adityagupta2005.in" target="_blank" rel="noopener noreferrer">Aditya Gupta</a>
                </div>
            </footer>

        </div>
    );
}
