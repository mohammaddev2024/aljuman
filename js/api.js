// js/api.js - client-side helper for communicating with the PHP API
const api = {
  getSettings: async () => {
    try {
      const res = await fetch('api/settings.php');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { console.error(e); return null; }
  },
  saveSettings: async (data) => {
    const res = await fetch('api/settings.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)});
    return await res.json();
  },
  login: async (username, password) => {
    const res = await fetch('api/login.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username,password})});
    return await res.json();
  },
  checkSession: async () => {
    const res = await fetch('api/check_session.php');
    return await res.json();
  },
  getArticles: async () => {
    const res = await fetch('api/articles.php');
    return await res.json();
  },
  createArticle: async (data) => {
    const res = await fetch('api/articles.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)});
    return await res.json();
  },
  // magazines & favorites
  getMagazines: async () => { const res = await fetch('api/magazines.php'); return await res.json(); },
  createMagazine: async (data) => { const res = await fetch('api/magazines.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)}); return await res.json(); },
  getFavorites: async () => { const res = await fetch('api/favorites.php'); return await res.json(); },
  addFavorite: async (articleId) => { const res = await fetch('api/favorites.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({articleId})}); return await res.json(); },
  removeFavorite: async (articleId) => { const res = await fetch('api/favorites.php', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({articleId})}); return await res.json(); },
};

window.api = api;
