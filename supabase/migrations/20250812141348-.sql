begin;

-- Cleanup orphan wardrobe items with no owner (created before RLS tightening)
delete from public.wardrobe_items where user_id is null;

-- Enforce ownership: require user_id for every row
alter table public.wardrobe_items
  alter column user_id set not null;

commit;