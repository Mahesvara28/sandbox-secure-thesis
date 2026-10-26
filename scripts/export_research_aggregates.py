#!/usr/bin/env python3
"""Export de-identified research summaries from Cloud Firestore.

Uses only Python's standard library and a short-lived Google Cloud access token.
Participant-level outputs use salted pseudonyms and never contain UIDs, emails,
or names. Keep the salt private and retain it only if repeat matching is needed.
"""

import argparse
import csv
import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


def decode_value(value):
    if not isinstance(value, dict):
        return None
    for key in ("stringValue", "booleanValue", "integerValue", "doubleValue", "timestampValue"):
        if key in value:
            raw = value[key]
            if key == "integerValue":
                return int(raw)
            if key == "doubleValue":
                return float(raw)
            return raw
    if "nullValue" in value:
        return None
    if "arrayValue" in value:
        return [decode_value(item) for item in value["arrayValue"].get("values", [])]
    if "mapValue" in value:
        return {key: decode_value(item) for key, item in value["mapValue"].get("fields", {}).items()}
    return None


def decode_document(document):
    return {key: decode_value(value) for key, value in document.get("fields", {}).items()}


def list_documents(url, token):
    documents = []
    page_token = None
    while True:
        page_url = f"{url}?pageSize=1000"
        if page_token:
            page_url += f"&pageToken={quote(page_token, safe='')}"
        request = Request(page_url, headers={"Authorization": f"Bearer {token}"})
        with urlopen(request, timeout=60) as response:
            payload = json.load(response)
        documents.extend(payload.get("documents", []))
        page_token = payload.get("nextPageToken")
        if not page_token:
            return documents


def write_csv(path, headers, rows):
    with path.open("w", newline="", encoding="utf-8-sig") as output:
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", default=os.environ.get("GOOGLE_CLOUD_PROJECT"), help="Firebase/Google Cloud project ID")
    parser.add_argument("--output", type=Path, default=Path("research-exports"), help="Output directory (default: research-exports)")
    args = parser.parse_args()
    token = os.environ.get("FIRESTORE_ACCESS_TOKEN")
    salt = os.environ.get("RESEARCH_EXPORT_SALT")
    if not args.project or not token or not salt:
        parser.error("Set GOOGLE_CLOUD_PROJECT, FIRESTORE_ACCESS_TOKEN, and a private RESEARCH_EXPORT_SALT first. The token needs Firestore read access.")

    documents_url = f"https://firestore.googleapis.com/v1/projects/{quote(args.project, safe='')}/databases/(default)/documents"
    try:
        users = list_documents(f"{documents_url}/users", token)
        mission_groups = defaultdict(lambda: {"attempts": 0, "completed": 0, "timed_out": 0, "seconds": 0, "hints": 0, "wrong_decisions": 0, "wrong_commands": 0, "wrong_by_step": defaultdict(int)})
        assessment_by_user = defaultdict(list)
        participant_ids = {}
        participant_mission_groups = defaultdict(lambda: {"attempts": 0, "completed": 0, "timed_out": 0, "seconds": 0, "hints": 0, "wrong_decisions": 0, "wrong_commands": 0, "wrong_by_step": defaultdict(int), "daily_attempts": 0, "time_by_step": defaultdict(int), "step_time_counts": defaultdict(int)})
        participant_totals = defaultdict(lambda: {"mission_attempts": 0, "mission_seconds": 0, "hints": 0, "wrong_decisions": 0, "wrong_commands": 0, "daily_attempts": 0})
        saved_user_scores = {}

        for user_document in users:
            user_id = user_document.get("name", "").rsplit("/", 1)[-1]
            if not user_id:
                continue
            anonymous_id = hashlib.sha256((salt + user_id).encode("utf-8")).hexdigest()[:16]
            participant_ids[user_id] = anonymous_id
            user_data = decode_document(user_document)
            saved_user_scores[user_id] = user_data.get("scores") or {}
            encoded_id = quote(user_id, safe="")
            for collection_name in ("missionAttempts", "assessmentAttempts"):
                child_documents = list_documents(f"{documents_url}/users/{encoded_id}/{collection_name}", token)
                for raw_document in child_documents:
                    record = decode_document(raw_document)
                    if collection_name == "missionAttempts":
                        mission_id = str(record.get("missionId") or "unknown")
                        key = (mission_id, str(record.get("tier") or "unknown"))
                        group = mission_groups[key]
                        participant_group = participant_mission_groups[(anonymous_id, mission_id, key[1])]
                        group["attempts"] += 1
                        group["completed"] += int(record.get("outcome") == "completed")
                        group["timed_out"] += int(record.get("outcome") == "timed_out")
                        group["seconds"] += max(0, int(record.get("totalTimeSeconds") or 0))
                        group["hints"] += max(0, int(record.get("hintsOpened") or 0))
                        group["wrong_decisions"] += max(0, int(record.get("wrongDecisionCount") or 0))
                        participant_group["attempts"] += 1
                        participant_group["completed"] += int(record.get("outcome") == "completed")
                        participant_group["timed_out"] += int(record.get("outcome") == "timed_out")
                        elapsed = max(0, int(record.get("totalTimeSeconds") or 0))
                        hints = max(0, int(record.get("hintsOpened") or 0))
                        wrong_decisions = max(0, int(record.get("wrongDecisionCount") or 0))
                        participant_group["seconds"] += elapsed
                        participant_group["hints"] += hints
                        participant_group["wrong_decisions"] += wrong_decisions
                        totals = participant_totals[anonymous_id]
                        totals["mission_attempts"] += 1
                        totals["mission_seconds"] += elapsed
                        totals["hints"] += hints
                        totals["wrong_decisions"] += wrong_decisions
                        is_daily = bool(record.get("dailyChallengeDate") and record.get("dailyChallengeType"))
                        if is_daily:
                            participant_group["daily_attempts"] += 1
                            totals["daily_attempts"] += 1
                        step_times = record.get("timePerStepSeconds") or {}
                        for step, seconds in step_times.items():
                            participant_group["time_by_step"][str(step)] += max(0, int(seconds or 0))
                            participant_group["step_time_counts"][str(step)] += 1
                        wrong_steps = record.get("wrongCommandsByStep") or {}
                        for step, count in wrong_steps.items():
                            value = max(0, int(count or 0))
                            group["wrong_commands"] += value
                            group["wrong_by_step"][str(step)] += value
                            participant_group["wrong_commands"] += value
                            participant_group["wrong_by_step"][str(step)] += value
                            participant_totals[anonymous_id]["wrong_commands"] += value
                    else:
                        key = (str(record.get("tier") or "unknown"), str(record.get("assessment") or "unknown"))
                        assessment_by_user[(user_id, *key)].append(record)

        args.output.mkdir(parents=True, exist_ok=True)
        mission_rows = []
        for (mission_id, tier), group in sorted(mission_groups.items()):
            count = group["attempts"]
            mission_rows.append({
                "missionId": mission_id,
                "tier": tier,
                "attemptCount": count,
                "completedCount": group["completed"],
                "timedOutCount": group["timed_out"],
                "completionRatePercent": round(group["completed"] * 100 / count) if count else 0,
                "averageTimeSeconds": round(group["seconds"] / count, 2) if count else 0,
                "averageHintsOpened": round(group["hints"] / count, 2) if count else 0,
                "averageWrongCommands": round(group["wrong_commands"] / count, 2) if count else 0,
                "averageWrongDecisions": round(group["wrong_decisions"] / count, 2) if count else 0,
                "wrongCommandsByStepTotal": json.dumps(dict(sorted(group["wrong_by_step"].items())), sort_keys=True),
            })
        write_csv(args.output / "mission-aggregates.csv", ["missionId", "tier", "attemptCount", "completedCount", "timedOutCount", "completionRatePercent", "averageTimeSeconds", "averageHintsOpened", "averageWrongCommands", "averageWrongDecisions", "wrongCommandsByStepTotal"], mission_rows)

        assessment_groups = defaultdict(lambda: {"attempts": 0, "percent_sum": 0.0, "first_percent_sum": 0.0, "first_count": 0, "best_percent_sum": 0.0, "user_count": 0})
        grouped_user_attempts = defaultdict(list)
        for (user_id, tier, assessment), records in assessment_by_user.items():
            records.sort(key=lambda item: int(item.get("attemptNumber") or 0))
            valid = [item for item in records if float(item.get("total") or 0) > 0]
            if not valid:
                continue
            percentages = [float(item.get("score") or 0) * 100 / float(item["total"]) for item in valid]
            group = assessment_groups[(tier, assessment)]
            group["attempts"] += len(valid)
            group["percent_sum"] += sum(percentages)
            group["first_percent_sum"] += percentages[0]
            group["first_count"] += 1
            group["best_percent_sum"] += max(percentages)
            group["user_count"] += 1
            grouped_user_attempts[(user_id, tier, assessment)] = percentages
        assessment_rows = []
        for (tier, assessment), group in sorted(assessment_groups.items()):
            assessment_rows.append({
                "tier": tier,
                "assessment": assessment,
                "participantCount": group["user_count"],
                "attemptCount": group["attempts"],
                "averageAttemptPercent": round(group["percent_sum"] / group["attempts"], 2) if group["attempts"] else 0,
                "averageFirstAttemptPercent": round(group["first_percent_sum"] / group["first_count"], 2) if group["first_count"] else 0,
                "averageBestAttemptPercent": round(group["best_percent_sum"] / group["user_count"], 2) if group["user_count"] else 0,
            })
        write_csv(args.output / "assessment-aggregates.csv", ["tier", "assessment", "participantCount", "attemptCount", "averageAttemptPercent", "averageFirstAttemptPercent", "averageBestAttemptPercent"], assessment_rows)

        participant_mission_rows = []
        for (anonymous_id, mission_id, tier), group in sorted(participant_mission_groups.items()):
            count = group["attempts"]
            participant_mission_rows.append({
                "anonymousParticipantId": anonymous_id,
                "missionId": mission_id,
                "tier": tier,
                "attemptCount": count,
                "completedCount": group["completed"],
                "averageTimeSeconds": round(group["seconds"] / count, 2) if count else 0,
                "averageHintsOpened": round(group["hints"] / count, 2) if count else 0,
                "wrongCommandsByStep": json.dumps(dict(sorted(group["wrong_by_step"].items())), sort_keys=True),
                "wrongDecisionCount": group["wrong_decisions"],
                "averageTimePerStepSeconds": json.dumps({step: round(total / group["step_time_counts"][step], 2) for step, total in sorted(group["time_by_step"].items())}, sort_keys=True),
                "dailyChallengeUsed": "yes" if group["daily_attempts"] else "no",
                "dailyChallengeAttemptCount": group["daily_attempts"],
            })
        write_csv(args.output / "participant-mission-aggregates.csv", ["anonymousParticipantId", "missionId", "tier", "attemptCount", "completedCount", "averageTimeSeconds", "averageHintsOpened", "wrongCommandsByStep", "wrongDecisionCount", "averageTimePerStepSeconds", "dailyChallengeUsed", "dailyChallengeAttemptCount"], participant_mission_rows)

        participant_assessment_rows = []
        recorded_assessments = set()
        for (user_id, tier, assessment), records in assessment_by_user.items():
            records.sort(key=lambda item: int(item.get("attemptNumber") or 0))
            valid = [item for item in records if float(item.get("total") or 0) > 0]
            if not valid:
                continue
            recorded_assessments.add((user_id, tier, assessment))
            first = next((item for item in valid if int(item.get("attemptNumber") or 0) == 1), valid[0])
            best = max(valid, key=lambda item: float(item.get("score") or 0) / float(item.get("total") or 1))
            participant_assessment_rows.append({
                "anonymousParticipantId": participant_ids[user_id], "tier": tier, "assessment": assessment,
                "attemptCount": len(valid), "firstAttemptScore": first.get("score"), "firstAttemptTotal": first.get("total"),
                "firstAttemptPercent": round(float(first.get("score") or 0) * 100 / float(first["total"]), 2),
                "bestAttemptScore": best.get("score"), "bestAttemptTotal": best.get("total"),
            })
        for user_id, scores in saved_user_scores.items():
            for tier, score_data in scores.items():
                if not isinstance(score_data, dict):
                    continue
                for assessment in ("pre", "post"):
                    if (user_id, tier, assessment) in recorded_assessments:
                        continue
                    is_pre = assessment == "pre"
                    first_score = score_data.get("preTestFirstScore" if is_pre else "firstFinalScore")
                    first_total = score_data.get("preTestFirstTotal" if is_pre else "firstFinalTotal")
                    first_score = first_score if first_score is not None else score_data.get("preTestScore" if is_pre else "finalScore")
                    first_total = first_total if first_total is not None else score_data.get("preTestTotal" if is_pre else "finalTotal")
                    if first_score is None or not first_total:
                        continue
                    best_score = "" if is_pre else score_data.get("finalScore", first_score)
                    participant_assessment_rows.append({
                        "anonymousParticipantId": participant_ids[user_id], "tier": tier, "assessment": assessment,
                        "attemptCount": int(score_data.get("preTestAttemptCount" if is_pre else "finalAttemptCount") or 1),
                        "firstAttemptScore": first_score, "firstAttemptTotal": first_total,
                        "firstAttemptPercent": round(float(first_score) * 100 / float(first_total), 2),
                        "bestAttemptScore": best_score, "bestAttemptTotal": "" if is_pre else score_data.get("finalTotal", first_total),
                    })
        write_csv(args.output / "participant-assessment-summaries.csv", ["anonymousParticipantId", "tier", "assessment", "attemptCount", "firstAttemptScore", "firstAttemptTotal", "firstAttemptPercent", "bestAttemptScore", "bestAttemptTotal"], participant_assessment_rows)

        participant_summary_rows = []
        for user_id, anonymous_id in sorted(participant_ids.items(), key=lambda entry: entry[1]):
            totals = participant_totals[anonymous_id]
            row = {
                "anonymousParticipantId": anonymous_id,
                "missionAttemptCount": totals["mission_attempts"],
                "totalMissionTimeSeconds": totals["mission_seconds"],
                "hintsOpened": totals["hints"],
                "wrongCommands": totals["wrong_commands"],
                "wrongDecisions": totals["wrong_decisions"],
                "dailyChallengeUsed": "yes" if totals["daily_attempts"] else "no",
                "dailyChallengeAttemptCount": totals["daily_attempts"],
            }
            for tier in ("BEGINNER", "INTERMEDIATE", "EXPERT"):
                score_data = saved_user_scores[user_id].get(tier) or {}
                row[f"{tier.lower()}PreFirstScore"] = score_data.get("preTestFirstScore", score_data.get("preTestScore", ""))
                row[f"{tier.lower()}PreFirstTotal"] = score_data.get("preTestFirstTotal", score_data.get("preTestTotal", ""))
                row[f"{tier.lower()}PreAttemptCount"] = score_data.get("preTestAttemptCount", "")
                row[f"{tier.lower()}PostFirstScore"] = score_data.get("firstFinalScore", score_data.get("finalScore", ""))
                row[f"{tier.lower()}PostFirstTotal"] = score_data.get("firstFinalTotal", score_data.get("finalTotal", ""))
                row[f"{tier.lower()}PostAttemptCount"] = score_data.get("finalAttemptCount", "")
            participant_summary_rows.append(row)
        summary_headers = list(participant_summary_rows[0].keys()) if participant_summary_rows else ["anonymousParticipantId", "missionAttemptCount", "totalMissionTimeSeconds", "hintsOpened", "wrongCommands", "wrongDecisions", "dailyChallengeUsed", "dailyChallengeAttemptCount"]
        write_csv(args.output / "participant-summaries.csv", summary_headers, participant_summary_rows)
        print(f"Wrote aggregate mission and assessment summaries to {args.output.resolve()}")
        print("Outputs include anonymous participant-level rows. No UIDs, names, or emails are exported.")
    except (HTTPError, URLError) as error:
        raise SystemExit(f"Firestore export failed: {error}. Confirm the project, token, and read-only Firestore IAM access.") from error


if __name__ == "__main__":
    main()
