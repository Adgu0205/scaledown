/**
 * AI Service Layer
 * Centralizes all calls to the backend AI endpoints.
 * 
 * Note: These functions call the internal backend API, which in turn calls OpenRouter/LLMs.
 */

// Default to relative if no env var is found (for local/proxy scenarios)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Generates a personalized workout plan.
 * @param {Object} userContext - User data and context for generation.
 * @returns {Promise<Object>} - The generated workout plan.
 */
export const generateWorkout = async (userContext) => {
    const response = await fetch(`${API_BASE_URL}/workout-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userContext)
    });
    if (!response.ok) throw new Error('Failed to generate workout plan');
    return await response.json();
};

/**
 * Generates a nutrition plan.
 * @param {Object} userContext - User data and dietary preferences.
 * @returns {Promise<Object>} - The generated nutrition plan.
 */
export const generateNutrition = async (userContext) => {
    const response = await fetch(`${API_BASE_URL}/nutrition-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userContext)
    });
    if (!response.ok) throw new Error('Failed to generate nutrition plan');
    return await response.json();
};

/**
 * Generates sleep insights based on history and baseline.
 * @param {Object} userContext - Sleep data and history.
 * @returns {Promise<Object>} - The generated sleep insight.
 */
export const generateSleepInsight = async (userContext) => {
    const response = await fetch(`${API_BASE_URL}/sleep-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userContext)
    });
    if (!response.ok) throw new Error('Failed to generate sleep insight');
    return await response.json();
};

/**
 * Generates a health summary/dashboard insights.
 * @param {Object} userContext - Aggregated user health data.
 * @returns {Promise<Object>} - The generated dashboard insights.
 */
export const generateHealthSummary = async (userContext) => {
    const response = await fetch(`${API_BASE_URL}/dashboard-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userContext)
    });
    if (!response.ok) throw new Error('Failed to generate health summary');
    return await response.json();
};

/**
 * Generates a doctor report summary.
 * @param {Object} params - Parameters including time range and user context.
 * @returns {Promise<Object>} - The generated report object.
 */
export const summarizeDoctorReport = async (params) => {
    const response = await fetch(`${API_BASE_URL}/doctor-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error('Failed to generate doctor report');
    return await response.json();
};
