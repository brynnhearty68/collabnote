/**
 * sync.js — Real-time collaboration engine for CollabNote
 * Uses Firebase Realtime Database for live sync across devices
 */

const FIREBASE_CONFIG = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    databaseURL: "YOUR_FIREBASE_DATABASE_URL",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
};

const Sync = {
    db: null,
    roomRef: null,
    sessionId: null,
    currentNickname: 'Guest',
    currentRoomCode: null,
    isHost: false,
    onUpdateCallback: null,
    onPresenceCallback: null,

    // ── Init ──────────────────────────────────────────────

    async init() {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            this.db = firebase.database();
            this.sessionId = this.sessionId || this._genSessionId();
            console.log('[Sync] Firebase ready, session:', this.sessionId);
            return true;
        } catch (e) {
            console.error('[Sync] Firebase init failed:', e);
            return false;
        }
    },

    // ── Host: Create a room ───────────────────────────────

    async createRoom(notes) {
        if (!this.db) {
            const ok = await this.init();
            if (!ok) return null;
        }
        const code = this._genCode();
        this.currentRoomCode = code;
        this.isHost = true;

        const roomData = {
            code,
            hostId: this.sessionId,
            notes: this._serialize(notes),
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };

        try {
            await this.db.ref(`collabnote/${code}`).set(roomData);
            this.roomRef = this.db.ref(`collabnote/${code}`);
            this._listenPresence(code);
            this._listenChanges(code);
            console.log('[Sync] Room created:', code);
            return code;
        } catch (e) {
            console.error('[Sync] createRoom failed:', e);
            this.currentRoomCode = null;
            this.isHost = false;
            return null;
        }
    },

    // ── Guest: Join a room ────────────────────────────────

    async joinRoom(code, nickname) {
        if (!this.db) {
            const ok = await this.init();
            if (!ok) return null;
        }
        try {
            const snap = await this.db.ref(`collabnote/${code}`).once('value');
            if (!snap.exists()) {
                console.warn('[Sync] Room not found:', code);
                return null;
            }
            const roomData = snap.val();
            this.currentNickname = this._sanitizeNickname(nickname);
            this.currentRoomCode = code;
            this.isHost = false;
            this.roomRef = this.db.ref(`collabnote/${code}`);
            this._listenPresence(code);
            this._listenChanges(code);
            console.log('[Sync] Joined room:', code);
            return roomData.notes;
        } catch (e) {
            console.error('[Sync] joinRoom failed:', e);
            return null;
        }
    },

    // ── Push notes update ─────────────────────────────────

    async pushUpdate(notes) {
        if (!this.roomRef) return;
        try {
            await this.roomRef.update({
                notes: this._serialize(notes),
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                lastEditBy: this.sessionId
            });
        } catch (e) {
            console.warn('[Sync] Push failed:', e);
        }
    },

    // ── Listen for remote changes ─────────────────────────

    _listenChanges(code) {
        this.db.ref(`collabnote/${code}`).on('value', (snap) => {
            if (!snap.exists()) return;
            const data = snap.val();
            if (data.lastEditBy === this.sessionId) return;
            if (this.onUpdateCallback && data.notes) {
                this.onUpdateCallback(data.notes);
            }
        });
    },

    // ── Presence ──────────────────────────────────────────

    _announcePresence(code) {
        if (!this.db) return;
        const myRef = this.db.ref(`collabnote/${code}/presence/${this.sessionId}`);
        myRef.set({
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            active: true,
            nickname: this.currentNickname || 'Guest'
        });
        myRef.onDisconnect().remove();
    },

    _listenPresence(code) {
        this._announcePresence(code);
        this.db.ref(`collabnote/${code}/presence`).on('value', (snap) => {
            const count = snap.exists() ? Object.keys(snap.val()).length : 1;
            if (this.onPresenceCallback) this.onPresenceCallback(count);
        });
    },

    // ── Leave room ────────────────────────────────────────

    async leaveRoom() {
        if (!this.db || !this.currentRoomCode) return;
        try {
            await this.db.ref(`collabnote/${this.currentRoomCode}/presence/${this.sessionId}`).remove();
            this.db.ref(`collabnote/${this.currentRoomCode}`).off();
            this.db.ref(`collabnote/${this.currentRoomCode}/presence`).off();
        } catch (e) { /* silent */ }
        this.roomRef = null;
        this.currentRoomCode = null;
        this.isHost = false;
    },

    // ── Helpers ───────────────────────────────────────────

    _genCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    _genSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },

    _serialize(notes) {
        return JSON.parse(JSON.stringify({ data: notes, _lastEditBy: this.sessionId }));
    },

    _sanitizeNickname(nickname) {
        const clean = String(nickname || '').trim().slice(0, 24);
        return clean || 'Guest';
    },

    onUpdate(cb) { this.onUpdateCallback = cb; },
    onPresence(cb) { this.onPresenceCallback = cb; }
};
