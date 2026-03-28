class CollabNoteApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('collabnote-notes')) || [];
        this.activeNoteId = null;
        this.isDarkTheme = localStorage.getItem('collabnote-theme') !== 'light';
        this.isCollaborating = false;
        this._syncDebounce = null;

        // DOM Elements
        this.notesList = document.getElementById('notes-list');
        this.noteTitle = document.getElementById('note-title');
        this.noteContent = document.getElementById('note-content');
        this.noteTimestamp = document.getElementById('note-timestamp');
        this.wordCount = document.getElementById('word-count');
        this.searchInput = document.getElementById('search-input');
        this.sidebar = document.querySelector('.sidebar');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');
        this.emptyState = document.getElementById('empty-state');
        this.editorContainer = document.querySelector('.editor-container');

        // Collab elements
        this.collabBar = document.getElementById('collab-bar');
        this.collabStatus = document.getElementById('collab-status');
        this.collabCount = document.getElementById('collab-count');

        // Modal elements
        this.collabModal = document.getElementById('collab-modal');
        this.modalError = document.getElementById('modal-error');
        this.sharePanel = document.getElementById('share-panel');

        // Buttons
        this.newNoteBtn = document.getElementById('new-note-btn');
        this.deleteNoteBtn = document.getElementById('delete-note-btn');
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = document.getElementById('theme-icon');
        this.menuToggle = document.getElementById('menu-toggle');
        this.collabBtn = document.getElementById('collab-btn');

        this.init();
    }

    init() {
        // Core events
        this.newNoteBtn.addEventListener('click', () => {
            this.createNewNote();
            this.closeSidebar();
        });
        this.deleteNoteBtn.addEventListener('click', () => this.deleteActiveNote());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        this.noteTitle.addEventListener('input', () => this.onNoteEdit());
        this.noteContent.addEventListener('input', () => this.onNoteEdit());
        this.searchInput.addEventListener('input', (e) => this.renderNotesList(e.target.value));

        // Collab events
        this.collabBtn.addEventListener('click', () => this.openCollabModal());
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closeCollabModal());
        document.getElementById('leave-room-btn').addEventListener('click', () => this.leaveRoom());
        document.getElementById('create-room-btn').addEventListener('click', () => this.createRoom());
        document.getElementById('join-room-btn').addEventListener('click', () => this.joinRoom());
        document.getElementById('copy-code-btn').addEventListener('click', () => this.copyRoomCode());
        document.getElementById('copy-link-btn').addEventListener('click', () => this.copyShareLink());

        // Modal tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Close modal on overlay click
        this.collabModal.addEventListener('click', (e) => {
            if (e.target === this.collabModal) this.closeCollabModal();
        });

        // Sync callbacks
        Sync.onUpdate((data) => this.onRemoteUpdate(data));
        Sync.onPresence((count) => this.onPresenceUpdate(count));

        // Load saved nickname
        const savedNick = localStorage.getItem('collabnote-nickname') || '';
        document.getElementById('host-nickname').value = savedNick;
        document.getElementById('join-nickname').value = savedNick;

        // Check for room code in URL
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        if (roomCode) {
            document.getElementById('room-code-input').value = roomCode;
            this.openCollabModal();
            this.switchTab('join');
        }

        // Initial setup
        this.applyTheme();
        this.renderNotesList();

        if (this.notes.length > 0) {
            this.setActiveNote(this.notes[0].id);
        } else {
            this.showEmptyState();
        }
    }

    // ── Core Operations ───────────────────────────────────

    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            timestamp: new Date().toISOString()
        };

        this.notes.unshift(newNote);
        this.saveToStorage();
        this.renderNotesList();
        this.setActiveNote(newNote.id);
        this.noteTitle.focus();
    }

    setActiveNote(id) {
        this.activeNoteId = id;
        const note = this.notes.find(n => n.id === id);

        if (note) {
            this.noteTitle.value = note.title;
            this.noteContent.value = note.content;
            this.updateTimestamp(note.timestamp);
            this.updateWordCount(note.content);
            this.editorContainer.classList.remove('hidden');
            this.emptyState.classList.add('hidden');
            this.renderNotesList();
            this.closeSidebar();
        }
    }

    onNoteEdit() {
        this.saveActiveNote();
        if (this.isCollaborating) {
            clearTimeout(this._syncDebounce);
            this._syncDebounce = setTimeout(() => {
                Sync.pushUpdate(this.notes);
            }, 300);
        }
    }

    saveActiveNote() {
        if (!this.activeNoteId) return;

        const noteIndex = this.notes.findIndex(n => n.id === this.activeNoteId);
        if (noteIndex !== -1) {
            this.notes[noteIndex].title = this.noteTitle.value;
            this.notes[noteIndex].content = this.noteContent.value;
            this.notes[noteIndex].timestamp = new Date().toISOString();

            const [updatedNote] = this.notes.splice(noteIndex, 1);
            this.notes.unshift(updatedNote);

            this.saveToStorage();
            this.updateWordCount(updatedNote.content);
            this.updateTimestamp(updatedNote.timestamp);
            this.renderNotesList();
        }
    }

    deleteActiveNote() {
        if (!this.activeNoteId) return;

        if (confirm('Delete this note?')) {
            this.notes = this.notes.filter(n => n.id !== this.activeNoteId);
            this.saveToStorage();

            if (this.notes.length > 0) {
                this.setActiveNote(this.notes[0].id);
            } else {
                this.activeNoteId = null;
                this.showEmptyState();
            }
            this.renderNotesList();

            if (this.isCollaborating) {
                Sync.pushUpdate(this.notes);
            }
        }
    }

    // ── Collaboration ─────────────────────────────────────

    openCollabModal() {
        this.collabModal.classList.remove('hidden');
        this.modalError.classList.add('hidden');
        // Reset to create tab, hide share panel
        this.switchTab('create');
        this.sharePanel.classList.remove('active');
        lucide.createIcons();
    }

    closeCollabModal() {
        this.collabModal.classList.add('hidden');
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
        this.modalError.classList.add('hidden');
    }

    async createRoom() {
        const nickname = document.getElementById('host-nickname').value.trim();
        if (!nickname) {
            this.showModalError('Please enter a nickname.');
            return;
        }

        localStorage.setItem('collabnote-nickname', nickname);
        Sync.currentNickname = nickname;

        const btn = document.getElementById('create-room-btn');
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Creating...';

        const code = await Sync.createRoom(this.notes);

        btn.disabled = false;
        btn.querySelector('span').textContent = 'Create Room';

        if (!code) {
            this.showModalError('Failed to create room. Check your connection.');
            return;
        }

        this.isCollaborating = true;
        this.showCollabBar();

        // Show share panel
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        this.sharePanel.classList.add('active');

        // Display room code
        document.getElementById('room-code-label').textContent = code;

        // Generate QR code
        const qrEl = document.getElementById('qr-code');
        qrEl.innerHTML = '';
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
        new QRCode(qrEl, {
            text: shareUrl,
            width: 160,
            height: 160,
            colorDark: '#1a1a2e',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });

        lucide.createIcons();
    }

    async joinRoom() {
        const nickname = document.getElementById('join-nickname').value.trim();
        const code = document.getElementById('room-code-input').value.trim();

        if (!nickname) {
            this.showModalError('Please enter a nickname.');
            return;
        }
        if (!code || code.length !== 6) {
            this.showModalError('Please enter a valid 6-digit room code.');
            return;
        }

        localStorage.setItem('collabnote-nickname', nickname);

        const btn = document.getElementById('join-room-btn');
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Joining...';

        const remoteNotes = await Sync.joinRoom(code, nickname);

        btn.disabled = false;
        btn.querySelector('span').textContent = 'Join Room';

        if (!remoteNotes) {
            this.showModalError('Room not found. Check the code and try again.');
            return;
        }

        // Load remote notes
        if (remoteNotes.data) {
            this.notes = remoteNotes.data;
            this.saveToStorage();
            this.renderNotesList();
            if (this.notes.length > 0) {
                this.setActiveNote(this.notes[0].id);
            } else {
                this.showEmptyState();
            }
        }

        this.isCollaborating = true;
        this.showCollabBar();
        this.closeCollabModal();

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    }

    async leaveRoom() {
        await Sync.leaveRoom();
        this.isCollaborating = false;
        this.collabBar.classList.add('hidden');
    }

    onRemoteUpdate(data) {
        if (!data || !data.data) return;
        this.notes = data.data;
        this.saveToStorage();
        this.renderNotesList();

        // Refresh editor if the active note was updated
        if (this.activeNoteId) {
            const note = this.notes.find(n => n.id === this.activeNoteId);
            if (note) {
                this.noteTitle.value = note.title;
                this.noteContent.value = note.content;
                this.updateTimestamp(note.timestamp);
                this.updateWordCount(note.content);
            }
        }
    }

    onPresenceUpdate(count) {
        this.collabCount.textContent = count;
        this.collabStatus.textContent = count > 1 ? `${count} online` : 'Connected';
    }

    showCollabBar() {
        this.collabBar.classList.remove('hidden');
        lucide.createIcons();
    }

    showModalError(msg) {
        this.modalError.textContent = msg;
        this.modalError.classList.remove('hidden');
    }

    copyRoomCode() {
        const code = Sync.currentRoomCode;
        if (code) {
            navigator.clipboard.writeText(code);
            const btn = document.getElementById('copy-code-btn');
            btn.title = 'Copied!';
            setTimeout(() => { btn.title = 'Copy Code'; }, 2000);
        }
    }

    copyShareLink() {
        const code = Sync.currentRoomCode;
        if (code) {
            const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
            navigator.clipboard.writeText(url);
            const btn = document.getElementById('copy-link-btn');
            btn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => { btn.querySelector('span').textContent = 'Copy Share Link'; }, 2000);
        }
    }

    // ── UI Helpers ────────────────────────────────────────

    showEmptyState() {
        this.noteTitle.value = '';
        this.noteContent.value = '';
        this.editorContainer.classList.add('hidden');
        this.emptyState.classList.remove('hidden');
        this.noteTimestamp.textContent = '';
        this.wordCount.textContent = '';
    }

    renderNotesList(filter = '') {
        this.notesList.innerHTML = '';

        const filteredNotes = this.notes.filter(note =>
            note.title.toLowerCase().includes(filter.toLowerCase()) ||
            note.content.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredNotes.length === 0 && filter) {
            this.notesList.innerHTML = '<div class="note-item" style="text-align:center;cursor:default;color:var(--text-tertiary)">No matching notes</div>';
            return;
        }

        filteredNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item ${note.id === this.activeNoteId ? 'active' : ''}`;

            const title = note.title || 'Untitled Note';
            const preview = note.content || 'No content yet...';
            const date = new Date(note.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

            noteItem.innerHTML = `
                <h3>${this.escapeHtml(title)}</h3>
                <p>${this.escapeHtml(preview)}</p>
                <span class="note-date">${date}</span>
            `;

            noteItem.addEventListener('click', () => this.setActiveNote(note.id));
            this.notesList.appendChild(noteItem);
        });
    }

    updateWordCount(text) {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        this.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    }

    updateTimestamp(isoDate) {
        const date = new Date(isoDate);
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        this.noteTimestamp.textContent = date.toLocaleDateString(undefined, options);
    }

    // ── Theme ─────────────────────────────────────────────

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
        this.sidebarOverlay.classList.toggle('active');
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.sidebarOverlay.classList.remove('active');
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
        localStorage.setItem('collabnote-theme', this.isDarkTheme ? 'dark' : 'light');
    }

    applyTheme() {
        if (this.isDarkTheme) {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
            this.themeIcon.setAttribute('data-lucide', 'moon');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            this.themeIcon.setAttribute('data-lucide', 'sun');
        }
        if (window.lucide) lucide.createIcons();
    }

    saveToStorage() {
        localStorage.setItem('collabnote-notes', JSON.stringify(this.notes));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CollabNoteApp();
});
