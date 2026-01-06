/**
 * Auth Context Provider
 * Manages authentication state across the React app.
 * Simplified version for demo mode only.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from '../lib/api';

interface User {
    uid: string;
    email: string;
    displayName: string;
}

interface UserProfile {
    id: number;
    upi_id: string;
    display_name: string;
    email: string;
    account_balance: number;
    is_admin: boolean;
}

interface Balance {
    balance: number;
    daily_limit: number;
    daily_spent: number;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    isDemoMode: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
    useDemoMode: () => Promise<void>;
    refreshProfile: () => Promise<UserProfile | null>;
    getBalance: () => Promise<Balance | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);

    const isAuthenticated = () => !!user || !!localStorage.getItem('authToken');

    // Load user profile from API
    const loadUserProfile = async (): Promise<UserProfile | null> => {
        try {
            const response = await authAPI.getMe();
            if (response.status === 'success') {
                setUserProfile(response.data.user);
                return response.data.user;
            }
        } catch (err: any) {
            console.error('Failed to load user profile:', err);
            // Only clear token if it's NOT a demo token
            if ((err.response?.status === 401 || err.response?.status === 403) && !isDemoMode) {
                localStorage.removeItem('authToken');
            }
        }
        return null;
    };

    // Auto-activate demo mode on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('🔐 Auto-activating demo mode...');
                localStorage.setItem('authToken', 'demo-token');
                setIsDemoMode(true);
                setUser({ uid: 'demo', email: 'demo@example.com', displayName: 'Demo User' });
                await loadUserProfile();
            } else if (token === 'demo-token') {
                console.log('🔐 Demo mode detected');
                setIsDemoMode(true);
                setUser({ uid: 'demo', email: 'demo@example.com', displayName: 'Demo User' });
                await loadUserProfile();
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    // Listen for logout events from API interceptor
    useEffect(() => {
        const handleLogout = () => {
            if (!isDemoMode) {
                setUser(null);
                setUserProfile(null);
            }
        };

        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, [isDemoMode]);

    // Sign out
    const signOut = async () => {
        try {
            localStorage.removeItem('authToken');
            setUser(null);
            setUserProfile(null);
            setIsDemoMode(false);
        } catch (err) {
            console.error('Sign out error:', err);
        }
    };

    // Use demo mode (for testing without Firebase)
    const useDemoMode = async () => {
        console.log('🔐 Activating demo mode...');
        localStorage.setItem('authToken', 'demo-token');
        setIsDemoMode(true);
        setUser({ uid: 'demo', email: 'demo@example.com', displayName: 'Demo User' });
        await loadUserProfile();
        setLoading(false);
    };

    // Refresh user profile
    const refreshProfile = async (): Promise<UserProfile | null> => {
        return loadUserProfile();
    };

    // Get balance
    const getBalance = async (): Promise<Balance | null> => {
        try {
            const response = await userAPI.getBalance();
            if (response.status === 'success') {
                return response.data;
            }
        } catch (err) {
            console.error('Failed to get balance:', err);
            // Fallback for demo mode if backend is unreachable or DB is empty
            if (isDemoMode || localStorage.getItem('authToken') === 'demo-token') {
                console.log('⚠️ Using demo fallback balance');
                return {
                    balance: 150000.00,
                    daily_limit: 100000.00,
                    daily_spent: 0.00,
                };
            }
        }
        return null;
    };

    const value: AuthContextType = {
        user,
        userProfile,
        loading,
        error,
        isDemoMode,
        isAuthenticated: isAuthenticated(),
        isAdmin: userProfile?.is_admin || false,
        signOut,
        useDemoMode,
        refreshProfile,
        getBalance,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
