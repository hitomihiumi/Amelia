-- AI chat: reading code files is a new switch next to short_term, long_term and images.
-- Servers whose stored switches predate it get it from the defaults in the bot.
ALTER TABLE "Guild" ALTER COLUMN "aiOptions" SET DEFAULT '{"short_term":true,"long_term":true,"images":true,"code":true}';
