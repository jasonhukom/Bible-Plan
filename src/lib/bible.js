import * as helloao from './helloao';
import * as youversion from './youversion';

export const DEFAULT_TRANSLATION_ID = "BSB";

export async function listTranslations() {
  // Fetch HelloAO translations
  const haoAll = await helloao.listTranslations();
  // Filter HelloAO to English only to avoid 1000+ random languages
  const haoEng = haoAll.filter(t => t.language === 'eng' || t.englishName.includes('English'));
  
  const haoMapped = haoEng.map(t => ({
    id: t.id,
    label: t.englishName, // Long form
    provider: 'helloao'
  }));

  // YouVersion hardcoded popular ones (since their list endpoint was giving 422)
  const yvMapped = [
    { id: 'yv-1', label: 'King James Version (YouVersion)', provider: 'youversion' },
    { id: 'yv-12', label: 'American Standard Version (YouVersion)', provider: 'youversion' },
    { id: 'yv-206', label: 'World English Bible (YouVersion)', provider: 'youversion' },
    { id: 'yv-3034', label: 'Berean Standard Bible (YouVersion)', provider: 'youversion' },
    // NIV is 111 but it requires special access. Let's include it in case the user gets a real key.
    { id: 'yv-111', label: 'New International Version (NIV - YouVersion)', provider: 'youversion' },
  ];

  return [...haoMapped, ...yvMapped];
}

export async function listBooks(translationId) {
  if (translationId.startsWith('yv-')) {
    return youversion.listBooks(translationId.replace('yv-', ''));
  } else {
    return helloao.listBooks(translationId);
  }
}

export async function getChapter(translationId, bookId, chapterNumber) {
  if (translationId.startsWith('yv-')) {
    // YouVersion expects standard USFM-like book IDs (GEN, EXO, etc.)
    // HelloAO uses GEN, EXO as well.
    return youversion.getChapter(translationId.replace('yv-', ''), bookId, chapterNumber);
  } else {
    return helloao.getChapter(translationId, bookId, chapterNumber);
  }
}
