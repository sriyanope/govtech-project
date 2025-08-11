-- Ensure PostGIS and pgRouting extensions are enabled
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

-- Drop existing tables to ensure a clean slate for topology creation
-- CASCADE will also drop dependent objects like the vertices table if it exists
DROP TABLE IF EXISTS walkway_edges CASCADE;
DROP TABLE IF EXISTS tmp_sheltered CASCADE;
DROP TABLE IF EXISTS walkway_edges_vertices_pgr CASCADE; -- Explicitly drop the vertices table

-- Create a temporary table for sheltered linkways by merging geometries
CREATE TEMP TABLE tmp_sheltered AS
SELECT ST_LineMerge(ST_Boundary(geom)) AS geom
FROM   covered_linkways;    

-- Report the count of sheltered lines (for debugging/info)
SELECT 'sheltered_lines', COUNT(*) FROM tmp_sheltered;

-- Create the main walkway_edges table by combining sheltered and unsheltered tracks
-- Each edge gets a unique ID, a geometry, a sheltered flag, and its length in meters.
CREATE TABLE walkway_edges AS
SELECT
    row_number() OVER ()                  AS id,           -- Unique ID for each edge
    geom,                                 -- Geometry of the walkway segment
    TRUE                                   AS is_sheltered, -- Flag indicating if it's sheltered
    ST_Length(ST_Transform(geom, 3857))   AS length_m      -- Length in meters (transformed to a projected CRS)
FROM tmp_sheltered

UNION ALL

SELECT
    row_number() OVER () + 100000         AS id,           -- Offset IDs for unsheltered tracks
    geom,                                 -- Geometry of the track segment
    FALSE                                  AS is_sheltered, -- Flag indicating if it's unsheltered
    ST_Length(ST_Transform(geom, 3857))   AS length_m      -- Length in meters
FROM tracks;                     

-- ADDED: Add source and target columns before calling pgr_createTopology
-- pgr_createTopology will populate these columns.
ALTER TABLE walkway_edges
  ADD COLUMN source INTEGER,
  ADD COLUMN target INTEGER;

-- Now, create the pgRouting topology for the walkway_edges table.
-- This function analyzes the network, adds 'source' and 'target' columns to walkway_edges,
-- and creates the 'walkway_edges_vertices_pgr' table.
SELECT pgr_createTopology(
    'walkway_edges',          -- The table containing the graph edges
    0.01,                   -- Tolerance for snapping vertices (adjust as needed)
    'geom',                   -- The name of the geometry column in walkway_edges
    'id',                     -- The name of the ID column in walkway_edges
    'source',                 -- The name of the new column to be created for source node IDs
    'target'                  -- The name of the new column to be created for target node IDs
);

-- Add cost and reverse_cost columns to the walkway_edges table
-- These columns are used by pgRouting for pathfinding algorithms.
-- Moved this after pgr_createTopology as it's typically a separate step.
ALTER TABLE walkway_edges
  ADD COLUMN cost         double precision,
  ADD COLUMN reverse_cost double precision;

-- Update the cost columns:
-- Sheltered paths have a cost equal to their length.
-- Unsheltered paths have a higher cost (length_m * 2.5) to discourage their use in bad weather.
UPDATE walkway_edges
SET
    cost         = CASE WHEN is_sheltered THEN length_m
                        ELSE length_m * 2.5         
                   END,
    reverse_cost = cost; -- For undirected graphs, reverse_cost is typically the same as cost

-- Create a spatial index on the geometry column for faster spatial queries
CREATE INDEX IF NOT EXISTS walkway_edges_geom_idx
    ON walkway_edges USING GIST (geom);

-- Analyze the table to update statistics, which helps the query planner
ANALYZE walkway_edges;



