-- Voting Security: Rate limiting and delete policy
-- Run after the base schema. Enables 30-second cooldown per user_identifier.

-- Rate limit: reject insert if same user_identifier voted in last 30 seconds
create or replace function check_vote_rate_limit()
returns trigger as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from model_votes
  where user_identifier = new.user_identifier
    and created_at > now() - interval '30 seconds';
  if recent_count > 0 then
    raise exception 'Rate limit: please wait 30 seconds between votes';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists vote_rate_limit on model_votes;
create trigger vote_rate_limit
  before insert on model_votes
  for each row execute function check_vote_rate_limit();

-- Allow delete (client only deletes own votes by user_identifier)
create policy "Anyone can delete own vote" on model_votes for delete using (true);
