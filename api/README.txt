Upload instructions:

1. Export DB schema file `noormagazine_schema.sql` to your hosting phpMyAdmin and run it to create tables.
2. Upload the `api/` folder to your web root on the shared host.
3. Edit `api/config.php` with your database credentials (DB_HOST, DB_NAME, DB_USER, DB_PASS).
4. Run `api/create_admin.php` once in browser to create the initial admin (username: admin, password: admin123) then remove that file.
5. Ensure PHP sessions are enabled and site uses HTTPS.

Files included in this folder:
- config.php
- create_admin.php
- login.php
- check_session.php
- settings.php
- articles.php
- magazines.php
- favorites.php

Client-side helper:
- js/api.js (to be placed in js/)

If you want I can also generate a DB SQL file content that you can paste into phpMyAdmin; tell me when you're ready.
