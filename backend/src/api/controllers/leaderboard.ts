import _ from "lodash";
import {
  getCurrentDayTimestamp,
  MILLISECONDS_IN_DAY,
  getCurrentWeekTimestamp,
} from "../../utils/misc";
import { MonkeyResponse } from "../../utils/monkey-response";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import MonkeyError from "../../utils/error";
import * as DailyLeaderboards from "../../utils/daily-leaderboards";
import * as WeeklyXpLeaderboard from "../../services/weekly-xp-leaderboard";
import {
  GetDailyLeaderboardQuery,
  GetDailyLeaderboardRankQuery,
  GetLeaderboardDailyRankResponse,
  GetLeaderboardQuery,
  GetLeaderboardRankResponse,
  GetLeaderboardResponse as GetLeaderboardResponse,
  GetWeeklyXpLeaderboardQuery,
  GetWeeklyXpLeaderboardRankResponse,
  GetWeeklyXpLeaderboardResponse,
  LanguageAndModeQuery,
} from "@monkeytype/contracts/leaderboards";
import { Configuration } from "@monkeytype/contracts/schemas/configuration";

export async function getLeaderboard(
  req: MonkeyTypes.Request<GetLeaderboardQuery>
): Promise<GetLeaderboardResponse> {
  const { language, mode, mode2, skip = 0, limit = 50 } = req.query;

  const leaderboard = await LeaderboardsDAL.get(
    mode,
    mode2,
    language,
    skip,
    limit
  );

  if (leaderboard === false) {
    throw new MonkeyError(
      503,
      "Leaderboard is currently updating. Please try again in a few seconds."
    );
  }

  const normalizedLeaderboard = leaderboard.map((it) => _.omit(it, ["_id"]));

  return new MonkeyResponse("Leaderboard retrieved", normalizedLeaderboard);
}

export async function getRankFromLeaderboard(
  req: MonkeyTypes.Request<LanguageAndModeQuery>
): Promise<GetLeaderboardRankResponse> {
  const { language, mode, mode2 } = req.query;
  const { uid } = req.ctx.decodedToken;

  const data = await LeaderboardsDAL.getRank(mode, mode2, language, uid);
  if (data === false) {
    throw new MonkeyError(
      503,
      "Leaderboard is currently updating. Please try again in a few seconds."
    );
  }

  return new MonkeyResponse("Rank retrieved", data);
}

function getDailyLeaderboardWithError(
  { language, mode, mode2, daysBefore }: GetDailyLeaderboardRankQuery,
  config: Configuration["dailyLeaderboards"]
): DailyLeaderboards.DailyLeaderboard {
  const customTimestamp =
    daysBefore === undefined
      ? -1
      : getCurrentDayTimestamp() - daysBefore * MILLISECONDS_IN_DAY;

  const dailyLeaderboard = DailyLeaderboards.getDailyLeaderboard(
    language,
    mode,
    mode2,
    config,
    customTimestamp
  );
  if (!dailyLeaderboard) {
    throw new MonkeyError(404, "There is no daily leaderboard for this mode");
  }

  return dailyLeaderboard;
}

export async function getDailyLeaderboard(
  req: MonkeyTypes.Request<GetDailyLeaderboardQuery>
): Promise<GetLeaderboardResponse> {
  const { skip = 0, limit = 50 } = req.query;

  const dailyLeaderboard = getDailyLeaderboardWithError(
    req.query,
    req.ctx.configuration.dailyLeaderboards
  );

  const minRank = skip;
  const maxRank = minRank + limit - 1;

  const topResults = await dailyLeaderboard.getResults(
    minRank,
    maxRank,
    req.ctx.configuration.dailyLeaderboards,
    req.ctx.configuration.users.premium.enabled
  );

  return new MonkeyResponse("Daily leaderboard retrieved", topResults);
}

export async function getDailyLeaderboardRank(
  req: MonkeyTypes.Request<GetDailyLeaderboardRankQuery>
): Promise<GetLeaderboardDailyRankResponse> {
  const { uid } = req.ctx.decodedToken;

  const dailyLeaderboard = getDailyLeaderboardWithError(
    req.query,
    req.ctx.configuration.dailyLeaderboards
  );

  const rank = await dailyLeaderboard.getRank(
    uid,
    req.ctx.configuration.dailyLeaderboards
  );

  return new MonkeyResponse("Daily leaderboard rank retrieved", rank);
}

function getWeeklyXpLeaderboardWithError(
  { weeksBefore }: GetWeeklyXpLeaderboardQuery,
  config: Configuration["leaderboards"]["weeklyXp"]
): WeeklyXpLeaderboard.WeeklyXpLeaderboard {
  const customTimestamp =
    weeksBefore === undefined
      ? -1
      : getCurrentWeekTimestamp() - weeksBefore * MILLISECONDS_IN_DAY * 7;

  const weeklyXpLeaderboard = WeeklyXpLeaderboard.get(config, customTimestamp);
  if (!weeklyXpLeaderboard) {
    throw new MonkeyError(404, "XP leaderboard for this week not found.");
  }

  return weeklyXpLeaderboard;
}

export async function getWeeklyXpLeaderboardResults(
  req: MonkeyTypes.Request<GetWeeklyXpLeaderboardQuery>
): Promise<GetWeeklyXpLeaderboardResponse> {
  const { skip = 0, limit = 50 } = req.query;

  const minRank = skip;
  const maxRank = minRank + limit - 1;

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(
    req.query,
    req.ctx.configuration.leaderboards.weeklyXp
  );
  const results = await weeklyXpLeaderboard.getResults(
    minRank,
    maxRank,
    req.ctx.configuration.leaderboards.weeklyXp
  );

  return new MonkeyResponse("Weekly xp leaderboard retrieved", results);
}

export async function getWeeklyXpLeaderboardRank(
  req: MonkeyTypes.Request
): Promise<GetWeeklyXpLeaderboardRankResponse> {
  const { uid } = req.ctx.decodedToken;

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(
    {},
    req.ctx.configuration.leaderboards.weeklyXp
  );
  const rankEntry = await weeklyXpLeaderboard.getRank(
    uid,
    req.ctx.configuration.leaderboards.weeklyXp
  );

  return new MonkeyResponse("Weekly xp leaderboard rank retrieved", rankEntry);
}
