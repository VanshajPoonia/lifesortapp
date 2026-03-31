ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_source VARCHAR(32) DEFAULT 'manual';

UPDATE users
SET subscription_source = 'manual'
WHERE is_subscribed = true
  AND (subscription_source IS NULL OR subscription_source = '');
