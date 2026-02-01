'use client';

import { useState, useEffect, useCallback } from 'react';

interface TourStep {
    id: string;
    target: string; // CSS selector
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        id: 'welcome',
        target: '[data-tour="sidebar"]',
        title: 'Welcome to Cymbiose KB! 👋',
        description: 'This is your sidebar navigation. Let\'s take a quick tour of the platform!',
        position: 'right'
    },
    {
        id: 'dashboard',
        target: '[data-tour="dashboard"]',
        title: 'Dashboard',
        description: 'View key metrics: total entries, chunks, approved content, and pending reviews at a glance.',
        position: 'right'
    },
    {
        id: 'catalog',
        target: '[data-tour="catalog"]',
        title: 'KB Catalog',
        description: 'Browse, search, edit and delete all your knowledge base entries. Filter by source type or status.',
        position: 'right'
    },
    {
        id: 'scraper',
        target: '[data-tour="scraper"]',
        title: 'URL Scraper',
        description: 'Paste any clinical URL and our Gemini AI will extract content + suggest clinical tags automatically!',
        position: 'right'
    },
    {
        id: 'add-entry',
        target: '[data-tour="add-entry"]',
        title: 'Add Entry',
        description: 'Manually create knowledge base entries with clinical taxonomy tags - modality, population, risk factors, etc.',
        position: 'right'
    },
    {
        id: 'export',
        target: '[data-tour="export"]',
        title: 'Export Data',
        description: 'Export your knowledge base for vector embedding or integrate via API endpoints.',
        position: 'right'
    }
];

export function OnboardingTour() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
    const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        const tourCompleted = localStorage.getItem('cymbiose_tour_completed');
        if (!tourCompleted) {
            setTimeout(() => setIsOpen(true), 800);
        }
    }, []);

    const positionTooltip = useCallback(() => {
        const step = tourSteps[currentStep];
        const target = document.querySelector(step.target);

        if (!target) {
            // Fallback: center on screen
            setTooltipStyle({
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            });
            setHighlightStyle({ display: 'none' });
            return;
        }

        const rect = target.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 180;
        const gap = 16;

        // Highlight the target element
        setHighlightStyle({
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            display: 'block'
        });

        // Position tooltip based on specified position
        let top = 0;
        let left = 0;
        let arrowPos: React.CSSProperties = {};

        switch (step.position) {
            case 'right':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.right + gap;
                arrowPos = {
                    left: -8,
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    borderLeft: '1px solid #475569',
                    borderBottom: '1px solid #475569'
                };
                break;
            case 'left':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.left - tooltipWidth - gap;
                arrowPos = {
                    right: -8,
                    top: '50%',
                    transform: 'translateY(-50%) rotate(-135deg)',
                    borderLeft: '1px solid #475569',
                    borderBottom: '1px solid #475569'
                };
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                arrowPos = {
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(135deg)',
                    borderLeft: '1px solid #475569',
                    borderBottom: '1px solid #475569'
                };
                break;
            case 'top':
                top = rect.top - tooltipHeight - gap;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                arrowPos = {
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(-45deg)',
                    borderLeft: '1px solid #475569',
                    borderBottom: '1px solid #475569'
                };
                break;
        }

        // Keep tooltip in viewport
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

        setTooltipStyle({ top, left });
        setArrowStyle(arrowPos);
    }, [currentStep]);

    useEffect(() => {
        if (isOpen) {
            positionTooltip();
            window.addEventListener('resize', positionTooltip);
            window.addEventListener('scroll', positionTooltip);
            return () => {
                window.removeEventListener('resize', positionTooltip);
                window.removeEventListener('scroll', positionTooltip);
            };
        }
    }, [isOpen, currentStep, positionTooltip]);

    const nextStep = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const skipTour = () => {
        completeTour();
    };

    const completeTour = () => {
        localStorage.setItem('cymbiose_tour_completed', 'true');
        setIsOpen(false);
    };

    const restartTour = () => {
        localStorage.removeItem('cymbiose_tour_completed');
        setCurrentStep(0);
        setIsOpen(true);
    };

    if (!isOpen) {
        return (
            <button
                onClick={restartTour}
                className="fixed bottom-4 right-4 p-3 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-500 transition-all z-40 group"
                title="Take a tour"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                    Take a tour
                </span>
            </button>
        );
    }

    const step = tourSteps[currentStep];

    return (
        <>
            {/* Semi-transparent overlay with cutout for highlighted element */}
            <div className="fixed inset-0 z-40 pointer-events-none">
                <svg className="w-full h-full">
                    <defs>
                        <mask id="spotlight-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            <rect
                                x={highlightStyle.left as number || 0}
                                y={highlightStyle.top as number || 0}
                                width={highlightStyle.width as number || 0}
                                height={highlightStyle.height as number || 0}
                                rx="8"
                                fill="black"
                            />
                        </mask>
                    </defs>
                    <rect
                        x="0" y="0"
                        width="100%" height="100%"
                        fill="rgba(0,0,0,0.75)"
                        mask="url(#spotlight-mask)"
                    />
                </svg>
            </div>

            {/* Highlight border around target element */}
            <div
                className="fixed z-50 border-2 border-teal-400 rounded-lg pointer-events-none transition-all duration-300"
                style={{
                    top: highlightStyle.top,
                    left: highlightStyle.left,
                    width: highlightStyle.width,
                    height: highlightStyle.height,
                    boxShadow: '0 0 0 4px rgba(20, 184, 166, 0.3), 0 0 20px rgba(20, 184, 166, 0.4)'
                }}
            />

            {/* Tooltip positioned next to the element */}
            <div
                className="fixed z-50 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl"
                style={tooltipStyle}
            >
                {/* Arrow pointing to element */}
                <div
                    className="absolute w-4 h-4 bg-slate-800"
                    style={arrowStyle}
                />

                {/* Progress bar */}
                <div className="h-1 bg-slate-700 rounded-t-xl overflow-hidden">
                    <div
                        className="h-full bg-teal-500 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                    />
                </div>

                <div className="p-5">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-slate-400 font-medium">
                            {currentStep + 1} / {tourSteps.length}
                        </span>
                        <button
                            onClick={skipTour}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Skip
                        </button>
                    </div>

                    {/* Content */}
                    <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-5">{step.description}</p>

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className={`text-sm font-medium transition-all ${currentStep === 0
                                    ? 'text-slate-600 cursor-not-allowed'
                                    : 'text-slate-300 hover:text-white'
                                }`}
                        >
                            ← Back
                        </button>

                        <div className="flex gap-1.5">
                            {tourSteps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentStep
                                            ? 'bg-teal-400 w-3'
                                            : idx < currentStep
                                                ? 'bg-teal-600'
                                                : 'bg-slate-600'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextStep}
                            className="px-4 py-1.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-all"
                        >
                            {currentStep === tourSteps.length - 1 ? 'Done!' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
