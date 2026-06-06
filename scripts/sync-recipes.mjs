import { readFile, writeFile } from 'node:fs/promises';

const ARCHIVE_URL = 'https://ideakitchen.substack.com/api/v1/archive';
const RECIPES_PATH = new URL('../recipes.html', import.meta.url);
const LIMIT = 12;

const TOOL_NAMES = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'NotebookLM',
  'Perplexity',
  'Zapier',
  'Gamma',
  'Lovable',
  'Codex',
  'Canva',
  'Google Workspace Studio',
  'Gmail',
  'Slack',
  'Notion',
  'Substack',
];

function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripLeadingEmoji(value = '') {
  return cleanText(value)
    .replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/u, '')
    .trim();
}

function isRecipePost(post) {
  const title = stripLeadingEmoji(post.title || post.social_title || '');
  if (/^What's Simmering in AI/i.test(title)) return false;
  if (/^(Join me tomorrow|Tomorrow: Join us live)/i.test(title)) return false;
  if (/^Idea Kitchen Member Perks/i.test(title)) return false;
  return true;
}

function displayTitle(post) {
  return stripLeadingEmoji(post.title || post.social_title || '')
    .replace(/^AI Recipe:\s*/i, '')
    .trim();
}

function firstSentence(value = '') {
  const text = cleanText(value);
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  return (match ? match[1] : text).slice(0, 180).trim();
}

function detectTools(post) {
  const haystack = [
    post.title,
    post.subtitle,
    post.description,
    post.truncated_body_text,
    post.slug,
  ].map(cleanText).join(' ');

  const found = TOOL_NAMES.filter((tool) => {
    const pattern = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(haystack);
  });

  if (/google workspace/i.test(haystack) && !found.includes('Google Workspace Studio')) {
    found.push('Google Workspace Studio');
  }

  return found.length ? found : ['General AI'];
}

function inferTime(post) {
  const haystack = [post.title, post.subtitle, post.description, post.truncated_body_text]
    .map(cleanText)
    .join(' ');
  const explicit = haystack.match(/\b(\d{1,2})\s*(?:min|minute|minutes)\b/i);
  if (explicit) return Number(explicit[1]);
  if ((post.wordcount || 0) > 1800) return 20;
  if ((post.wordcount || 0) > 1200) return 15;
  return 10;
}

function inferDifficulty(post, time) {
  const haystack = [post.title, post.subtitle, post.description, post.truncated_body_text, post.slug]
    .map(cleanText)
    .join(' ');
  if (time >= 20 || /\b(api|automation|bot|code|dashboard|workflow|website|assistant)\b/i.test(haystack)) {
    return 'medium';
  }
  return 'easy';
}

function popularityScore(post) {
  return (
    100 +
    (post.reaction_count || 0) +
    (post.comment_count || 0) * 2 +
    (post.restacks || 0) * 3 +
    Math.min(60, Math.round((post.wordcount || 0) / 60))
  ).toFixed(2);
}

function cardComment(title) {
  return title.replace(/--/g, '-').replace(/[<>]/g, '').trim();
}

function renderToolStamp(tools) {
  return `<div class="tool-stamp"><span class="tool-name">${escapeHtml(tools.join(', '))}</span></div>`;
}

function renderCard(post) {
  const title = displayTitle(post);
  const subtitle = cleanText(post.subtitle || post.description || '');
  const teaser = firstSentence(post.description === post.subtitle ? post.truncated_body_text : (post.description || post.truncated_body_text));
  const url = post.canonical_url || `https://ideakitchen.substack.com/p/${post.slug}`;
  const date = (post.post_date || '').slice(0, 10);
  const tools = detectTools(post);
  const time = inferTime(post);
  const difficulty = inferDifficulty(post, time);

  return `                <!-- ${escapeHtml(cardComment(title))} -->
                <article class="recipe-card" data-difficulty="${difficulty}" data-time="${time}" data-popularity="${popularityScore(post)}" data-date="${date}" data-tools="${escapeHtml(tools.join(','))}">
                    <h3 class="recipe-title"><a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="recipe-link">${escapeHtml(title)}</a></h3>
                    <p class="recipe-subtitle">${escapeHtml(subtitle || 'A practical AI recipe from Idea Kitchen')}</p>
                    <div class="recipe-body">
                        <p><strong>Prep Time:</strong> ${time} min | <strong>Difficulty:</strong> ${difficulty === 'medium' ? 'Medium' : 'Easy'}</p>
                        <p class="recipe-teaser">${escapeHtml(teaser || subtitle || 'Open the full recipe on Substack.')}</p>
                        <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="read-more">Read the recipe →</a>
                    </div>
                    ${renderToolStamp(tools)}
                </article>`;
}

async function fetchArchive() {
  const posts = [];

  for (let offset = 0; ; offset += LIMIT) {
    const url = new URL(ARCHIVE_URL);
    url.searchParams.set('sort', 'new');
    url.searchParams.set('search', '');
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('limit', String(LIMIT));

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Substack archive request failed: ${response.status} ${response.statusText}`);
    }

    const batch = await response.json();
    if (!Array.isArray(batch)) {
      throw new Error('Substack archive returned an unexpected response.');
    }

    posts.push(...batch);
    if (batch.length < LIMIT) break;
  }

  return posts;
}

function replaceRecipeGrid(html, cardsHtml) {
  const start = '<!-- RECIPES_START -->';
  const end = '<!-- RECIPES_END -->';

  if (html.includes(start) && html.includes(end)) {
    return html.replace(
      new RegExp(`${start}[\\s\\S]*?${end}`),
      `${start}\n${cardsHtml}\n${' '.repeat(16)}${end}`,
    );
  }

  const updated = html.replace(
    /(<div class="recipe-grid">\s*)([\s\S]*?)(\s*<\/div>\s*<\/section>)/,
    `$1${start}\n${cardsHtml}\n${' '.repeat(16)}${end}$3`,
  );

  if (updated === html) {
    throw new Error('Could not find the recipe grid to update.');
  }

  return updated;
}

async function main() {
  const posts = await fetchArchive();
  const recipes = posts
    .filter(isRecipePost)
    .sort((a, b) => new Date(b.post_date || 0) - new Date(a.post_date || 0));

  if (recipes.length < 40) {
    throw new Error(`Expected at least 40 recipe posts, found ${recipes.length}.`);
  }

  const cardsHtml = recipes.map(renderCard).join('\n\n');
  const html = await readFile(RECIPES_PATH, 'utf8');
  const updated = replaceRecipeGrid(html, cardsHtml)
    .replace(/Showing all \d+ recipes/g, `Showing all ${recipes.length} recipes`);

  await writeFile(RECIPES_PATH, updated);
  console.log(`Synced ${recipes.length} recipes from ${posts.length} Substack archive posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
