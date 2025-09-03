Deployment checklist

1. Upload `noormagazine_schema.sql` to phpMyAdmin and execute it to create the database and tables.
2. Upload the `api/` folder contents to your web root.
3. Edit `api/config.php` to set $dbUser and $dbPass to your DB credentials. If your host uses a different DB host, update $dbHost.
4. Make sure PHP version >= 7.2 and PDO extension enabled.
5. Visit `https://yourdomain.com/api/create_admin.php` once to create the initial admin user. Then delete that file.
6. Upload `js/api.js` to `js/` on your site.
7. Update front-end code to use `window.api` instead of localStorage (I can help update `js/data.js` to progressively switch).

Security notes
- Use HTTPS.
- Remove or protect create_admin.php after use.
- Consider adding rate limiting and CSRF protections.
