import { Client, VoiceState, ChannelType } from "discord.js";
import { Guild, User } from "../../helpers";
import { Levels } from "../../types/helpers";
import {awardLevelRole, getNextLevelXP, userLevelIgnoreCheck} from "../../handlers/functions";

const VOICE_XP_BASE_MIN = 2;
const VOICE_XP_BASE_MAX = 4;
const VOICE_XP_MULTIPLIER = 2;
const MINIMUM_VOICE_TIME_MS = 1000;

module.exports = async (client: Client, oldState: VoiceState, newState: VoiceState) => {
  if (!newState.guild || !newState.member || newState.member.user.bot) return;

  const guild = new Guild(client, newState.guild);
  const levelS = (await guild.get("utils.levels")) as Levels;

  if (!levelS.enabled) return;

  await handleUserVoiceStateChange(guild, newState, oldState, levelS);

  if (oldState.channel) {
    await updateOtherUsersStatus(guild, oldState, levelS);
  }

  if (newState.channel) {
    await updateOtherUsersStatus(guild, newState, levelS);
  }

  await handleStageChannel(newState);
};

async function handleUserVoiceStateChange(
  guild: Guild,
  newState: VoiceState,
  oldState: VoiceState,
  levelS: Levels,
) {
  if (!newState.member) return;
  const user = guild.getUser(newState.member.user.id);
  let timerData = (await user.cache.get("temp.voice_time")) as number | null;

  if (!oldState.channelId && newState.channelId) {
    await user.cache.set("temp.voice_time", 0);
    return;
  }

  if (oldState.channelId && !newState.channelId) {
    if (timerData && timerData > 0) {
      await awardVoiceXP(timerData, user, levelS);
    }
    await user.cache.set("temp.voice_time", 0);
    return;
  }

  if (newState.channelId && userLevelIgnoreCheck(newState.member, levelS, newState.channelId)) {
    if (timerData && timerData > 0) {
      await awardVoiceXP(timerData, user, levelS);
    }
    await user.cache.set("temp.voice_time", 0);
    return;
  }

  if (oldState.channelId && userLevelIgnoreCheck(newState.member, levelS, oldState.channelId)) {
    if (!isUserAFK(newState)) {
      await user.cache.set("temp.voice_time", Date.now());
    }
    return;
  }

  if (timerData === null || timerData === 0) {
    if (!isUserAFK(newState)) {
      await user.cache.set("temp.voice_time", Date.now());
    }
    return;
  }

  if (shouldInterruptVoiceTime(newState)) {
    if (timerData > 0) {
      await awardVoiceXP(timerData, user, levelS);
    }
    await user.cache.set("temp.voice_time", 0);
    return;
  }

  if (
    oldState.channelId &&
    newState.channelId &&
    levelS.ignore_channels?.includes(oldState.channelId) &&
    levelS.ignore_channels?.includes(newState.channelId)
  ) {
    if (timerData > 0) {
      await awardVoiceXP(timerData, user, levelS);
    }
    await user.cache.set("temp.voice_time", 0);
  }
}

async function updateOtherUsersStatus(guild: Guild, state: VoiceState, levelS: Levels) {
  const channel = state.channel;
  if (!channel?.members || channel.members.size === 0) return;

  const promises: Promise<void>[] = [];

  channel.members.forEach((member) => {
    if (member.user.bot || member.id === state.member?.id) return;

    const promise = (async () => {
      const user = guild.getUser(member.user.id);
      const timerData = (await user.cache.get("temp.voice_time")) as number | null;

      if (timerData === null || timerData === 0) {
        if (!isUserAFK(member.voice)) {
          await user.cache.set("temp.voice_time", Date.now());
        }
      } else if (shouldInterruptVoiceTime(member.voice)) {
        await awardVoiceXP(timerData, user, levelS);
        await user.cache.set("temp.voice_time", 0);
      }
    })();

    promises.push(promise);
  });

  await Promise.all(promises);
}

function isUserAFK(voiceState: VoiceState | any): boolean {
  return (
    voiceState.deaf === true ||
    voiceState.mute === true ||
    voiceState.selfDeaf === true ||
    voiceState.selfMute === true
  );
}

function shouldInterruptVoiceTime(voiceState: VoiceState): boolean {
  if (!voiceState.channel) return true;

  if (isUserAFK(voiceState)) return true;

  return (voiceState.channel?.members?.size ?? 0) === 1;
}

async function handleStageChannel(state: VoiceState) {
  if (!state.channel || state.channel.type !== ChannelType.GuildStageVoice) return;
  if (!state.guild.members.me) return;

  const botVoiceState = state.guild.members.me.voice;
  if (!botVoiceState.suppress) return;

  try {
    await botVoiceState.setSuppressed(false);
  } catch (e) {
    console.error("Failed to unsuppress bot in stage channel:", e);
  }
}

async function awardVoiceXP(startTime: number, user: User, levelS: Levels) {
  const currentTime = Date.now();
  const timeDiffMs = currentTime - startTime;

  if (timeDiffMs < MINIMUM_VOICE_TIME_MS) return;

  const timeMinutes = timeDiffMs / 1000 / 60;
  const baseXP =
    Math.floor(Math.random() * (VOICE_XP_BASE_MAX - VOICE_XP_BASE_MIN + 1)) + VOICE_XP_BASE_MIN;
  const addedXP = Math.round(baseXP * timeMinutes * VOICE_XP_MULTIPLIER);

  try {
    const currentLevel = (await user.get("level.level")) as number;
    const currentXP = (await user.get("level.xp")) as number;

    const newXPTotal = currentXP + addedXP;
    const [newLevel, newXP] = calculateNewLevel(currentLevel, newXPTotal);

    if (newLevel > currentLevel) {
        awardLevelRole(user.member, levelS, newLevel);
      await user.set("level.level", newLevel);
      await user.set("level.xp", newXP);
      await user.add("level.total_xp", addedXP);
      await user.add("level.voice_time", timeDiffMs);
    } else {
      await user.add("level.xp", addedXP);
      await user.add("level.total_xp", addedXP);
      await user.add("level.voice_time", timeDiffMs);
    }
  } catch (error) {
    console.error(`Failed to award voice XP for user ${user.user.id}:`, error);
  }
}

function calculateNewLevel(currentLevel: number, totalXP: number): [number, number] {
  let xpRemaining = totalXP;
  let newLevel = 0;

  for (let i = currentLevel; i <= currentLevel + 100; i++) {
    const requiredXP = getNextLevelXP(i);

    if (xpRemaining < requiredXP) {
      newLevel = i;
      break;
    }

    xpRemaining -= requiredXP;
  }

  return [newLevel, xpRemaining];
}
