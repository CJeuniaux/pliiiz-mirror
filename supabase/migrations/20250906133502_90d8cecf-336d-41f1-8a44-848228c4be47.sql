-- Enable pgcrypto for cryptographic functions used in triggers (gen_random_bytes)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;