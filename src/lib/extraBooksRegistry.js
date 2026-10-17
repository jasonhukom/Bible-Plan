// ============================================================================
// extraBooksRegistry.js
// ----------------------------------------------------------------------------
// Registry and canonical placement engine for the five optional book collections:
// 1. Deuterocanonical (DC)
// 2. Orthodox (ORT)
// 3. Ethiopian Orthodox (ETH)
// 4. OT Pseudepigrapha (PSE)
// 5. NT Apocrypha (NTA)
// ============================================================================

export const EXTRA_COLLECTIONS = {
  DC: {
    id: "DC",
    shortLabel: "DC",
    name: "Deuterocanonical",
    subtitle: "Catholic canon, 7 books plus additions",
    description:
      "Adds Tobit, Judith, Additions to Esther, 1 and 2 Maccabees, Wisdom, Sirach, Baruch, Letter of Jeremiah, Prayer of Azariah and Song of the Three, Susanna, Bel and the Dragon."
  },
  ORT: {
    id: "ORT",
    shortLabel: "ORT",
    name: "Orthodox",
    subtitle: "Greek and Slavonic Orthodox additions",
    description:
      "Adds everything in DC plus 1 Esdras, Prayer of Manasseh, Psalm 151, Odes, 3 Maccabees, 4 Maccabees, 2 Esdras (Latin 4 Ezra)."
  },
  ETH: {
    id: "ETH",
    shortLabel: "ETH",
    name: "Ethiopian Orthodox",
    subtitle: "The 81-book Tewahedo canon",
    description:
      "Adds Jubilees, 1 Enoch, 1-3 Meqabyan, 4 Baruch, Ezra Sutuel (4 Ezra), 1 Esdras, plus shared DC books Ethiopia uses (Tobit, Judith, Wisdom, Sirach, Baruch, Letter of Jeremiah, Psalm 151, additions to Esther and Daniel), plus church-order books. (Note: Ethiopia uses Meqabyan instead of 1-2 Maccabees)."
  },
  PSE: {
    id: "PSE",
    shortLabel: "PSE",
    name: "OT Pseudepigrapha",
    subtitle: "Ancient Jewish writings, not in any canon",
    description:
      "Adds 1, 2, 3 Enoch, Jubilees, Life of Adam and Eve, Apocalypse of Abraham, Testament of Abraham, Joseph and Aseneth, Testaments of the Twelve Patriarchs, Letter of Aristeas, Testament of Job, Psalms of Solomon, Ascension of Isaiah, 2 Baruch, 3 Baruch, 4 Baruch, 4 Ezra, Sibylline Oracles."
  },
  NTA: {
    id: "NTA",
    shortLabel: "NTA",
    name: "NT Apocrypha",
    subtitle: "Early Christian writings outside the NT",
    description:
      "Adds Protevangelium of James, Infancy Gospel of Thomas, Gospels of Thomas, Peter, Mary, Philip, Judas, Acts of Paul, Peter, John, Thomas, 3 Corinthians, Laodiceans, Epistle of Barnabas, 1 and 2 Clement, Didache, Shepherd of Hermas, Apocalypse of Peter."
  }
};

export const COLLECTION_PRIORITY = ["DC", "ORT", "ETH", "PSE", "NTA"];

export const EXTRA_BOOKS = [
  // --------------------------------------------------------------------------
  // OLD TESTAMENT PLACEMENTS
  // --------------------------------------------------------------------------

  // Anchor: GEN (Genesis)
  {
    id: "LAE",
    name: "Life of Adam and Eve",
    commonName: "Life of Adam and Eve",
    aliases: ["Adam and Eve", "Apocalypse of Moses"],
    collections: ["PSE"],
    anchorAfter: "GEN",
    seq: 1,
    numberOfChapters: 51,
    status: "available",
    sourceName: "R.H. Charles (1913)"
  },
  {
    id: "ENO",
    name: "1 Enoch",
    commonName: "1 Enoch",
    aliases: ["Enoch", "Henoch", "Ethiopic Enoch", "Book of Enoch"],
    collections: ["PSE", "ETH"],
    anchorAfter: "GEN",
    seq: 2,
    anchorOverrides: [{ whenOn: "ETH", anchorAfter: "2CH", seq: 4 }],
    numberOfChapters: 108,
    status: "available",
    sourceName: "R.H. Charles (1912)"
  },
  {
    id: "2EN",
    name: "2 Enoch",
    commonName: "2 Enoch",
    aliases: ["Slavonic Enoch", "Secrets of Enoch"],
    collections: ["PSE"],
    anchorAfter: "GEN",
    seq: 3,
    numberOfChapters: 68,
    status: "available",
    sourceName: "W.R. Morfill & R.H. Charles (1896)"
  },
  {
    id: "3EN",
    name: "3 Enoch",
    commonName: "3 Enoch",
    aliases: ["Hebrew Enoch", "Book of Palaces", "Sefer Hekhalot"],
    collections: ["PSE"],
    anchorAfter: "GEN",
    seq: 4,
    numberOfChapters: 48,
    status: "available",
    sourceName: "Hugo Odeberg (1928)"
  },
  {
    id: "JUB",
    name: "Jubilees",
    commonName: "Jubilees",
    aliases: ["Book of Jubilees", "Kufale", "Lesser Genesis"],
    collections: ["PSE", "ETH"],
    anchorAfter: "GEN",
    seq: 5,
    anchorOverrides: [{ whenOn: "ETH", anchorAfter: "2CH", seq: 3 }],
    numberOfChapters: 50,
    status: "available",
    sourceName: "R.H. Charles (1902)"
  },
  {
    id: "AABR",
    name: "Apocalypse of Abraham",
    commonName: "Apocalypse of Abraham",
    aliases: ["Apoc. Abraham"],
    collections: ["PSE"],
    anchorAfter: "GEN",
    seq: 6,
    numberOfChapters: 32,
    status: "available",
    sourceName: "G.H. Box (1918)"
  },
  {
    id: "TABR",
    name: "Testament of Abraham",
    commonName: "Testament of Abraham",
    aliases: ["Test. Abraham"],
    collections: ["PSE"],
    anchorAfter: "GEN",
    seq: 7,
    numberOfChapters: 20,
    status: "available",
    sourceName: "G.H. Box (1927)"
  },
  {
    id: "JAS",
    name: "Joseph and Aseneth",
    commonName: "Joseph and Aseneth",
    aliases: ["Asenath", "History of Asenath"],
    collections: ["PSE"],
    anchorAfter: "GEN",
    seq: 8,
    numberOfChapters: 29,
    status: "available",
    sourceName: "E.W. Brooks (1918)"
  },
  {
    id: "T12P",
    name: "Testaments of the Twelve Patriarchs",
    commonName: "Testaments of the 12 Patriarchs",
    aliases: ["Testaments of the Patriarchs", "Testament of Reuben", "Testament of Judah"],
    collections: ["PSE"],
    anchorAfter: "GEN",
    seq: 9,
    numberOfChapters: 12,
    status: "available",
    sourceName: "R.H. Charles (1908)"
  },

  // Anchor: DEU (Deuteronomy)
  {
    id: "ARI",
    name: "Letter of Aristeas",
    commonName: "Letter of Aristeas",
    aliases: ["Aristeas"],
    collections: ["PSE"],
    anchorAfter: "DEU",
    seq: 1,
    numberOfChapters: 1,
    status: "available",
    sourceName: "H.St.J. Thackeray (1917)"
  },

  // Anchor: 2CH (2 Chronicles)
  {
    id: "MAN",
    name: "Prayer of Manasseh",
    commonName: "Prayer of Manasseh",
    aliases: ["Manasseh", "PrMan"],
    collections: ["ORT"],
    anchorAfter: "2CH",
    seq: 1,
    numberOfChapters: 1,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "1ES",
    name: "1 Esdras",
    commonName: "1 Esdras",
    aliases: ["Greek Ezra", "3 Ezra", "Esdras A"],
    collections: ["ORT", "ETH"],
    anchorAfter: "2CH",
    seq: 2,
    numberOfChapters: 9,
    status: "available",
    sourceName: "World English Bible"
  },

  // Anchor: NEH (Nehemiah)
  {
    id: "2ES",
    name: "2 Esdras",
    commonName: "2 Esdras",
    aliases: ["4 Ezra", "Ezra Sutuel", "Latin Ezra", "Apocalypse of Ezra"],
    collections: ["ORT", "ETH", "PSE"],
    anchorAfter: "NEH",
    seq: 1,
    numberOfChapters: 16,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "TOB",
    name: "Tobit",
    commonName: "Tobit",
    aliases: ["Tobias", "Book of Tobit"],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "NEH",
    seq: 2,
    numberOfChapters: 14,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "JDT",
    name: "Judith",
    commonName: "Judith",
    aliases: ["Book of Judith"],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "NEH",
    seq: 3,
    numberOfChapters: 16,
    status: "available",
    sourceName: "World English Bible"
  },

  // Anchor: EST (Esther)
  {
    id: "ESG",
    name: "Additions to Esther",
    commonName: "Additions to Esther",
    aliases: ["Greek Esther", "Rest of Esther", "Esther Additions"],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "EST",
    seq: 1,
    numberOfChapters: 6,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "1MA",
    name: "1 Maccabees",
    commonName: "1 Maccabees",
    aliases: ["1 Mac", "First Maccabees"],
    collections: ["DC", "ORT"],
    anchorAfter: "EST",
    seq: 2,
    numberOfChapters: 16,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "2MA",
    name: "2 Maccabees",
    commonName: "2 Maccabees",
    aliases: ["2 Mac", "Second Maccabees"],
    collections: ["DC", "ORT"],
    anchorAfter: "EST",
    seq: 3,
    numberOfChapters: 15,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "3MA",
    name: "3 Maccabees",
    commonName: "3 Maccabees",
    aliases: ["3 Mac", "Third Maccabees"],
    collections: ["ORT"],
    anchorAfter: "EST",
    seq: 4,
    numberOfChapters: 7,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "4MA",
    name: "4 Maccabees",
    commonName: "4 Maccabees",
    aliases: ["4 Mac", "Fourth Maccabees"],
    collections: ["ORT"],
    anchorAfter: "EST",
    seq: 5,
    numberOfChapters: 18,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "1MQ",
    name: "1 Meqabyan",
    commonName: "1 Meqabyan",
    aliases: ["First Meqabyan", "Makkabian", "Ethiopic Maccabees 1"],
    collections: ["ETH"],
    anchorAfter: "EST",
    seq: 6,
    numberOfChapters: 36,
    status: "available",
    sourceName: "DP Curtin / Ethiopic Bible Society"
  },
  {
    id: "2MQ",
    name: "2 Meqabyan",
    commonName: "2 Meqabyan",
    aliases: ["Second Meqabyan", "Ethiopic Maccabees 2"],
    collections: ["ETH"],
    anchorAfter: "EST",
    seq: 7,
    numberOfChapters: 13,
    status: "available",
    sourceName: "DP Curtin / Ethiopic Bible Society"
  },
  {
    id: "3MQ",
    name: "3 Meqabyan",
    commonName: "3 Meqabyan",
    aliases: ["Third Meqabyan", "Ethiopic Maccabees 3"],
    collections: ["ETH"],
    anchorAfter: "EST",
    seq: 8,
    numberOfChapters: 10,
    status: "available",
    sourceName: "DP Curtin / Ethiopic Bible Society"
  },

  // Anchor: JOB (Job)
  {
    id: "TJOB",
    name: "Testament of Job",
    commonName: "Testament of Job",
    aliases: ["Test. Job"],
    collections: ["PSE"],
    anchorAfter: "JOB",
    seq: 1,
    numberOfChapters: 53,
    status: "available",
    sourceName: "Conybeare / James (1897)"
  },

  // Anchor: PSA (Psalms)
  {
    id: "PS2",
    name: "Psalm 151",
    commonName: "Psalm 151",
    aliases: ["Additional Psalm", "Ps 151"],
    collections: ["ORT", "ETH"],
    anchorAfter: "PSA",
    seq: 1,
    numberOfChapters: 1,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "ODA",
    name: "Odes",
    commonName: "Odes",
    aliases: ["Odes of Solomon", "Canticles"],
    collections: ["ORT"],
    anchorAfter: "PSA",
    seq: 2,
    numberOfChapters: 14,
    status: "available",
    sourceName: "Brenton Septuagint"
  },
  {
    id: "PSS",
    name: "Psalms of Solomon",
    commonName: "Psalms of Solomon",
    aliases: ["Ps. Solomon", "Psalter of Solomon"],
    collections: ["PSE"],
    anchorAfter: "PSA",
    seq: 3,
    numberOfChapters: 18,
    status: "available",
    sourceName: "Ryle and James (1891)"
  },

  // Anchor: SNG (Song of Solomon)
  {
    id: "WIS",
    name: "Wisdom of Solomon",
    commonName: "Wisdom of Solomon",
    aliases: ["Wisdom", "Book of Wisdom", "Wisdom of Solomon"],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "SNG",
    seq: 1,
    numberOfChapters: 19,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "SIR",
    name: "Sirach",
    commonName: "Sirach",
    aliases: [
      "Ecclesiasticus",
      "Ben Sira",
      "Wisdom of Jesus Son of Sirach",
      "Wisdom of Sirach"
    ],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "SNG",
    seq: 2,
    numberOfChapters: 51,
    status: "available",
    sourceName: "World English Bible"
  },

  // Anchor: ISA (Isaiah)
  {
    id: "AISA",
    name: "Ascension of Isaiah",
    commonName: "Ascension of Isaiah",
    aliases: ["Martyrdom of Isaiah", "Vision of Isaiah"],
    collections: ["PSE"],
    anchorAfter: "ISA",
    seq: 1,
    numberOfChapters: 11,
    status: "available",
    sourceName: "R.H. Charles (1900)"
  },

  // Anchor: LAM (Lamentations)
  {
    id: "BAR",
    name: "Baruch",
    commonName: "Baruch",
    aliases: ["1 Baruch", "Book of Baruch"],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "LAM",
    seq: 1,
    numberOfChapters: 5,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "LJE",
    name: "Letter of Jeremiah",
    commonName: "Letter of Jeremiah",
    aliases: ["Epistle of Jeremiah", "Baruch 6"],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "LAM",
    seq: 2,
    numberOfChapters: 1,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "4BA",
    name: "4 Baruch",
    commonName: "4 Baruch",
    aliases: [
      "Paraleipomena of Jeremiah",
      "Rest of the Words of Baruch",
      "Paralipomena Jeremiae"
    ],
    collections: ["ETH", "PSE"],
    anchorAfter: "LAM",
    seq: 3,
    numberOfChapters: 9,
    status: "available",
    sourceName: "J. Rendel Harris (1889)"
  },
  {
    id: "2BA",
    name: "2 Baruch",
    commonName: "2 Baruch",
    aliases: ["Syriac Apocalypse of Baruch"],
    collections: ["PSE"],
    anchorAfter: "LAM",
    seq: 4,
    numberOfChapters: 87,
    status: "available",
    sourceName: "R.H. Charles (1896)"
  },
  {
    id: "3BA",
    name: "3 Baruch",
    commonName: "3 Baruch",
    aliases: ["Greek Apocalypse of Baruch"],
    collections: ["PSE"],
    anchorAfter: "LAM",
    seq: 5,
    numberOfChapters: 17,
    status: "available",
    sourceName: "H.E. Ryle & M.R. James (1897)"
  },

  // Anchor: DAN (Daniel)
  {
    id: "S3Y",
    name: "Prayer of Azariah",
    commonName: "Prayer of Azariah",
    aliases: [
      "Song of the Three Holy Children",
      "Song of the Three",
      "Daniel 3 Addition"
    ],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "DAN",
    seq: 1,
    numberOfChapters: 1,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "SUS",
    name: "Susanna",
    commonName: "Susanna",
    aliases: ["History of Susanna", "Daniel 13"],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "DAN",
    seq: 2,
    numberOfChapters: 1,
    status: "available",
    sourceName: "World English Bible"
  },
  {
    id: "BEL",
    name: "Bel and the Dragon",
    commonName: "Bel and the Dragon",
    aliases: ["Bel & Dragon", "Daniel 14"],
    collections: ["DC", "ORT", "ETH"],
    anchorAfter: "DAN",
    seq: 3,
    numberOfChapters: 1,
    status: "available",
    sourceName: "World English Bible"
  },

  // Anchor: MAL (Malachi)
  {
    id: "SIB",
    name: "Sibylline Oracles",
    commonName: "Sibylline Oracles",
    aliases: ["Sibyl", "Sibylline Books"],
    collections: ["PSE"],
    anchorAfter: "MAL",
    seq: 1,
    numberOfChapters: 14,
    status: "available",
    sourceName: "M.S. Terry (1899)"
  },

  // --------------------------------------------------------------------------
  // NEW TESTAMENT PLACEMENTS
  // --------------------------------------------------------------------------

  // Anchor: JHN (John)
  {
    id: "PJAM",
    name: "Protevangelium of James",
    commonName: "Protevangelium of James",
    aliases: ["Infancy Gospel of James", "Birth of Mary"],
    collections: ["NTA"],
    anchorAfter: "JHN",
    seq: 1,
    numberOfChapters: 25,
    status: "available",
    sourceName: "Alexander Walker (ANF 1885)"
  },
  {
    id: "IGTH",
    name: "Infancy Gospel of Thomas",
    commonName: "Infancy Gospel of Thomas",
    aliases: ["Thomas Infancy Gospel"],
    collections: ["NTA"],
    anchorAfter: "JHN",
    seq: 2,
    numberOfChapters: 19,
    status: "available",
    sourceName: "Alexander Walker (ANF 1885)"
  },
  {
    id: "GTHO",
    name: "Gospel of Thomas",
    commonName: "Gospel of Thomas",
    aliases: ["Sayings of Jesus", "Coptic Gospel of Thomas"],
    collections: ["NTA"],
    anchorAfter: "JHN",
    seq: 3,
    numberOfChapters: 1,
    status: "available",
    sourceName: "Public Domain Coptic Translation"
  },
  {
    id: "GPET",
    name: "Gospel of Peter",
    commonName: "Gospel of Peter",
    aliases: ["Petrine Gospel"],
    collections: ["NTA"],
    anchorAfter: "JHN",
    seq: 4,
    numberOfChapters: 1,
    status: "available",
    sourceName: "J. Armitage Robinson (1893)"
  },
  {
    id: "GMAR",
    name: "Gospel of Mary",
    commonName: "Gospel of Mary",
    aliases: ["Mary Magdalene", "Gospel of Mary Magdalene"],
    collections: ["NTA"],
    anchorAfter: "JHN",
    seq: 5,
    numberOfChapters: 1,
    status: "available",
    sourceName: "Public Domain Berlin Codex"
  },
  {
    id: "GPHI",
    name: "Gospel of Philip",
    commonName: "Gospel of Philip",
    aliases: ["Philip"],
    collections: ["NTA"],
    anchorAfter: "JHN",
    seq: 6,
    numberOfChapters: 1,
    status: "available",
    sourceName: "Public Domain Nag Hammadi Translation"
  },
  {
    id: "GJUD",
    name: "Gospel of Judas",
    commonName: "Gospel of Judas",
    aliases: ["Judas"],
    collections: ["NTA"],
    anchorAfter: "JHN",
    seq: 7,
    numberOfChapters: 1,
    status: "coming_soon",
    sourceName: "Under modern copyright"
  },

  // Anchor: ACT (Acts)
  {
    id: "APAU",
    name: "Acts of Paul",
    commonName: "Acts of Paul",
    aliases: ["Paul and Thecla", "Acts of Paul and Thecla"],
    collections: ["NTA"],
    anchorAfter: "ACT",
    seq: 1,
    numberOfChapters: 14,
    status: "available",
    sourceName: "Alexander Walker (ANF 1885)"
  },
  {
    id: "APET",
    name: "Acts of Peter",
    commonName: "Acts of Peter",
    aliases: ["Vercelli Acts", "Acts of Simon Peter"],
    collections: ["NTA"],
    anchorAfter: "ACT",
    seq: 2,
    numberOfChapters: 12,
    status: "available",
    sourceName: "M.R. James (1924)"
  },
  {
    id: "AJHN",
    name: "Acts of John",
    commonName: "Acts of John",
    aliases: ["Johannine Acts"],
    collections: ["NTA"],
    anchorAfter: "ACT",
    seq: 3,
    numberOfChapters: 18,
    status: "available",
    sourceName: "M.R. James (1924)"
  },
  {
    id: "ATHM",
    name: "Acts of Thomas",
    commonName: "Acts of Thomas",
    aliases: ["Thomas in India", "Hymn of the Pearl"],
    collections: ["NTA"],
    anchorAfter: "ACT",
    seq: 4,
    numberOfChapters: 16,
    status: "available",
    sourceName: "M.R. James (1924)"
  },

  // Anchor: 2CO (2 Corinthians)
  {
    id: "3CO",
    name: "3 Corinthians",
    commonName: "3 Corinthians",
    aliases: ["Third Corinthians", "Epistle to the Corinthians 3"],
    collections: ["NTA"],
    anchorAfter: "2CO",
    seq: 1,
    numberOfChapters: 2,
    status: "available",
    sourceName: "M.R. James (1924)"
  },

  // Anchor: COL (Colossians)
  {
    id: "LAO",
    name: "Letter to the Laodiceans",
    commonName: "Laodiceans",
    aliases: ["Epistle to the Laodiceans", "Letter to Laodicea"],
    collections: ["NTA"],
    anchorAfter: "COL",
    seq: 1,
    numberOfChapters: 1,
    status: "available",
    sourceName: "M.R. James (1924)"
  },

  // Anchor: REV (Revelation)
  {
    id: "SND",
    name: "Sinodos",
    commonName: "Sinodos",
    aliases: ["Ethiopic Synodus", "Canons of the Apostles"],
    collections: ["ETH"],
    anchorAfter: "REV",
    seq: 1,
    numberOfChapters: 8,
    status: "available",
    sourceName: "George Horner (1904)"
  },
  {
    id: "COV",
    name: "Book of the Covenant",
    commonName: "Book of the Covenant",
    aliases: ["Masehafa Kidan", "Testament of our Lord"],
    collections: ["ETH"],
    anchorAfter: "REV",
    seq: 2,
    numberOfChapters: 2,
    status: "available",
    sourceName: "James Cooper & Arthur Maclean (1902)"
  },
  {
    id: "ECLM",
    name: "Ethiopic Clement",
    commonName: "Ethiopic Clement",
    aliases: ["Qalementos", "Book of Clement"],
    collections: ["ETH"],
    anchorAfter: "REV",
    seq: 3,
    numberOfChapters: 7,
    status: "available",
    sourceName: "E.A. Wallis Budge (1910)"
  },
  {
    id: "EDID",
    name: "Ethiopic Didascalia",
    commonName: "Ethiopic Didascalia",
    aliases: ["Didascalia", "Apostolic Constitutions Ethiopic"],
    collections: ["ETH"],
    anchorAfter: "REV",
    seq: 4,
    numberOfChapters: 43,
    status: "available",
    sourceName: "Thomas Pell Platt (1834)"
  },
  {
    id: "BARN",
    name: "Epistle of Barnabas",
    commonName: "Epistle of Barnabas",
    aliases: ["Barnabas"],
    collections: ["NTA"],
    anchorAfter: "REV",
    seq: 5,
    numberOfChapters: 21,
    status: "available",
    sourceName: "J.B. Lightfoot (1891)"
  },
  {
    id: "HERM",
    name: "Shepherd of Hermas",
    commonName: "Shepherd of Hermas",
    aliases: ["Hermas", "The Shepherd"],
    collections: ["NTA"],
    anchorAfter: "REV",
    seq: 6,
    numberOfChapters: 27,
    status: "available",
    sourceName: "J.B. Lightfoot (1891)"
  },
  {
    id: "1CL",
    name: "1 Clement",
    commonName: "1 Clement",
    aliases: ["First Clement", "Letter of Clement to Corinthians"],
    collections: ["NTA"],
    anchorAfter: "REV",
    seq: 7,
    numberOfChapters: 65,
    status: "available",
    sourceName: "J.B. Lightfoot (1891)"
  },
  {
    id: "2CL",
    name: "2 Clement",
    commonName: "2 Clement",
    aliases: ["Second Clement", "Ancient Christian Homily"],
    collections: ["NTA"],
    anchorAfter: "REV",
    seq: 8,
    numberOfChapters: 20,
    status: "available",
    sourceName: "J.B. Lightfoot (1891)"
  },
  {
    id: "DID",
    name: "Didache",
    commonName: "Didache",
    aliases: ["Teaching of the Twelve Apostles", "Teaching of the 12 Apostles"],
    collections: ["NTA"],
    anchorAfter: "REV",
    seq: 9,
    numberOfChapters: 16,
    status: "available",
    sourceName: "J.B. Lightfoot (1891)"
  },
  {
    id: "APET2",
    name: "Apocalypse of Peter",
    commonName: "Apocalypse of Peter",
    aliases: ["Revelation of Peter"],
    collections: ["NTA"],
    anchorAfter: "REV",
    seq: 10,
    numberOfChapters: 14,
    status: "available",
    sourceName: "M.R. James (1924)"
  }
];

/**
 * Returns the primary collection badge code for a book given currently active collections.
 * Uses priority order: DC > ORT > ETH > PSE > NTA.
 */
export function getPrimaryCollectionBadge(bookCollections, activeCollections = {}) {
  if (!bookCollections || !bookCollections.length) return null;
  for (const col of COLLECTION_PRIORITY) {
    if (activeCollections[col] && bookCollections.includes(col)) {
      return col;
    }
  }
  return bookCollections[0];
}

/**
 * Resolves the effective anchor and sequence for an extra book,
 * considering active collection overrides (e.g. Jubilees and 1 Enoch move to 2CH when ETH is on).
 */
export function resolveBookPlacement(book, activeCollections = {}) {
  let anchorAfter = book.anchorAfter;
  let seq = book.seq;

  if (book.anchorOverrides && book.anchorOverrides.length > 0) {
    for (const override of book.anchorOverrides) {
      if (activeCollections[override.whenOn]) {
        anchorAfter = override.anchorAfter;
        seq = override.seq;
        break;
      }
    }
  }

  return { anchorAfter, seq };
}

/**
 * Filters the extra books by active collections (de-duplicated union)
 * and resolves their canonical anchor and sequence.
 */
export function getEnabledExtraBooks(activeCollections = {}) {
  const activeKeys = Object.keys(activeCollections).filter((k) => Boolean(activeCollections[k]));
  if (activeKeys.length === 0) return [];

  const matched = EXTRA_BOOKS.filter((book) =>
    book.collections.some((col) => Boolean(activeCollections[col]))
  );

  return matched.map((book) => {
    const { anchorAfter, seq } = resolveBookPlacement(book, activeCollections);
    const primaryBadge = getPrimaryCollectionBadge(book.collections, activeCollections);
    return {
      ...book,
      isExtra: true,
      resolvedAnchor: anchorAfter,
      resolvedSeq: seq,
      primaryBadge
    };
  });
}

/**
 * Canonical book names lookup for formatting "Where they go" preview.
 */
const CANONICAL_NAMES = {
  GEN: "Genesis",
  DEU: "Deuteronomy",
  "2CH": "2 Chronicles",
  NEH: "Nehemiah",
  EST: "Esther",
  JOB: "Job",
  PSA: "Psalms",
  SNG: "Song of Solomon",
  ISA: "Isaiah",
  LAM: "Lamentations",
  DAN: "Daniel",
  MAL: "Malachi",
  JHN: "John",
  ACT: "Acts",
  "2CO": "2 Corinthians",
  COL: "Colossians",
  REV: "Revelation"
};

/**
 * Generates dynamic human-readable "Where they go" summary for a collection.
 * Example output: "After Nehemiah: Tobit, Judith • After Esther: Additions to Esther, 1-2 Maccabees"
 */
export function getWhereTheyGoPreview(collectionId) {
  const booksInCollection = EXTRA_BOOKS.filter((b) => b.collections.includes(collectionId));
  if (!booksInCollection.length) return "No placement data.";

  // Group books by their default anchor
  const groups = {};
  for (const b of booksInCollection) {
    const anchor = b.anchorAfter;
    if (!groups[anchor]) groups[anchor] = [];
    groups[anchor].push(b.name || b.commonName);
  }

  return Object.entries(groups)
    .map(([anchor, titles]) => {
      const anchorName = CANONICAL_NAMES[anchor] || anchor;
      return `After ${anchorName}: ${titles.join(", ")}`;
    })
    .join(" • ");
}

/**
 * Core merge algorithm:
 * Merges canonical 66 books with enabled extra books.
 * Extra books are grouped by their resolved anchor, sorted by seq,
 * and inserted directly after the anchor book.
 * If all collections are off, returns original books array unchanged.
 */
export function mergeBooksWithExtras(canonicalBooks = [], activeCollections = {}) {
  const activeKeys = Object.keys(activeCollections).filter((k) => Boolean(activeCollections[k]));
  if (activeKeys.length === 0 || !canonicalBooks.length) {
    return canonicalBooks;
  }

  const enabledExtras = getEnabledExtraBooks(activeCollections);
  if (enabledExtras.length === 0) {
    return canonicalBooks;
  }

  // Group extras by resolvedAnchor
  const extrasByAnchor = {};
  for (const extra of enabledExtras) {
    const anchor = extra.resolvedAnchor;
    if (!extrasByAnchor[anchor]) extrasByAnchor[anchor] = [];
    extrasByAnchor[anchor].push(extra);
  }

  // Sort each anchor group by resolvedSeq
  for (const anchor in extrasByAnchor) {
    extrasByAnchor[anchor].sort((a, b) => a.resolvedSeq - b.resolvedSeq);
  }

  // Construct the merged list
  const merged = [];
  const processedAnchors = new Set();

  for (const book of canonicalBooks) {
    merged.push(book);
    const anchorId = book.id;
    if (extrasByAnchor[anchorId]) {
      merged.push(...extrasByAnchor[anchorId]);
      processedAnchors.add(anchorId);
    }
  }

  // Append any extras whose anchor was not found in canonicalBooks (fallback)
  for (const anchor in extrasByAnchor) {
    if (!processedAnchors.has(anchor)) {
      merged.push(...extrasByAnchor[anchor]);
    }
  }

  return merged;
}

/**
 * Checks if a search query matches a book by name, commonName, id, or aliases.
 */
export function matchesBookSearch(book, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if ((book.name || "").toLowerCase().includes(q)) return true;
  if ((book.commonName || "").toLowerCase().includes(q)) return true;
  if ((book.id || "").toLowerCase().includes(q)) return true;

  if (Array.isArray(book.aliases)) {
    return book.aliases.some((alias) => alias.toLowerCase().includes(q));
  }

  return false;
}
