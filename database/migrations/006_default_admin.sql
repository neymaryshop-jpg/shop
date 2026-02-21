-- Create default admin user if not exists
INSERT INTO users (id, email, password_hash, full_name, is_active, is_verified) VALUES
(1, 'admin@neymaryshop.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKYbF3Qe.Rl6L7K', 'Administrator', true, true)
ON CONFLICT (id) DO NOTHING;

-- Assign admin role to user
INSERT INTO admin_roles (user_id, role_name, permissions) VALUES
(1, 'super_admin', '{"can_manage": true, "level": 100}')
ON CONFLICT (user_id) DO NOTHING;

-- Default admin credentials:
-- Email: admin@neymaryshop.com
-- Password: admin123