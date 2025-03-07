/*
  # Fix games table and ensure data is properly seeded

  1. Fixes
    - Ensure games table exists
    - Ensure proper indices for game search
    - Re-seed popular games data
*/

-- Make sure games table exists
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  cover_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create indices for better search performance
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
CREATE INDEX IF NOT EXISTS idx_games_name_lower ON games(LOWER(name));

-- Make sure policies exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'games' 
    AND policyname = 'Anyone can view games'
  ) THEN
    CREATE POLICY "Anyone can view games"
      ON games
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'games' 
    AND policyname = 'Admins can manage games'
  ) THEN
    CREATE POLICY "Admins can manage games"
      ON games
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Re-seed popular games with ON CONFLICT DO UPDATE to ensure data is fresh
INSERT INTO games (name, slug, cover_url)
VALUES
  ('Valorant', 'valorant', 'https://images.unsplash.com/photo-1624085568108-36410cfe4d24?w=400'),
  ('Counter-Strike 2', 'counter-strike-2', 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400'),
  ('Apex Legends', 'apex-legends', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400'),
  ('Fortnite', 'fortnite', 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=400'),
  ('Call of Duty: Warzone', 'call-of-duty-warzone', 'https://images.unsplash.com/photo-1621364525332-f9c381f3bfe8?w=400'),
  ('League of Legends', 'league-of-legends', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'),
  ('Dota 2', 'dota-2', 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400'),
  ('Overwatch 2', 'overwatch-2', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'),
  ('Minecraft', 'minecraft', 'https://images.unsplash.com/photo-1587573089734-599851b2c3b5?w=400'),
  ('Grand Theft Auto V', 'grand-theft-auto-v', 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=400'),
  ('Elden Ring', 'elden-ring', 'https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=400'),
  ('Cyberpunk 2077', 'cyberpunk-2077', 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400'),
  ('Baldur''s Gate 3', 'baldurs-gate-3', 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400'),
  ('Starfield', 'starfield', 'https://images.unsplash.com/photo-1581822261290-991b38693d1b?w=400'),
  ('Diablo IV', 'diablo-iv', 'https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=400'),
  ('World of Warcraft', 'world-of-warcraft', 'https://images.unsplash.com/photo-1569242840510-5a1fec0be889?w=400'),
  ('Destiny 2', 'destiny-2', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400'),
  ('Rainbow Six Siege', 'rainbow-six-siege', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400'),
  ('FIFA 24', 'fifa-24', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400'),
  ('NBA 2K24', 'nba-2k24', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'),
  ('Rocket League', 'rocket-league', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400'),
  ('Roblox', 'roblox', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'),
  ('Among Us', 'among-us', 'https://images.unsplash.com/photo-1603481546238-487240415921?w=400'),
  ('Genshin Impact', 'genshin-impact', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'),
  ('Palworld', 'palworld', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400')
ON CONFLICT (name) DO UPDATE SET 
  cover_url = EXCLUDED.cover_url,
  updated_at = now();