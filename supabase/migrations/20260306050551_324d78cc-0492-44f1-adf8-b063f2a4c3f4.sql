
-- Create admin user in auth.users
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000000',
  '0930620109@medd.local',
  crypt('L097480256p', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated',
  now(),
  now(),
  ''
);

-- Create admin profile
INSERT INTO profiles (id, cedula, nombre, apellidos, password_changed) VALUES
('00000000-0000-0000-0000-000000000099', '0930620109', 'Admin', 'MEDD', true);

-- Create admin role
INSERT INTO user_roles (user_id, rol, activo) VALUES
('00000000-0000-0000-0000-000000000099', 'admin', true);
