/**
 * Word-based KB search helpers (PRD §7.2).
 * A plain ilike on the whole sentence finds nothing, so we split the query into
 * words, drop short/common words, reduce each to a simple stem, and score articles
 * by how many stems appear in their title or keywords.
 */

const STOP_WORDS = new Set([
  "the", "and", "for", "but", "not", "are", "was", "were", "has", "have", "had", "can", "cant",
  "cannot", "could", "would", "should", "will", "with", "from", "into", "onto", "this", "that",
  "these", "those", "there", "their", "they", "them", "then", "than", "what", "when", "where",
  "which", "who", "why", "how", "you", "your", "our", "his", "her", "its", "any", "all", "some",
  "since", "keeps", "keep", "kept", "still", "just", "very", "really", "also", "again", "now",
  "today", "morning", "evening", "night", "yesterday", "help", "please", "issue", "problem",
  "getting", "get", "got", "does", "doesnt", "dont", "did", "didnt", "isnt", "wont", "working",
  "work", "able", "unable", "need", "want", "trying", "tried", "try", "time", "times", "after",
  "before", "about", "being", "been", "mine", "myself", "out", "off", "too", "much", "many",
  "suddenly", "anymore",
]);

/** Very small suffix stripper: "disconnecting" -> "disconnect", "clicked" -> "click". */
export function stem(word: string): string {
  for (const suffix of ["ing", "ed", "es", "s"]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/** Lowercase, keep letters/digits only, drop words under 3 letters and stop words, dedupe. */
export function queryWords(query: string): string[] {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // "Wi-Fi" -> "wifi"; also makes words safe inside .or(...)
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    .map(stem);
  return [...new Set(words)].slice(0, 10);
}

/** Supabase .or() filter: title or keywords ilike any of the words. */
export function orFilter(words: string[]): string {
  return words.flatMap((w) => [`title.ilike.%${w}%`, `keywords.ilike.%${w}%`]).join(",");
}

type Scorable = { id: number; title: string; keywords: string };

/** Score = number of words matched; a word in the title counts a little extra to break ties. */
export function rankArticles<T extends Scorable>(rows: T[], words: string[], limit = 3): T[] {
  return rows
    .map((row) => {
      const title = row.title.toLowerCase();
      const keywords = row.keywords.toLowerCase();
      let score = 0;
      for (const w of words) {
        const inTitle = title.includes(w);
        if (inTitle || keywords.includes(w)) score += 1;
        if (inTitle) score += 0.1;
      }
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.row.id - b.row.id)
    .slice(0, limit)
    .map((x) => x.row);
}
