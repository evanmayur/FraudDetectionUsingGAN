/**
 * Auth Context Provider
 * Manages authentication state across the React app.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../components/logic/firebase';
import { socketService } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);

    // Initialize socket connection
    useEffect(() => {
        if (isAuthenticated()) {
            socketService.connect();
            if (userProfile?.id) {
                socketService.joinRoom(userProfile.id);
            }
        }
        return () => socketService.disconnect();
    }, [user, isDemoMode, userProfile?.id]);

    const isAuthenticated = () => !!user || !!localStorage.getItem('authToken');

    // Load user profile from API
    const loadUserProfile = async () => {
        try {
            const response = await authAPI.getMe();
            if (response.status === 'success') {
                setUserProfile(response.data.user);
                // Connect socket with user info
                if (!socketService.isConnected()) {
                    socketService.connect();
                }
                return response.data.user;
            }
        } catch (err) {
            console.error('Failed to load user profile:', err);
            // Only clear token if it's NOT a demo token
            if ((err.response?.status === 401 || err.response?.status === 403) && !isDemoMode) {
                localStorage.removeItem('authToken');
                socketService.disconnect();
            }
        }
        return null;
    };

    // Check for existing demo token on mount
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token === 'demo-token') {
            console.log('🔐 Demo mode detected');
            setIsDemoMode(true);
            setUser({ uid: 'demo', email: 'demo@example.com', displayName: 'Demo User' });
            loadUserProfile().then(() => {
                setLoading(false);
                socketService.connect();
            });
        }
    }, []);

    // Handle Firebase auth state changes (only if not in demo mode)
    useEffect(() => {
        // Skip Firebase auth if in demo mode
        if (isDemoMode) {
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            setError(null);

            // Check if demo token exists - don't override it
            const existingToken = localStorage.getItem('authToken');
            if (existingToken === 'demo-token') {
                setIsDemoMode(true);
                setUser({ uid: 'demo', email: 'demo@example.com', displayName: 'Demo User' });
                await loadUserProfile();
                setLoading(false);
                socketService.connect();
                return;
            }

            if (firebaseUser) {
                try {
                    // Get Firebase ID token
                    const idToken = await firebaseUser.getIdToken();
                    localStorage.setItem('authToken', idToken);

                    setUser(firebaseUser);
                    socketService.connect();

                    // Try to load existing user profile
                    let profile = await loadUserProfile();

                    // If no profile exists, register the user
                    if (!profile) {
                        try {
                            const registerResponse = await authAPI.register(
                                firebaseUser.uid,
                                firebaseUser.email,
                                firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                                firebaseUser.phoneNumber
                            );

                            if (registerResponse.status === 'success') {
                                profile = registerResponse.data.user;
                                setUserProfile(profile);
                            }
                        } catch (regErr) {
                            console.error('Registration failed:', regErr);
                            setError('Failed to register user');
                        }
                    }
                } catch (err) {
                    console.error('Auth error:', err);
                    setError('Authentication failed');
                    socketService.disconnect();
                }
            } else {
                // User logged out - but DON'T clear if demo mode
                if (!isDemoMode && localStorage.getItem('authToken') !== 'demo-token') {
                    setUser(null);
                    setUserProfile(null);
                    localStorage.removeItem('authToken');
                    socketService.disconnect();
                }
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [isDemoMode]);

    // Global Event Listeners
    useEffect(() => {
        if (!isAuthenticated()) return;

        const handleUpdate = () => {
            console.log('🔄 Global update - refreshing profile');
            loadUserProfile();
        };

        const unsubscribeTx = socketService.subscribe('transaction_update', handleUpdate);
        const unsubscribeNew = socketService.subscribe('new_transaction', handleUpdate);

        return () => {
            unsubscribeTx();
            unsubscribeNew();
        };
    }, [user, isDemoMode]);

    // Listen for logout events from API interceptor
    useEffect(() => {
        const handleLogout = () => {
            if (!isDemoMode) {
                setUser(null);
                setUserProfile(null);
                socketService.disconnect();
            }
        };

        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, [isDemoMode]);

    // Sign out
    const signOut = async () => {
        try {
            if (!isDemoMode) {
                await firebaseSignOut(auth);
            }
            localStorage.removeItem('authToken');
            setUser(null);
            setUserProfile(null);
            setIsDemoMode(false);
            socketService.disconnect();
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
        socketService.connect();
    };

    // Refresh user profile
    const refreshProfile = async () => {
        return loadUserProfile();
    };

    // Get balance
    const getBalance = async () => {
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

    const value = {
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
        socketService,  // Export socket service
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

