/*
  # Add game-related functions and views

  1. Functions
    - get_game_clips: Get clips for a specific game
    - get_trending_games: Get trending games with clip counts
    - get_game_stats: Get statistics for a game

  2. Views
    - game_stats: View for game statistics
*/

-- Create function to get clips for a game
CREATE OR REPLACE FUNCTION get_game_clips(game_name text, limit_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  video_url text,
  thumbnail_url text,
  likes int,
  comments int,
  shares int,
  created_at timestamptz,
  username text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.video_url,
    c.thumbnail_url,
    c.likes,
    c.comments,
    c.shares,
    c.created_at,
    up.username,
    up.avatar_url
  FROM clips c
  JOIN user_profiles up ON c.user_id = up.user_id
  WHERE c.game = game_name
  AND c.visibility = 'public'
  AND NOT up.banned
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create function to get game statistics
CREATE OR REPLACE FUNCTION get_game_stats(game_name text)
RETURNS TABLE (
  total_clips bigint,
  total_likes bigint,
  total_comments bigint,
  total_shares bigint,
  unique_creators bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_clips,
    SUM(likes)::bigint as total_likes,
    SUM(comments)::bigint as total_comments,
    SUM(shares)::bigint as total_shares,
    COUNT(DISTINCT user_id)::bigint as unique_creators
  FROM clips
  WHERE game = game_name
  AND visibility = 'public';
END;
$$;

-- Create view for game statistics
CREATE OR REPLACE VIEW game_stats AS
SELECT
  game,
  COUNT(*) as clip_count,
  SUM(likes) as total_likes,
  SUM(comments) as total_comments,
  SUM(shares) as total_shares,
  COUNT(DISTINCT user_id) as unique_creators
FROM clips
WHERE visibility = 'public'
GROUP BY game;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_game_clips(text, int) TO public;
GRANT EXECUTE ON FUNCTION get_game_stats(text) TO public;
GRANT SELECT ON game_stats TO public;