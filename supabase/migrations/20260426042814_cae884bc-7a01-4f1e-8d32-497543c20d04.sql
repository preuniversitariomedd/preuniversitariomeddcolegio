UPDATE auth.users
SET encrypted_password = crypt('L097480256p', gen_salt('bf')),
    updated_at = now()
WHERE email = '0930620109@medd.local';