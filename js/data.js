// Data Management for Persian Magazine
class DataManager {
    constructor() {
        // Load whatever is in localStorage so non-admin users have content as fallback.
        this.articles = this.loadArticles();
        this.favorites = this.loadFavorites();
        this.magazines = this.loadMagazines();
        this.settings = this.loadSettings() || {};

        // small EventTarget-like helper via window events
        // notify UI that initial data (from localStorage) is ready
        try { window.dispatchEvent(new CustomEvent('dataManager:initialized', { detail: { articles: this.articles, magazines: this.magazines, settings: this.settings } })); } catch(e){}

        // Attempt to populate from server (will replace local data only when server returns non-empty arrays)
        this.syncFromServer();
    }

    initializeDefaultData() {
        // Removed local default seeding. Always rely on server-side data.
        // Keep this for backward compatibility (some callers may still invoke it).
        this.syncFromServer();
    }

    // Article Management
    getAllArticles() {
        return [...this.articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getArticleById(id) {
        return this.articles.find(article => article.id === id);
    }

    getArticlesByCategory(category) {
        if (category === 'all') return this.getAllArticles();
        return this.articles.filter(article => article.category === category)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    searchArticles(query) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return this.getAllArticles();

        return this.articles.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.author.toLowerCase().includes(searchTerm) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    addArticle(articleData) {
        const newArticle = {
            id: Date.now().toString(),
            ...articleData,
            excerpt: this.generateExcerpt(articleData.content, 200),
            createdAt: new Date().toISOString()
        };
        
        this.articles.unshift(newArticle);
        this.saveArticles();

        // Background sync to server
        try {
            fetch('api/articles.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newArticle.title,
                    author: newArticle.author,
                    authorPhoto: newArticle.authorPhoto,
                    category: newArticle.category,
                    tags: newArticle.tags,
                    content: newArticle.content
                })
            }).then(async res => {
                if (res.ok) {
                    const data = await res.json().catch(() => null);
                    if (data && data.id) {
                        // update local id to server id
                        const idx = this.articles.findIndex(a => a.id === newArticle.id);
                        if (idx !== -1) {
                            this.articles[idx].id = String(data.id);
                            this.saveArticles();
                        }
                    }
                } else {
                    console.warn('سرور: افزودن مقاله موفق نبود', res.status);
                }
            }).catch(err => console.warn('خطا در ارسال مقاله به سرور:', err));
        } catch (e) { console.warn('خطا در همگام‌سازی مقاله:', e); }

        return newArticle;
    }

    updateArticle(id, updatedData) {
        const index = this.articles.findIndex(article => article.id === id);
        if (index !== -1) {
            // Create a fresh object copying only fields we intend to change
            const existing = this.articles[index];
            const updated = Object.assign({}, existing);

            // Only copy known updatable fields to avoid accidental propagation
            const updatableFields = ['title','author','authorPhoto','category','tags','content'];
            updatableFields.forEach(f => {
                if (Object.prototype.hasOwnProperty.call(updatedData, f)) {
                    updated[f] = updatedData[f];
                }
            });

            // Recompute excerpt if content changed
            updated.excerpt = updated.content ? this.generateExcerpt(updated.content, 200) : existing.excerpt;

            // Replace single index (no shared references)
            this.articles[index] = updated;
            this.saveArticles();

            console.debug('DataManager.updateArticle:', { id, updatedAuthorPhoto: updated.authorPhoto, index });

             // Background server update (try to use numeric id if possible)
             try {
                 const payload = {
                     id: id,
                     title: this.articles[index].title,
                     author: this.articles[index].author,
                     authorPhoto: this.articles[index].authorPhoto,
                     category: this.articles[index].category,
                     tags: this.articles[index].tags,
                     content: this.articles[index].content
                 };

                 // Use PUT via fetch with body as query string for PHP parse_str handling
                 fetch('api/articles.php', {
                     method: 'PUT',
                     credentials: 'same-origin',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(payload)
                 }).then(async res => {
                     if (!res.ok) console.warn('سرور: به‌روزرسانی مقاله موفق نبود', res.status);
                 }).catch(err => console.warn('خطا در ارسال به‌روزرسانی مقاله به سرور:', err));
             } catch (e) { console.warn('خطا در همگام‌سازی به‌روزرسانی مقاله:', e); }

             return this.articles[index];
         }
         return null;
     }

    deleteArticle(id) {
        const index = this.articles.findIndex(article => article.id === id);
        if (index !== -1) {
            const deleted = this.articles.splice(index, 1)[0];
            this.saveArticles();
            // Remove from favorites if exists
            this.removeFavorite(id);

            // Background delete on server
            try {
                fetch('api/articles.php', {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `id=${encodeURIComponent(id)}`
                }).then(res => {
                    if (!res.ok) console.warn('سرور: حذف مقاله موفق نبود', res.status);
                }).catch(err => console.warn('خطا در حذف مقاله در سرور:', err));
            } catch (e) { console.warn('خطا در همگام‌سازی حذف مقاله:', e); }

            return deleted;
        }
        return null;
    }

    // Favorites Management
    getFavorites() {
        return this.favorites.map(id => this.getArticleById(id)).filter(Boolean);
    }

    addFavorite(articleId) {
        if (!this.favorites.includes(articleId)) {
            this.favorites.push(articleId);
            this.saveFavorites();

            // Sync to server if possible
            try {
                fetch('api/favorites.php', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ articleId })
                }).then(res => {
                    if (!res.ok) console.warn('سرور: افزودن علاقه‌مندی موفق نبود', res.status);
                }).catch(err => console.warn('خطا در ارسال علاقه‌مندی به سرور:', err));
            } catch (e) { console.warn('خطا در همگام‌سازی علاقه‌مندی:', e); }
        }
    }

    removeFavorite(articleId) {
        const index = this.favorites.indexOf(articleId);
        if (index !== -1) {
            this.favorites.splice(index, 1);
            this.saveFavorites();

            // Sync delete to server
            try {
                fetch('api/favorites.php', {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `articleId=${encodeURIComponent(articleId)}`
                }).then(res => {
                    if (!res.ok) console.warn('سرور: حذف علاقه‌مندی موفق نبود', res.status);
                }).catch(err => console.warn('خطا در حذف علاقه‌مندی در سرور:', err));
            } catch (e) { console.warn('خطا در همگام‌سازی حذف علاقه‌مندی:', e); }
        }
    }

    isFavorite(articleId) {
        return this.favorites.includes(articleId);
    }

    // Magazine Management
    getAllMagazines() {
        return [...this.magazines].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    }

    getMagazineById(id) {
        return this.magazines.find(magazine => magazine.id === id);
    }

    addMagazine(magazineData) {
        const newMagazine = {
            id: Date.now().toString(),
            ...magazineData,
            createdAt: new Date().toISOString()
        };
        
        this.magazines.unshift(newMagazine);
        this.saveMagazines();

        // Background sync to server
        try {
            fetch('api/magazines.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newMagazine.title,
                    month: newMagazine.month,
                    year: newMagazine.year,
                    description: newMagazine.description,
                    coverImage: newMagazine.coverImage,
                    pdfUrl: newMagazine.pdfUrl
                })
            }).then(async res => {
                if (res.ok) {
                    const data = await res.json().catch(() => null);
                    if (data && data.id) {
                        const idx = this.magazines.findIndex(m => m.id === newMagazine.id);
                        if (idx !== -1) {
                            this.magazines[idx].id = String(data.id);
                            this.saveMagazines();
                        }
                    }
                } else {
                    console.warn('سرور: افزودن مجله موفق نبود', res.status);
                }
            }).catch(err => console.warn('خطا در ارسال مجله به سرور:', err));
        } catch (e) { console.warn('خطا در همگام‌سازی مجله:', e); }

        return newMagazine;
    }

    deleteMagazine(id) {
        const index = this.magazines.findIndex(magazine => magazine.id === id);
        if (index !== -1) {
            const deleted = this.magazines.splice(index, 1)[0];
            this.saveMagazines();

            // Background delete on server
            try {
                fetch('api/magazines.php', {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `id=${encodeURIComponent(id)}`
                }).then(res => {
                    if (!res.ok) console.warn('سرور: حذف مجله موفق نبود', res.status);
                }).catch(err => console.warn('خطا در حذف مجله در سرور:', err));
            } catch (e) { console.warn('خطا در همگام‌سازی حذف مجله:', e); }

            return deleted;
        }
        return null;
    }

    // Statistics
    getStats() {
        const categoryStats = {};
        const categories = ['technology', 'art', 'culture', 'science'];
        
        categories.forEach(category => {
            categoryStats[category] = this.articles.filter(article => article.category === category).length;
        });

        return {
            totalArticles: this.articles.length,
            totalFavorites: this.favorites.length,
            totalMagazines: this.magazines.length,
            categoryStats
        };
    }

    // Category Labels
    getCategoryLabel(category) {
        const labels = {
            'technology': 'فناوری',
            'art': 'هنر',
            'culture': 'فرهنگ',
            'science': 'علم'
        };
        return labels[category] || category;
    }

    // Storage Methods
    loadArticles() {
        try {
            const stored = localStorage.getItem('persianMagazineArticles');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading articles:', error);
            return [];
        }
    }

    saveArticles() {
        try {
            localStorage.setItem('persianMagazineArticles', JSON.stringify(this.articles));
        } catch (error) {
            console.error('Error saving articles:', error);
        }
    }

    loadMagazines() {
        try {
            const stored = localStorage.getItem('persianMagazineMagazines');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading magazines:', error);
            return [];
        }
    }

    saveMagazines() {
        try {
            localStorage.setItem('persianMagazineMagazines', JSON.stringify(this.magazines));
        } catch (error) {
            console.error('Error saving magazines:', error);
        }
    }

    loadFavorites() {
        try {
            const stored = localStorage.getItem('persianMagazineFavorites');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('persianMagazineFavorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    // Settings Management
    loadSettings() {
        try {
            const stored = localStorage.getItem('persianMagazineSettings');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading settings:', error);
            return null;
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem('persianMagazineSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    getSettings() {
        let settings = this.loadSettings();
        if (!settings) {
            settings = {
                siteName: 'مجله فرهنگی نور',
                logoUrl: '',
                phone: '021-12345678',
                email: 'info@noormagazine.ir',
                social: {
                    telegram: '',
                    instagram: '',
                    twitter: '',
                    linkedin: ''
                },
                footerText: '© ۱۴۰۳ مجله فرهنگی نور'
            };
            this.saveSettings(settings);
        }
        return settings;
    }

    updateSettings(settingsData) {
        const current = this.getSettings() || {};
        const updated = {
            ...current,
            ...settingsData,
            social: {
                ...(current.social || {}),
                ...(settingsData.social || {})
            }
        };
        this.saveSettings(updated);
        // Keep an in-memory reference
        this.settings = updated;
        return updated;
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getMonthName(monthNumber) {
        const months = [
            '', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        return months[monthNumber] || '';
    }

    generateExcerpt(content, maxLength = 200) {
        const plainText = content.replace(/<[^>]*>/g, '');
        if (plainText.length <= maxLength) return plainText;
        
        return plainText.substring(0, maxLength).trim() + '...';
    }

    // Export/Import functionality for backup
    exportData() {
        return {
            articles: this.articles,
            favorites: this.favorites,
            magazines: this.magazines,
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        if (data.articles && Array.isArray(data.articles)) {
            this.articles = data.articles;
            this.saveArticles();
        }
        if (data.favorites && Array.isArray(data.favorites)) {
            this.favorites = data.favorites;
            this.saveFavorites();
        }
        if (data.magazines && Array.isArray(data.magazines)) {
            this.magazines = data.magazines;
            this.saveMagazines();
        }
    }

    // Admin Authentication
    checkAdminAuth() {
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
            const session = JSON.parse(adminSession);
            const now = new Date().getTime();
            if (now - session.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
                return true;
            } else {
                localStorage.removeItem('adminSession');
            }
        }
        return false;
    }

    adminLogin(username, password) {
        // Simple authentication - in production, use proper authentication
        if (username === 'admin' && password === 'admin123') {
            const session = {
                timestamp: new Date().getTime(),
                user: 'admin'
            };
            localStorage.setItem('adminSession', JSON.stringify(session));
            return true;
        }
        return false;
    }

    adminLogout() {
        localStorage.removeItem('adminSession');
    }

    // helper to notify UI about changes
    notifyUpdate(resource) {
        try {
            window.dispatchEvent(new CustomEvent('dataManager:update', { detail: { resource, articles: this.articles, magazines: this.magazines, settings: this.settings, favorites: this.favorites } }));
            window.dispatchEvent(new CustomEvent(`dataManager:${resource}Updated`, { detail: this[resource] }));
        } catch (e) { /* ignore */ }
    }

    // Synchronize data from server (non-blocking). Try unauthenticated GETs so regular users can view content.
    async syncFromServer() {
        try {
            const fetchOpts = { cache: 'no-store' };
            const [artsRes, magsRes, settingsRes, favsRes] = await Promise.all([
                fetch('api/articles.php', fetchOpts),
                fetch('api/magazines.php', fetchOpts),
                fetch('api/settings.php', fetchOpts),
                fetch('api/favorites.php', fetchOpts)
            ]);

            // Articles: only overwrite if server returns non-empty array
            if (artsRes && artsRes.ok) {
                const arts = await artsRes.json().catch(() => null);
                if (Array.isArray(arts) && arts.length > 0) {
                    try { localStorage.setItem('persianMagazineArticles_backup_' + Date.now(), JSON.stringify(this.articles)); } catch(e){}
                    this.articles = arts.map(a => ({ ...a }));
                    this.saveArticles();
                    this.notifyUpdate('articles');
                } // otherwise keep local articles as fallback
            }

            // Magazines
            if (magsRes && magsRes.ok) {
                const mags = await magsRes.json().catch(() => null);
                if (Array.isArray(mags) && mags.length > 0) {
                    try { localStorage.setItem('persianMagazineMagazines_backup_' + Date.now(), JSON.stringify(this.magazines)); } catch(e){}
                    this.magazines = mags.map(m => ({
                        id: String(m.id || m.ID || m.id || ''),
                        title: m.title || m.name || '',
                        month: m.month || m.month_number || m.monthNumber || 0,
                        year: m.year || m.y || '',
                        description: m.description || m.body || '',
                        coverImage: m.coverImage || m.cover_image || m.cover || '',
                        pdfUrl: m.pdfUrl || m.pdf_url || m.pdf || '',
                        createdAt: m.createdAt || m.created_at || new Date().toISOString()
                    }));
                    this.saveMagazines();
                    this.notifyUpdate('magazines');
                } // otherwise keep local magazines as fallback
            }

            // Settings
            if (settingsRes && settingsRes.ok) {
                const settings = await settingsRes.json().catch(() => null);
                if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
                    try { localStorage.setItem('persianMagazineSettings_backup_' + Date.now(), JSON.stringify(this.loadSettings())); } catch(e){}
                    const merged = this.getSettings();
                    Object.assign(merged, settings);
                    this.saveSettings(merged);
                    this.settings = merged;
                    this.notifyUpdate('settings');
                } // otherwise keep existing settings
            }

            // Favorites
            if (favsRes && favsRes.ok) {
                const favs = await favsRes.json().catch(() => null);
                if (Array.isArray(favs) && favs.length > 0) {
                    try { localStorage.setItem('persianMagazineFavorites_backup_' + Date.now(), JSON.stringify(this.favorites)); } catch(e){}
                    this.favorites = favs.map(f => {
                        if (typeof f === 'string' || typeof f === 'number') return String(f);
                        return String(f.articleId || f.article_id || f.article || f.id || '');
                    }).filter(Boolean);
                    this.saveFavorites();
                    this.notifyUpdate('favorites');
                } // otherwise keep local favorites
            }

            // final sync complete notification
            try { window.dispatchEvent(new CustomEvent('dataManager:syncComplete', { detail: { success: true } })); } catch(e){}
        } catch (e) {
            console.warn('خطا در همگام‌سازی با سرور:', e);
            try { window.dispatchEvent(new CustomEvent('dataManager:syncComplete', { detail: { success: false, error: String(e) } })); } catch(err){}
        }
    }
}

// Global data manager instance
window.dataManager = new DataManager();