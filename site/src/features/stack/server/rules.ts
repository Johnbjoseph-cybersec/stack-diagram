import type { REPORT_REASONS } from "@/lib/db/schema.ts";

export type Vote = -1 | 0 | 1;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const HIDE_AT_REPORTS = 3;
export const IGNORED_AT_STRIKES = 2;
export const TRUSTED_PASS_AGE_MS = 24 * 60 * 60 * 1000;

export const PER_VOTER_DAY = { votes: 200, reports: 10, exposureReports: 3 };
// Loose per-network caps: a household or carrier NAT shares one address, so these only blunt cookie resets.
export const PER_NETWORK_DAY = { votesOnPost: 10, votes: 1000, reports: 30 };

export const toVote = (value: number): Vote => (value > 0 ? 1 : value < 0 ? -1 : 0);

/** Counts exclude the voter's own vote on this post, which they may change freely. */
export type VoteCounts = { voterDay: number; networkDay: number; networkPostDay: number };

export function voteLimitError({ voterDay, networkDay, networkPostDay }: VoteCounts) {
  if (voterDay >= PER_VOTER_DAY.votes) {
    return "Too many votes today";
  }
  if (networkPostDay >= PER_NETWORK_DAY.votesOnPost) {
    return "Too many votes on this post from your network today";
  }
  if (networkDay >= PER_NETWORK_DAY.votes) {
    return "Too many votes from your network today";
  }
  return null;
}

export type ReportCounts = { reporterDay: number; reporterExposureDay: number; networkDay: number };

export function reportLimitError(
  { reporterDay, reporterExposureDay, networkDay }: ReportCounts,
  reason: ReportReason,
) {
  if (reporterDay >= PER_VOTER_DAY.reports) {
    return "Too many reports today";
  }
  if (reason === "exposure" && reporterExposureDay >= PER_VOTER_DAY.exposureReports) {
    return "Too many exposure reports today";
  }
  if (networkDay >= PER_NETWORK_DAY.reports) {
    return "Too many reports from your network today";
  }
  return null;
}

type StandingReport = { reason: ReportReason; strikes: number };

/**
 * `reports` includes `latest`. Reporters an admin overruled twice stop counting. One exposure report
 * is enough only from a reporter never overruled whose pass is a day old, since a new pass costs one challenge.
 */
export const shouldHide = (
  reports: readonly StandingReport[],
  latest: StandingReport & { passAge: number },
) =>
  (latest.reason === "exposure" && latest.strikes === 0 && latest.passAge >= TRUSTED_PASS_AGE_MS) ||
  reports.filter(({ strikes }) => strikes < IGNORED_AT_STRIKES).length >= HIDE_AT_REPORTS;
