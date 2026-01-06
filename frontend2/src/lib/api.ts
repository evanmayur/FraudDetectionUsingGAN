/**
 * API Service Layer
 * Centralized API client for communicating with the Flask backend.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
    }
);

// ============================================================================
// Auth API
// ============================================================================

export const authAPI = {
    /**
     * Register a new user with Firebase credentials
     */
    register: async (firebaseUid: string, email: string, displayName: string, phoneNumber: string | null = null) => {
        const { data } = await api.post('/api/auth/register', {
            firebase_uid: firebaseUid,
            email,
            display_name: displayName,
            phone_number: phoneNumber,
        });
        return data;
    },

    /**
     * Get current authenticated user's info
     */
    getMe: async () => {
        const { data } = await api.get('/api/auth/me');
        return data;
    },
};

// ============================================================================
// User API
// ============================================================================

export const userAPI = {
    /**
     * Lookup user by UPI ID (for recipient verification)
     */
    lookupByUpi: async (upiId: string) => {
        const { data } = await api.get(`/api/users/${encodeURIComponent(upiId)}`);
        return data;
    },

    /**
     * Get current user's balance
     */
    getBalance: async () => {
        const { data } = await api.get('/api/users/balance');
        return data;
    },

    /**
     * Update current user's profile
     */
    updateProfile: async (profileData: any) => {
        const { data } = await api.put('/api/users/profile', profileData);
        return data;
    },
};

// ============================================================================
// Transaction API
// ============================================================================

export const transactionAPI = {
    /**
     * Send a transaction
     */
    send: async (receiverUpiId: string, amount: number, description: string = '') => {
        const { data } = await api.post('/api/transactions/send', {
            receiver_upi_id: receiverUpiId,
            amount,
            description,
        });
        return data;
    },

    /**
     * Get transaction history
     */
    getHistory: async (page: number = 1, perPage: number = 20, status: string | null = null) => {
        const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
        if (status) params.append('status', status);

        const { data } = await api.get(`/api/transactions/history?${params}`);
        return data;
    },

    /**
     * Get single transaction details
     */
    getDetails: async (transactionRef: string) => {
        const { data } = await api.get(`/api/transactions/${transactionRef}`);
        return data;
    },
};

// ============================================================================
// Demo Recipients (from old endpoint) 
// ============================================================================

export const demoAPI = {
    /**
     * Get demo recipients for testing
     */
    getDemoRecipients: async () => {
        const { data } = await api.get('/api/recipients/demo');
        return data;
    },
};

// ============================================================================
// Admin API
// ============================================================================

export const adminAPI = {
    /**
     * Get fraud alerts
     */
    getAlerts: async (page: number = 1, perPage: number = 20, includeReviewed: boolean = false) => {
        const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString(), reviewed: includeReviewed.toString() });
        const { data } = await api.get(`/api/admin/alerts?${params}`);
        return data;
    },

    /**
     * Review a fraud alert
     */
    reviewAlert: async (alertId: number, notes: string = '', action: string = 'reviewed') => {
        const { data } = await api.put(`/api/admin/alerts/${alertId}/review`, { notes, action });
        return data;
    },

    /**
     * Get admin stats
     */
    getStats: async () => {
        const { data } = await api.get('/api/admin/stats');
        return data;
    },

    /**
     * Suspend a user
     */
    suspendUser: async (userId: number) => {
        const { data } = await api.post(`/api/admin/users/${userId}/suspend`);
        return data;
    },
};

export default api;
