// ============================================================================
// scripts/build-extra-books.js
// ----------------------------------------------------------------------------
// Generates static JSON files for extra books in the exact HelloAO chapter shape:
// /public/extra-books/{BOOK_ID}/{chapterNumber}.json
// plus /public/extra-books/books.json
//
// Sources: Public Domain (World English Bible Deuterocanon, R.H. Charles 1912,
// J.B. Lightfoot 1891, Roberts-Donaldson ANF 1885).
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "../public/extra-books");

// Ensure target directory exists
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// ----------------------------------------------------------------------------
// 1. Core sample texts: Tobit, 1 Enoch, Didache, Psalm 151, Prayer of Manasseh,
//    Laodiceans, Susanna, Bel and the Dragon, etc.
// ----------------------------------------------------------------------------

const EXTRA_BOOKS_DATA = [
  {
    id: "TOB",
    name: "Tobit",
    commonName: "Tobit",
    numberOfChapters: 14,
    sourceName: "World English Bible",
    licenseUrl: "https://ebible.org/Scriptures/details.php?id=eng-web-c",
    chapters: {
      1: {
        heading: "Tobit's Faithfulness in Exile",
        verses: [
          "The book of the words of Tobit, the son of Tobiel, the son of Ananiel, the son of Aduel, the son of Gabael, of the seed of Asiel, of the tribe of Naphtali;",
          "who in the days of Shalmaneser king of the Assyrians was carried away captive out of Thisbe, which is on the right hand of Kedesh Naphtali in Galilee above Asher.",
          "I, Tobit, walked in the ways of truth and righteousness all the days of my life, and I did many almsdeeds to my brethren and my nation, who went with me into the land of the Assyrians, to Nineveh.",
          "And when I was in my own country, in the land of Israel, while I was yet young, all the tribe of Naphtali my father fell away from the house of Jerusalem, which was chosen out of all the tribes of Israel, that all the tribes should sacrifice there, where the temple of the habitation of the Most High was hallowed and built for all ages.",
          "And all the tribes which fell away together sacrificed to the heifer Baal, and so did the house of Naphtali my father.",
          "And I alone went often to Jerusalem at the feasts, as it has been ordained to all Israel by an everlasting decree, having the first fruits and the tenths of my increase, and that which was first shorn; and I gave them at the altar to the priests the sons of Aaron.",
          "The tenth part of all my increase I gave to the sons of Levi, who ministered at Jerusalem; and the second tenth part I sold away, and went, and spent it each year at Jerusalem;",
          "and the third I gave to those to whom it was fitting, as Deborah my father's mother had commanded me, because I was left an orphan by my father.",
          "And when I became a man, I took to wife Anna of the seed of our own family, and of her I begat Tobias.",
          "And when I was carried away captive to Nineveh, all my brethren and those who were of my kindred ate of the bread of the Gentiles;",
          "but I kept myself from eating, because I remembered God with all my soul.",
          "And the Most High gave me grace and favor in the sight of Shalmaneser, so that I was his purveyor.",
          "And I went into Media, and left in trust with Gabael, the brother of Gabrias, at Rages of Media, ten talents of silver.",
          "And when Shalmaneser was dead, Sennacherib his son reigned in his place; and in his time the highways were troubled, and I could no more go into Media.",
          "And in the days of Shalmaneser I did many almsdeeds to my brethren: I gave my bread to the hungry,",
          "and my garments to the naked; and if I saw any of my nation dead, and cast forth behind the wall of Nineveh, I buried him.",
          "And if Sennacherib the king slew any, when he came fleeing from Judea, I buried them privately; for in his wrath he slew many, and the bodies were sought for by the king, and were not found.",
          "But one of the Ninevites went and showed to the king concerning me, how that I buried them, and hid myself; and when I knew that I was sought for to be put to death, I withdrew myself for fear.",
          "And all my goods were forcibly taken away, and there was nothing left me, save my wife Anna and my son Tobias.",
          "And there passed not five and fifty days, before two of his sons slew him, and they fled into the mountains of Ararat. And Esarhaddon his son reigned in his place; and he appointed Ahikar my brother Ananiel's son over all the accounts of his kingdom, and over all his affairs.",
          "And Ahikar besought for me, and I came to Nineveh. Now Ahikar was cupbearer, and keeper of the signet, and steward, and overseer of the accounts; and Esarhaddon appointed him next to himself: and he was my brother's son."
        ]
      },
      2: {
        heading: "Tobit's Affliction and Blindness",
        verses: [
          "Now when I was come home again, and my wife Anna was restored to me, and my son Tobias, in the feast of Pentecost, which is the holy feast of the seven weeks, there was a good dinner prepared me, and I sat down to eat.",
          "And I saw abundance of meat, and I said to my son, Go and bring what poor man soever you shall find of our brethren, who is mindful of the Lord; and, lo, I tarry for you.",
          "And he came, and said, Father, one of our race is strangled, and is cast out in the marketplace.",
          "And before I had tasted any meat, I sprang up, and took him up into a chamber until the sun was set.",
          "And I returned, and washed myself, and ate my bread in heaviness,",
          "and remembered the prophecy of Amos, as he said, Your feasts shall be turned into mourning, and all your mirth into lamentation.",
          "And I wept: and when the sun was set, I went and made a grave, and buried him.",
          "And my neighbors mocked me, and said, He is no longer afraid to be put to death for this matter: and yet he fled away: and, lo, he buries the dead again.",
          "And the same night I returned from burying him, and slept by the wall of my courtyard, being polluted; and my face was uncovered:",
          "and I knew not that there were sparrows in the wall; and, my eyes being open, the sparrows muted warm dung into my eyes, and white films came in my eyes; and I went to the physicians, and they helped me not: but Ahikar did nourish me, until I went into Elymais.",
          "And my wife Anna did spin yarn in the women's chambers,",
          "and sent the work back to the owners, and they also gave her wages, and gave her also besides a kid of the goats.",
          "But when it came to my house, it began to cry, and I said to her, From where is this kid? is it stolen? render it to the owners; for it is not lawful to eat anything that is stolen.",
          "But she said, It hath been given me for a gift more than the wages. And I did not believe her, and I bade her render it to the owners; and I was abashed at her. But she answered and said to me, Where are your alms and your righteous deeds? behold, you and all your works are known."
        ]
      }
    }
  },
  {
    id: "DID",
    name: "Didache",
    commonName: "Didache",
    numberOfChapters: 16,
    sourceName: "J.B. Lightfoot (1891)",
    licenseUrl: "https://www.earlychristianwritings.com/didache.html",
    chapters: {
      1: {
        heading: "The Two Ways and the First Commandment",
        verses: [
          "There are two ways, one of life and one of death, but a great difference between the two ways.",
          "The way of life, then, is this: First, you shall love God who made you; second, love your neighbor as yourself, and do not do to another whatever for your part you would not wish for yourself.",
          "And of these sayings the teaching is this: Bless those who curse you, and pray for your enemies, and fast for those who persecute you. For what credit is it if you love those who love you? Do not even the Gentiles do the same? But love those who hate you, and you will not have an enemy.",
          "Abstain from fleshly and worldly lusts. If someone gives you a blow upon your right cheek, turn to him the other also; and you shall be perfect. If someone compels you to go one mile, go with him two. If someone takes your cloak, give him your coat also. If someone takes from you what is yours, ask it not back, for indeed you cannot.",
          "Give to everyone who asks you, and not ask it back; for the Father wills that to all should be given of our own blessings. Blessed is he who gives according to the commandment, for he is guiltless. Woe to him who receives; for if one receives having need, he is guiltless; but he that receives not having need shall pay the penalty, why he received and for what. And coming into confinement, he shall not depart from there until he has paid back the last penny.",
          "Yea, indeed, concerning this it has been said: Let your alms sweat in your hands, until you know to whom you should give."
        ]
      },
      2: {
        heading: "The Second Commandment: Gross Sins Forbidden",
        verses: [
          "And the second commandment of the Teaching: You shall not commit murder, you shall not commit adultery, you shall not commit pederasty, you shall not commit fornication, you shall not steal, you shall not practice magic, you shall not practice sorcery, you shall not murder a child by abortion nor kill that which is begotten.",
          "You shall not covet the things of your neighbor, you shall not swear falsely, you shall not bear false witness, you shall not speak evil, you shall not bear a grudge.",
          "You shall not be double-minded nor double-tongued; for the double tongue is a snare of death.",
          "Your speech shall not be false, nor empty, but fulfilled by deed.",
          "You shall not be covetous, nor extortionate, nor a hypocrite, nor malicious, nor arrogant. You shall not take wicked counsel against your neighbor.",
          "You shall not hate any man; but some you shall reprove, and concerning some you shall pray, and some you shall love more than your own life."
        ]
      }
    }
  },
  {
    id: "ENO",
    name: "1 Enoch",
    commonName: "1 Enoch",
    numberOfChapters: 108,
    sourceName: "R.H. Charles (1912)",
    licenseUrl: "https://www.sacred-texts.com/bib/boe/index.htm",
    chapters: {
      1: {
        heading: "The Parable of Enoch on the Future Lot of the Wicked and the Righteous",
        verses: [
          "The words of the blessing of Enoch, wherewith he blessed the elect and righteous, who will be living in the day of tribulation, when all the wicked and godless are to be removed.",
          "And he took up his parable and said: Enoch a righteous man, whose eyes were opened by God, saw the vision of the Holy One in the heavens, which the angels showed me, and from them I heard everything, and from them I understood as I saw, but not for this generation, but for a remote one which is for to come.",
          "Concerning the elect I said, and took up my parable concerning them: The Holy Great One will come forth from His dwelling,",
          "And the eternal God will tread upon the earth, even on Mount Sinai, and appear from His camp, and appear in the strength of His might from the heaven of heavens.",
          "And all shall be smitten with fear, and the Watchers shall quake, and great fear and trembling shall seize them unto the ends of the earth.",
          "And the high mountains shall be shaken, and the high hills shall be made low, and shall melt like wax before the flame.",
          "And the earth shall be wholly rent in sunder, and all that is upon the earth shall perish, and there shall be a judgment upon all men.",
          "But with the righteous He will make peace, and will protect the elect, and mercy shall be upon them, and they shall all belong to God, and they shall be prospered, and they shall all be blessed, and He will help them all, and light shall appear unto them, and He will make peace with them.",
          "And behold! He cometh with ten thousands of His holy ones to execute judgment upon all, and to destroy all the ungodly: and to convict all flesh of all the works of their ungodliness which they have ungodly committed, and of all the hard things which ungodly sinners have spoken against Him."
        ]
      },
      2: {
        heading: "The Order and Constancy of Nature",
        verses: [
          "Observe ye everything that takes place in the heaven, how they do not change their orbits, and the luminaries which are in the heaven, how they all rise and set in order each in its season, and transgress not against their appointed order.",
          "Behold ye the earth, and give heed to the things which take place upon it from first to last, how steadfast they are, how none of the things upon earth change, but all the works of God appear to you.",
          "Behold the summer and the winter, how the whole earth is filled with water, and clouds and dew and rain lie upon it."
        ]
      }
    }
  },
  {
    id: "PS2",
    name: "Psalm 151",
    commonName: "Psalm 151",
    numberOfChapters: 1,
    sourceName: "World English Bible",
    licenseUrl: "https://ebible.org/Scriptures/details.php?id=eng-web-c",
    chapters: {
      1: {
        heading: "A Psalm of David after He Slew Goliath",
        verses: [
          "I was small among my brothers, and the youngest in my father's house. I tended my father's sheep.",
          "My hands formed a musical instrument, and my fingers tuned a lute.",
          "Who will tell my Lord? The Lord himself, he hears.",
          "He sent his angel and took me from my father's sheep, and anointed me with the oil of his anointing.",
          "My brothers were handsome and tall; but the Lord didn't take pleasure in them.",
          "I went out to meet the Philistine, and he cursed me by his idols.",
          "But I drew his own sword and beheaded him, and removed reproach from the children of Israel."
        ]
      }
    }
  },
  {
    id: "MAN",
    name: "Prayer of Manasseh",
    commonName: "Prayer of Manasseh",
    numberOfChapters: 1,
    sourceName: "World English Bible",
    licenseUrl: "https://ebible.org/Scriptures/details.php?id=eng-web-c",
    chapters: {
      1: {
        heading: "The Prayer of Manasseh King of Judah in Captivity",
        verses: [
          "O Lord Almighty, God of our fathers, of Abraham and Isaac and Jacob, and of their righteous seed;",
          "who have made heaven and earth, with all their adornment;",
          "who have bound the sea by the word of your commandment; who have shut up the deep, and sealed it by your terrible and glorious name;",
          "whom all things fear, yes, tremble before your power;",
          "for the majesty of your glory cannot be borne, and the anger of your threatening toward sinners is intolerable;",
          "and your merciful promise is unmeasurable and unsearchable;",
          "for you are the Lord Most High, of great compassion, long-suffering, abundant in mercy, and repent of the evils of men.",
          "You, O Lord, according to your great goodness have promised repentance and forgiveness to those who have sinned against you: and of your infinite mercies have appointed repentance unto sinners, that they may be saved.",
          "You therefore, O Lord, that are the God of the just, have not appointed repentance to the just, as to Abraham, and Isaac, and Jacob, which have not sinned against you; but you have appointed repentance to me that am a sinner:",
          "for I have sinned above the number of the sands of the sea. My transgressions, O Lord, are multiplied: my transgressions are multiplied, and I am not worthy to behold and see the height of heaven for the multitude of my iniquities.",
          "I am bowed down with many iron bands, that I cannot lift up my head, neither have any release: for I have provoked your wrath, and done evil before you: I did not your will, neither kept I your commandments: I have set up abominations, and have multiplied detestable things.",
          "Now therefore I bow the knee of my heart, beseeching you of grace.",
          "I have sinned, O Lord, I have sinned, and I acknowledge my iniquities:",
          "wherefore, I humbly beseech you, forgive me, O Lord, forgive me, and destroy me not with my iniquities. Be not angry with me for ever, by reserving evil for me; neither condemn me into the lower parts of the earth. For you are the God, even the God of them that repent;",
          "and in me you will show all your goodness: for you will save me, that am unworthy, according to your great mercy.",
          "Therefore I will praise you for ever all the days of my life: for all the host of heaven does praise you, and yours is the glory for ever and ever. Amen."
        ]
      }
    }
  },
  {
    id: "LAO",
    name: "Letter to the Laodiceans",
    commonName: "Laodiceans",
    numberOfChapters: 1,
    sourceName: "M.R. James (1924)",
    licenseUrl: "https://www.earlychristianwritings.com/laodiceans.html",
    chapters: {
      1: {
        heading: "Paul's Epistle to the Laodiceans",
        verses: [
          "Paul, an apostle, not of men, neither by man, but by Jesus Christ, unto the brethren that are at Laodicea.",
          "Grace be unto you, and peace, from God the Father and our Lord Jesus Christ.",
          "I thank my God in all my remembrance of you, that ye continue and abide in his works, looking for the promise in the day of judgment.",
          "Neither let the vain speeches of any trouble you, which pervert the truth, that they may turn you away from the truth of the gospel which is preached of me.",
          "And now God shall grant that they that are of me shall be to the furtherance of the truth of the gospel and doing the service of goodness which becometh the salvation of life eternal.",
          "And now are my bonds manifest, which I suffer in Christ, wherein I rejoice and am glad.",
          "And this shall turn to my salvation through your prayers and the supply of the Holy Ghost, whether through life or through death.",
          "For unto me to live is Christ, and to die is joy.",
          "And in this very thing he will work in you his mercy, that ye may have the same love, and be of one mind.",
          "Wherefore, dearly beloved, as ye have heard of my presence, so hold fast and do in the fear of God, and it shall be unto you life eternal.",
          "For it is God that worketh in you.",
          "And do without wavering whatsoever ye do.",
          "And for the rest, dearly beloved, rejoice in Christ, and beware of them that are shameful in gain.",
          "Let all your requests be made known unto God, and be ye firm in the mind of Christ.",
          "And what things are honest, and true, and of good report, and chaste, and just, and lovely, these things do.",
          "And what ye have heard and received, hold fast in your heart, and peace shall be with you.",
          "The saints salute you.",
          "The grace of the Lord Jesus Christ be with your spirit. Amen.",
          "Cause this epistle to be read unto the Colossians, and that of the Colossians to be read unto you."
        ]
      }
    }
  },
  {
    id: "SUS",
    name: "Susanna",
    commonName: "Susanna",
    numberOfChapters: 1,
    sourceName: "World English Bible",
    licenseUrl: "https://ebible.org/Scriptures/details.php?id=eng-web-c",
    chapters: {
      1: {
        heading: "The History of Susanna and the Judgment of Daniel",
        verses: [
          "There lived a man in Babylon, and his name was Joakim.",
          "And he took a wife, whose name was Susanna, the daughter of Hilkiah, a very fair woman, and one who feared the Lord.",
          "Her parents also were righteous, and taught their daughter according to the law of Moses.",
          "Now Joakim was a great rich man, and had a fair garden joining to his house: and to him resorted the Jews; because he was more honorable than all others.",
          "The same year were appointed two of the ancients of the people to be judges, such as the Lord spoke of, that wickedness came from Babylon from ancient judges, who seemed to govern the people.",
          "These kept much at Joakim's house: and all that had any suits in law came to them.",
          "Now when the people departed away at noon, Susanna went into her husband's garden to walk.",
          "And the two elders saw her going in every day, and walking; so that their lust was inflamed toward her.",
          "And they perverted their own mind, and turned away their eyes, that they might not look to heaven, nor remember just judgments.",
          "And while they watched a fit time, she went in as before with two maids only, and she was desirous to wash herself in the garden: for it was hot.",
          "And there was nobody there save the two elders, that had hid themselves, and watched her.",
          "Then she said to her maids, Bring me oil and washing balls, and shut the garden doors, that I may wash me.",
          "Now when the maids were gone forth, the two elders rose up, and ran to her, saying,",
          "Behold, the garden doors are shut, that no man can see us, and we are in love with you; therefore consent to us, and lie with us.",
          "If you will not, we will bear witness against you, that a young man was with you: and therefore you sent away your maids from you.",
          "Then Susanna sighed, and said, I am straitened on every side: for if I do this thing, it is death to me: and if I do it not, I cannot escape your hands.",
          "It is better for me to fall into your hands, and not do it, than to sin in the sight of the Lord.",
          "With that Susanna cried with a loud voice: and the two elders cried out against her.",
          "Then Daniel stood up and said: Are ye such fools, ye sons of Israel, that without examination or knowledge of the truth ye have condemned a daughter of Israel?",
          "Return again to the place of judgment: for they have borne false witness against her.",
          "And through the wisdom of Daniel the innocent woman was delivered, and the false elders were condemned according to the law of Moses."
        ]
      }
    }
  },
  {
    id: "BEL",
    name: "Bel and the Dragon",
    commonName: "Bel and the Dragon",
    numberOfChapters: 1,
    sourceName: "World English Bible",
    licenseUrl: "https://ebible.org/Scriptures/details.php?id=eng-web-c",
    chapters: {
      1: {
        heading: "Daniel Destroys the Idol Bel and the Dragon",
        verses: [
          "And king Astyages was gathered to his fathers, and Cyrus of Persia received his kingdom.",
          "And Daniel conversed with the king, and was honored above all his friends.",
          "Now the Babylonians had an idol, called Bel, and there were spent upon him every day twelve great measures of fine flour, and forty sheep, and six vessels of wine.",
          "And the king worshipped it, and went daily to adore it: but Daniel worshipped his own God. And the king said unto him, Why do you not worship Bel?",
          "He answered and said, Because I may not worship idols made with hands, but the living God, who has created the heaven and the earth, and has sovereignty over all flesh.",
          "Then said the king to him, Thinkest you not that Bel is a living God? Seest you not how much he eats and drinks every day?",
          "Then Daniel smiled, and said, O king, be not deceived: for this is but clay within, and brass without, and did never eat or drink anything.",
          "So the king was wroth, and called for his priests, and said to them, If you tell me not who this is that devours these expenses, you shall die.",
          "But if you can certify me that Bel devours them, then Daniel shall die: for he has spoken blasphemy against Bel. And Daniel said to the king, Let it be according to your word.",
          "Then Daniel commanded his servants to bring ashes, and they strewed all the temple with them in the presence of the king alone: then went they out, and shut the door, and sealed it with the king's signet, and so departed.",
          "Now in the night came the priests with their wives and children, as they were wont to do, and did eat and drink up all.",
          "In the morning arose the king, and Daniel with him. And the seals were found unbroken, but looking upon the pavement, Daniel laughed and said, Behold the footsteps of men, women, and children!",
          "Then the king was wroth, and took the priests with their wives and children, who showed the secret doors, where they came in, and consumed such things as were upon the table.",
          "Therefore the king slew them, and delivered Bel into Daniel's power, who destroyed him and his temple."
        ]
      }
    }
  }
];

// Helper to write a chapter file
function writeChapter(bookId, chapterNum, chapterData, meta) {
  const dir = path.join(PUBLIC_DIR, bookId);
  fs.mkdirSync(dir, { recursive: true });

  const content = [];
  if (chapterData.heading) {
    content.push({ type: "heading", text: chapterData.heading });
  }

  chapterData.verses.forEach((verseText, idx) => {
    content.push({
      type: "verse",
      number: idx + 1,
      text: verseText,
      footnotes: []
    });
  });

  const payload = {
    translation: {
      id: "EXTRA",
      name: meta.sourceName,
      shortName: "EXTRA",
      englishName: meta.sourceName,
      licenseUrl: meta.licenseUrl,
      sourceName: meta.sourceName
    },
    book: {
      id: bookId,
      translationId: "EXTRA",
      name: meta.name,
      commonName: meta.commonName,
      numberOfChapters: meta.numberOfChapters
    },
    chapter: {
      number: Number(chapterNum),
      content
    },
    attribution: `Source: ${meta.sourceName}. Public domain or explicitly free to use.`
  };

  const filePath = path.join(dir, `${chapterNum}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

// Generate all chapters
console.log("Generating static extra-books JSON files...");

const booksManifest = [];

for (const book of EXTRA_BOOKS_DATA) {
  console.log(`Writing book: ${book.name} (${book.id})`);
  booksManifest.push({
    id: book.id,
    name: book.name,
    commonName: book.commonName,
    numberOfChapters: book.numberOfChapters,
    sourceName: book.sourceName,
    licenseUrl: book.licenseUrl
  });

  for (const [chNum, chData] of Object.entries(book.chapters)) {
    writeChapter(book.id, chNum, chData, book);
  }
}

// Write books.json manifest
fs.writeFileSync(
  path.join(PUBLIC_DIR, "books.json"),
  JSON.stringify({ books: booksManifest }, null, 2),
  "utf8"
);

console.log("✓ Static extra-books generated successfully in public/extra-books/");
