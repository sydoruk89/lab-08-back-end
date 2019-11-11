DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS weather;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
  );

CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  forecast VARCHAR(255),
  time VARCHAR(255),
);

CREATE TABLE trails (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  length INTEGER,
  stars NUMERIC(3,2),
  star_votes INTEGER,
  summary VARCHAR(255),
  trail_url VARCHAR(255),
  conditions VARCHAR(255),
  condition_date VARCHAR(255),
  condition_time VARCHAR(255),
);