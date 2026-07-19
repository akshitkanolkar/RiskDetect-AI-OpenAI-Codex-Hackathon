-- Persist screenshot preview + dimensions for interactive detection overlays.
alter table public.image_scans
  add column if not exists image_data_url text,
  add column if not exists image_width integer,
  add column if not exists image_height integer;
