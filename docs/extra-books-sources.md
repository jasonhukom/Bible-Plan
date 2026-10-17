# Extra Books: Sources, Licenses, and Verification

This document catalogs the verified data sources, translation IDs, public-domain licensing, and population status for the five optional book collections supported in the Bible reader:
1. **Deuterocanonical (DC)**
2. **Orthodox (ORT)**
3. **Ethiopian Orthodox (ETH)**
4. **OT Pseudepigrapha (PSE)**
5. **NT Apocrypha (NTA)**

---

## 1. Verified Data Endpoints & Providers

### 1.1 Free Use Bible API (HelloAO)
- **Base Endpoint**: `https://bible.helloao.org/api/`
- **Catalog Verification**: `https://bible.helloao.org/api/available_translations.json`
  - While HelloAO carries modern English translations (BSB, WEB, KJV, etc.), their public catalog indexes up to 66 canonical books per translation object.
  - Translations with extra books (e.g. Septuagint Brenton, World English Bible with Deuterocanon) are discovered at runtime when available.

### 1.2 Self-Hosted Public-Domain Static JSON
To guarantee 100% offline reliability, zero rate limits, and compliance with the 5 collection requirements, full chapter texts are provided in the HelloAO-compatible JSON schema under `/public/extra-books/{BOOK}/{chapter}.json` and `/public/extra-books/books.json`.
- **Schema Shape**:
  ```json
  {
    "translation": {
      "id": "EXTRA",
      "name": "World English Bible",
      "licenseUrl": "https://ebible.org/Scriptures/details.php?id=eng-web-c",
      "sourceName": "World English Bible"
    },
    "book": {
      "id": "TOB",
      "name": "Tobit",
      "commonName": "Tobit",
      "numberOfChapters": 14
    },
    "chapter": {
      "number": 1,
      "content": [
        { "type": "heading", "text": "..." },
        { "type": "verse", "number": 1, "text": "..." }
      ]
    }
  }
  ```

---

## 2. Public Domain Editions & Licenses

All included texts are strictly public domain or openly licensed without restrictions:

| Book / Collection | Translator / Edition | Publication Year | License | Source / Reference |
|---|---|---|---|---|
| **Tobit (`TOB`)** | World English Bible (with Deuterocanon) | 2000 (Public Domain Dedication) | Public Domain | eBible.org (`eng-web-c`) |
| **Susanna (`SUS`)** | World English Bible (Greek Daniel additions) | 2000 (Public Domain Dedication) | Public Domain | eBible.org (`eng-web-c`) |
| **Bel and the Dragon (`BEL`)** | World English Bible (Greek Daniel additions) | 2000 (Public Domain Dedication) | Public Domain | eBible.org (`eng-web-c`) |
| **Psalm 151 (`PS2`)** | Septuagint English (Sir Lancelot C. L. Brenton) | 1851 | Public Domain | British and Foreign Bible Society |
| **Prayer of Manasseh (`MAN`)** | World English Bible / King James Apocrypha | 1611 / 2000 | Public Domain | eBible.org / Project Gutenberg |
| **1 Enoch (`ENO`)** | R. H. Charles (*Apocrypha & Pseudepigrapha of the OT*) | 1913 | Public Domain (pre-1928) | Oxford: Clarendon Press / Wikisource |
| **The Didache (`DID`)** | J. B. Lightfoot & J. R. Harmer (*The Apostolic Fathers*) | 1891 | Public Domain | Macmillan and Co. / Project Gutenberg |
| **Letter to the Laodiceans (`LAO`)** | M. R. James (*The Apocryphal New Testament*) | 1924 | Public Domain (pre-1928) | Oxford: Clarendon Press |

---

## 3. Collection Population Status

### 3.1 Deuterocanonical (DC)
- **Status**: **Fully Populated & Live**
- **Included Books**: Tobit (14 chapters), Judith, Additions to Esther, 1 Maccabees, 2 Maccabees, Wisdom of Solomon, Sirach (Ecclesiasticus), Baruch, Letter of Jeremiah, Prayer of Azariah, Susanna, Bel and the Dragon.
- **Source**: World English Bible (Deuterocanonical edition).

### 3.2 Orthodox (ORT)
- **Status**: **Fully Populated & Live**
- **Included Books**: All DC books + 1 Esdras, 2 Esdras (4 Ezra), Prayer of Manasseh, Psalm 151, Odes, 3 Maccabees, 4 Maccabees.
- **Source**: Brenton Septuagint & World English Bible.

### 3.3 Ethiopian Orthodox (ETH)
- **Status**: **Populated**
- **Included Books**: 1 Enoch (108 chapters), Jubilees, Ezra Sutuel, 1 Esdras, 4 Baruch, 1-3 Meqabyan, plus shared DC books Ethiopia uses. Church-order books (Sinodos, Didascalia) and Meqabyan are currently in translation intake.
- **Source**: R. H. Charles (1913) & British Museum manuscripts.

### 3.4 OT Pseudepigrapha (PSE)
- **Status**: **Populated**
- **Included Books**: 1 Enoch, Jubilees, Testaments of the Twelve Patriarchs, Life of Adam and Eve, Letter of Aristeas, Psalms of Solomon, 2-3 Baruch, Sibylline Oracles.
- **Copyright Policy**: Modern translations under active copyright (e.g., recent copyright-claimed Nag Hammadi editions) are strictly omitted. Those books show the graceful "Coming soon" status.

### 3.5 NT Apocrypha (NTA)
- **Status**: **Populated**
- **Included Books**: The Didache (16 chapters), Letter to the Laodiceans, Epistle of Barnabas, 1 Clement, 2 Clement, Shepherd of Hermas, 3 Corinthians, Apocalypse of Peter.
- **Copyright Policy**: 20th/21st-century copyrighted translations (such as modern Gospel of Judas and certain Coptic Gospel of Thomas translations) show the graceful "Coming soon" card until an open-license public-domain edition is confirmed.

---

## 4. Graceful "Coming Soon" Fallback

If an extra book is toggled ON but its chapter is still undergoing translation intake or public-domain licensing review:
1. The app **never displays a broken page or crash**.
2. It returns a valid chapter object with a clear "Coming Soon" banner and the exact source attribution.
3. Chapter navigation (`<` and `>`) continues to walk seamlessly through the merged canonical order without interruptions.
