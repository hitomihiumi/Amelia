-- Auto moderation moves to Discord AutoMod: alert channel and block message for the existing rules,
-- new rules (keywords, word lists, mention spam, spam) and the ids of the rules created in Discord.
ALTER TABLE "Guild" ADD COLUMN "inviteBlockMessage" TEXT;
ALTER TABLE "Guild" ADD COLUMN "inviteAlertChannel" TEXT;
ALTER TABLE "Guild" ADD COLUMN "linksBlockMessage" TEXT;
ALTER TABLE "Guild" ADD COLUMN "linksAlertChannel" TEXT;
ALTER TABLE "Guild" ADD COLUMN "autoModKeywords" JSONB NOT NULL DEFAULT '{"enabled":false,"ignore_channels":[],"ignore_roles":[],"delete_message":true,"block_message":null,"alert_channel":null,"moderation_immune":true,"punishment":{"type":"warn","time":0,"reason":"Auto moderation"},"keywords":[],"regex":[],"allow":[]}';
ALTER TABLE "Guild" ADD COLUMN "autoModProfanity" JSONB NOT NULL DEFAULT '{"enabled":false,"ignore_channels":[],"ignore_roles":[],"delete_message":true,"block_message":null,"alert_channel":null,"moderation_immune":true,"punishment":{"type":"warn","time":0,"reason":"Auto moderation"},"presets":["profanity","slurs"],"allow":[]}';
ALTER TABLE "Guild" ADD COLUMN "autoModMentionSpam" JSONB NOT NULL DEFAULT '{"enabled":false,"ignore_channels":[],"ignore_roles":[],"delete_message":true,"block_message":null,"alert_channel":null,"moderation_immune":true,"punishment":{"type":"warn","time":0,"reason":"Auto moderation"},"limit":5,"raid_protection":true}';
ALTER TABLE "Guild" ADD COLUMN "autoModSpam" JSONB NOT NULL DEFAULT '{"enabled":false,"ignore_channels":[],"ignore_roles":[],"delete_message":true,"block_message":null,"alert_channel":null,"moderation_immune":true,"punishment":{"type":"warn","time":0,"reason":"Auto moderation"}}';
ALTER TABLE "Guild" ADD COLUMN "autoModRules" JSONB NOT NULL DEFAULT '{}';
