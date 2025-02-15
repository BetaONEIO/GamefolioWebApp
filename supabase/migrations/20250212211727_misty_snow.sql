/*
  # Add trending games function

  1. New Functions
    - get_trending_games: Returns trending games with clip counts
*/

CREATE OR REPLACE FUNCTION get_trending_games()
RETURNS TABLE (
  game text,
  clip_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.game,
    COUNT(*) as clip_count
  FROM clips c
  GROUP BY c.game
  ORDER BY clip_count DESC
  LIMIT 4;
END;
$$;