-- Admin sessions table for admin authentication
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Create default admin user if not exists
INSERT INTO users (id, email, password_hash, full_name, is_active, is_verified) VALUES
(1, 'admin@neymaryshop.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKYbF3Qe.Rl6L7K', 'Administrator', true, true)
ON CONFLICT (id) DO NOTHING;

-- Assign admin role to user
INSERT INTO admin_roles (user_id, role_name, permissions) VALUES
(1, 'super_admin', '{"can_manage": true, "level": 100}')
ON CONFLICT (user_id) DO NOTHING;