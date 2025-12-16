/**
 * WebSocket Service
 * Handles real-time communication with the Flask backend via Socket.IO
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.connected = false;
    }

    /**
     * Connect to the WebSocket server
     */
    connect() {
        if (this.socket?.connected) {
            console.log('🔌 Socket already connected');
            return;
        }

        console.log('🔌 Connecting to WebSocket:', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.connected = true;
            this._emit('connection_status', { connected: true });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            this.connected = false;
            this._emit('connection_status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔴 WebSocket connection error:', error.message);
            this._emit('connection_status', { connected: false, error: error.message });
        });

        // Listen for transaction updates
        this.socket.on('transaction_update', (data) => {
            console.log('📨 Transaction update:', data);
            this._emit('transaction_update', data);
        });

        // Listen for balance updates
        this.socket.on('balance_update', (data) => {
            console.log('💰 Balance update:', data);
            this._emit('balance_update', data);
        });

        // Listen for fraud alerts
        this.socket.on('fraud_alert', (data) => {
            console.log('🚨 Fraud alert:', data);
            this._emit('fraud_alert', data);
        });

        // Listen for new transactions
        this.socket.on('new_transaction', (data) => {
            console.log('🆕 New transaction:', data);
            this._emit('new_transaction', data);
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            const eventListeners = this.listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(callback);
            }
        };
    }

    /**
     * Emit event to all subscribers
     * @private
     */
    _emit(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`Error in ${event} listener:`, err);
                }
            });
        }
    }

    /**
     * Send a message to the server
     * @param {string} event - Event name
     * @param {any} data - Data to send
     */
    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Cannot emit, socket not connected');
        }
    }

    /**
     * Join a room (for user-specific events)
     * @param {string} userId - User ID to join room for
     */
    joinRoom(userId) {
        this.emit('join', { user_id: userId });
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
