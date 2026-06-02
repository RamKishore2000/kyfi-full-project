import { translate, type KyfiLanguage } from "@/lib/kyfi-i18n";

const runtimeMessageMap: Record<string, string> = {
  "Your vote has been applied.": "search.voteApplied",
  "search.voteApplied": "Your vote has been applied.",
  "Your vote has been removed.": "search.voteRemoved",
  "search.voteRemoved": "Your vote has been removed.",
  "You can update your vote. Removal is not allowed.": "search.voteRemovalLocked",
  "search.voteRemovalLocked": "You can update your vote. Removal is not allowed.",
  "Existing farmer record found.": "search.existingRecordFound",
  "search.existingRecordFound": "Existing farmer record found.",
  "No existing farmer record found.": "search.noRecordFound",
  "search.noRecordFound": "No existing farmer record found.",
  "Farmer status added": "search.farmerStatusAdded",
  "search.farmerStatusAdded": "Farmer status added",
  "Vote failed": "search.unable",
  "search.unable": "Unable to search farmer status",
  "Check failed": "search.unable",
  "Save failed": "common.requestFailed",
  "common.requestFailed": "Request failed",
};

export function translateRuntimeMessage(message: string, language: KyfiLanguage = "en") {
  const key = runtimeMessageMap[message];
  if (!key) return message;

  if (key === "search.voteRemoved") {
    return language === "te" ? "మీ ఓటు తొలగించబడింది." : "Your vote has been removed.";
  }

  if (key === "search.voteRemovalLocked") {
    return language === "te"
      ? "మీ ఓటును మార్చవచ్చు. తొలగించడం అనుమతించబడదు."
      : "You can update your vote. Removal is not allowed.";
  }

  const translated = translate(language, key);
  return translated === key ? key : translated;
}

export function translateRuntimeText(text: string, language: KyfiLanguage = "en") {
  return translateRuntimeMessage(text, language);
}
