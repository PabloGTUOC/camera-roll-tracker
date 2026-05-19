-- Unify '120' to '120mm' in cameras and film_types tables
UPDATE cameras SET supported_film_type = '120mm' WHERE supported_film_type = '120';
UPDATE film_types SET format = '120mm' WHERE format = '120';
