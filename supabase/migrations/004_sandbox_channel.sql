-- Allow 'sandbox' as a conversation channel alongside 'copilot' and 'agent-studio'.

alter table conversations drop constraint conversations_channel_check;
alter table conversations add constraint conversations_channel_check
  check (channel in ('copilot', 'agent-studio', 'sandbox'));
