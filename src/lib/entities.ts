/**
 * Entity definitions.
 *
 * One declaration per record type drives the table columns, the form fields and
 * the validation rules, so a screen cannot drift from what the API accepts.
 * Adding a field here adds it everywhere.
 *
 * `corpusList` / `corpusKey` say how a type maps onto the public API. Types
 * with neither (topic, word) exist only in the studio — which is exactly the
 * case for glossary and topics, since the public site shows placeholders there
 * today and has no table behind them.
 */

export type FieldKind =
  | 'text' | 'textarea' | 'arabic' | 'number' | 'select' | 'switch' | 'entity';

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** Show in the list view as a column. */
  column?: boolean;
  width?: number;
  options?: Array<{ value: string; label: string }>;
  /** For `entity` fields: which type to pick from. */
  target?: EntityType;
  help?: string;
  max?: number;
}

export interface EntityDef {
  type: EntityType;
  label: string;
  labelPlural: string;
  /** Field whose value titles a record in lists and breadcrumbs. */
  titleField: string;
  /** Corpus list endpoint, when the type mirrors public data. */
  corpusList?: 'hadiths' | 'narrators' | 'books';
  fields: FieldDef[];
}

export type EntityType =
  | 'hadith' | 'narrator' | 'book' | 'author' | 'chapter' | 'word' | 'topic';

const GRADE_OPTIONS = [
  { value: 'sahih', label: 'صحیح' },
  { value: 'hasan', label: 'حسن' },
  { value: 'daif', label: 'ضعیف' },
  { value: 'unknown', label: 'نەزانراو' },
];

export const ENTITIES: Record<EntityType, EntityDef> = {
  hadith: {
    type: 'hadith',
    label: 'حەدیس',
    labelPlural: 'حەدیسەکان',
    titleField: 'matn',
    corpusList: 'hadiths',
    fields: [
      { name: 'matn', label: 'متن', kind: 'arabic', required: true, column: true },
      { name: 'full_hadith', label: 'دەقی تەواو', kind: 'arabic' },
      {
        name: 'type', label: 'جۆر', kind: 'select', column: true, width: 110,
        options: [
          { value: 'مرفوع', label: 'مرفوع' },
          { value: 'موقوف', label: 'موقوف' },
          { value: 'مقطوع', label: 'مقطوع' },
        ],
      },
      { name: 'grade', label: 'پلە', kind: 'select', column: true, width: 100, options: GRADE_OPTIONS },
      { name: 'bookTitle', label: 'پەرتووک', kind: 'text', column: true, width: 180 },
      { name: 'hadithNumber', label: 'ژمارەی حەدیس', kind: 'number', column: true, width: 110 },
      { name: 'pageNumber', label: 'لاپەڕە', kind: 'number' },
      { name: 'hukmText', label: 'حوکم', kind: 'textarea' },
      { name: 'notes', label: 'تێبینی', kind: 'textarea' },
    ],
  },

  narrator: {
    type: 'narrator',
    label: 'ڕاوی',
    labelPlural: 'ڕاویان',
    titleField: 'shohra',
    corpusList: 'narrators',
    fields: [
      { name: 'shohra', label: 'شۆهرە', kind: 'arabic', required: true, column: true },
      { name: 'name', label: 'ناوی تەواو', kind: 'arabic', required: true, column: true, width: 260 },
      { name: 'kunya', label: 'کونیە', kind: 'arabic' },
      { name: 'laqab', label: 'لەقەب', kind: 'arabic' },
      { name: 'nasab', label: 'نەسەب', kind: 'arabic' },
      { name: 'mazhab', label: 'مەزهەب', kind: 'text' },
      {
        name: 'rutba', label: 'پلە (ڕوتبە)', kind: 'number', column: true, width: 90,
        help: '١ بەرزترینە. پلەی ١–٣ بە متمانەترین دادەنرێن.', max: 12,
      },
      { name: 'rutba_description', label: 'وەسفی پلە', kind: 'text' },
      { name: 'tabaqah', label: 'تەبەقە', kind: 'number' },
      { name: 'birthdate', label: 'ساڵی لەدایکبوون', kind: 'text' },
      { name: 'deathdate', label: 'ساڵی وەفات', kind: 'text', column: true, width: 100 },
      { name: 'birth_country', label: 'شوێنی لەدایکبوون', kind: 'text' },
      { name: 'death_country', label: 'شوێنی وەفات', kind: 'text' },
      { name: 'tadlis', label: 'تدلیس', kind: 'switch', help: 'ڕاوی بە تدلیس ناسراوە' },
      { name: 'has_ikhtilat', label: 'اختلاط', kind: 'switch' },
      { name: 'description', label: 'وەسف', kind: 'textarea' },
    ],
  },

  book: {
    type: 'book',
    label: 'پەرتووک',
    labelPlural: 'پەرتووکەکان',
    titleField: 'title',
    corpusList: 'books',
    fields: [
      { name: 'title', label: 'ناونیشان', kind: 'arabic', required: true, column: true },
      { name: 'authorName', label: 'نووسەر', kind: 'arabic', column: true, width: 240 },
      { name: 'publisher', label: 'بڵاوکەرەوە', kind: 'text' },
      { name: 'edition', label: 'چاپ', kind: 'text' },
      { name: 'century', label: 'سەدە', kind: 'text', column: true, width: 90 },
      { name: 'country', label: 'وڵات', kind: 'text', column: true, width: 110 },
      { name: 'number_of_parts', label: 'ژمارەی بەرگ', kind: 'number' },
      { name: 'published_at', label: 'ساڵی بڵاوکردنەوە', kind: 'text' },
      { name: 'investor', label: 'پشکنەر', kind: 'text' },
    ],
  },

  author: {
    type: 'author',
    label: 'نووسەر',
    labelPlural: 'نووسەران',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'ناو', kind: 'arabic', required: true, column: true },
      { name: 'shohra', label: 'شۆهرە', kind: 'arabic', column: true, width: 220 },
      { name: 'kunya', label: 'کونیە', kind: 'arabic' },
      { name: 'nasab', label: 'نەسەب', kind: 'arabic' },
      { name: 'deathdate', label: 'ساڵی وەفات', kind: 'text', column: true, width: 110 },
      { name: 'notes', label: 'تێبینی', kind: 'textarea' },
    ],
  },

  chapter: {
    type: 'chapter',
    label: 'بابەت',
    labelPlural: 'بابەتەکان',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'ناوی بابەت', kind: 'arabic', required: true, column: true },
      { name: 'bookTitle', label: 'پەرتووک', kind: 'text', column: true, width: 220 },
      { name: 'sort_order', label: 'ڕیزبەندی', kind: 'number', column: true, width: 100 },
      { name: 'sharh', label: 'شەرح', kind: 'textarea' },
    ],
  },

  word: {
    type: 'word',
    label: 'وشە',
    labelPlural: 'فەرهەنگ',
    titleField: 'word',
    fields: [
      { name: 'word', label: 'وشە', kind: 'arabic', required: true, column: true, width: 180 },
      { name: 'definition', label: 'پێناسە', kind: 'textarea', required: true, column: true },
      { name: 'root', label: 'ڕەگ', kind: 'arabic', column: true, width: 110 },
      { name: 'context', label: 'دەقی نموونە', kind: 'arabic' },
    ],
  },

  topic: {
    type: 'topic',
    label: 'بابەتی گشتی',
    labelPlural: 'بابەتە گشتییەکان',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'ناو', kind: 'text', required: true, column: true, width: 220 },
      { name: 'nameAr', label: 'ناوی عەرەبی', kind: 'arabic', column: true, width: 180 },
      { name: 'description', label: 'وەسف', kind: 'textarea', column: true },
      {
        name: 'parent', label: 'بابەتی سەرەوە', kind: 'entity', target: 'topic',
        help: 'بۆ دروستکردنی هەرەمی بابەتەکان',
      },
    ],
  },
};

export const ENTITY_TYPES = Object.keys(ENTITIES) as EntityType[];

export function isEntityType(v: string): v is EntityType {
  return v in ENTITIES;
}

/**
 * Maps a corpus record onto an entity's field names.
 *
 * The public API's shapes predate these definitions (`shohra` on a narrator,
 * `authors.name` on a book), so this is where the two vocabularies meet rather
 * than scattering `?.` chains through the views.
 */
export function fromCorpus(type: EntityType, row: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case 'hadith':
      return {
        matn: row.matn ?? row.clean_matn ?? '',
        full_hadith: row.full_hadith ?? '',
        type: row.type ?? null,
        bookTitle: (row.book as { title?: string } | null)?.title ?? null,
        hadithNumber: row.hadithid ?? null,
        pageNumber: row.pageNo ?? null,
        hukmText: row.hukmText ?? null,
      };
    case 'book':
      return {
        title: row.title ?? '',
        authorName: (row.authors as { name?: string } | null)?.name ?? null,
        publisher: row.publisher ?? null,
        edition: row.edition ?? null,
        century: row.century ?? null,
        country: row.country ?? null,
        number_of_parts: row.number_of_parts ?? null,
        published_at: row.published_at ?? null,
        investor: row.investor ?? null,
      };
    case 'narrator':
      return {
        shohra: row.shohra ?? '',
        name: row.name ?? '',
        kunya: row.kunya ?? null,
        laqab: row.laqab ?? null,
        nasab: row.nasab ?? null,
        mazhab: row.mazhab ?? null,
        rutba: row.rutba ?? null,
        rutba_description: row.rutba_description ?? null,
        tabaqah: row.tabaqah ?? null,
        birthdate: row.birthdate ?? null,
        deathdate: row.deathdate ?? null,
        birth_country: row.birth_country ?? null,
        death_country: row.death_country ?? null,
        tadlis: !!row.tadlis,
        has_ikhtilat: !!row.has_ikhtilat,
        description: row.description ?? null,
      };
    default:
      return { ...row };
  }
}
