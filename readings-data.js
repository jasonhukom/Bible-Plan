/* ==========================================================================
   readings-data.js
   ------------------------------------------------------------------------
   The Bible reading plan itself, straight from bibleplan.csv.

   To extend the plan later (e.g. once you have the next chunk of the
   year), just paste the additional CSV rows at the end of the string
   below, keeping the same three-column "Date","Passage","Verses" format
   and staying in consecutive-day order. No other file needs to change.
   ========================================================================== */

const READINGS_CSV_RAW = `"Date","Passage"
"2026-09-01","Gen 1-7; Mat 1-2; Ps 1; Pro 1","232"
"2026-09-02","Gen 8-15; Mat 3-4; Ps 2; Pro 2","240"
"2026-09-03","Gen 16-23; Mat 5-6; Ps 3; Pro 3","292"
"2026-09-04","Gen 24-30; Mat 7-8; Ps 4; Pro 4","345"
"2026-09-05","Gen 31-38; Mat 9-10; Ps 5; Pro 5","356"
"2026-09-06","Gen 39-46; Mat 11-12; Ps 6; Pro 6","351"
"2026-09-07","Gen 47-50; Ex 1-3; Mat 13-15; Ps 7; Pro 7","314"
"2026-09-08","Ex 4-11; Mat 16-17; Ps 8; Pro 8","270"
"2026-09-09","Ex 12-19; Mat 18-19; Ps 9; Pro 9","300"
"2026-09-10","Ex 20-26; Mat 20-21; Ps 10; Pro 10","301"
"2026-09-11","Ex 27-34; Mat 22-23; Ps 11; Pro 11","344"
"2026-09-12","Ex 35-40; Lev 1-2; Mat 24-25; Ps 12; Pro 12","344"
"2026-09-13","Lev 3-9; Mat 26-27; Ps 13; Pro 13","340"
"2026-09-14","Lev 10-17; Mat 28; Mk 1-2; Ps 14; Pro 14","367"
"2026-09-15","Lev 18-25; Mk 3-4; Ps 15; Pro 15","349"
"2026-09-16","Lev 26-27; Num 1-5; Mk 5-6; Ps 16; Pro 16","398"
"2026-09-17","Num 6-13; Mk 7-8; Ps 17; Pro 17","360"
"2026-09-18","Num 14-21; Mk 9-10; Ps 18; Pro 18","369"
"2026-09-19","Num 22-28; Mk 11-12; Ps 19; Pro 19","310"
"2026-09-20","Num 29-36; Mk 13-14; Ps 20; Pro 20","393"
"2026-09-21","Deut 1-8; Mk 15-16; Luk 1; Ps 21; Pro 21","412"
"2026-09-22","Deut 9-15; Luk 2-3; Ps 22; Pro 22","275"
"2026-09-23","Deut 16-23; Luk 4-5; Ps 23; Pro 23","266"
"2026-09-24","Deut 24-31; Luk 6-7; Ps 24; Pro 24","332"
"2026-09-25","Deut 32-34; Josh 1-4; Luk 8-9; Ps 25; Pro 25","294"
"2026-09-26","Josh 5-12; Luk 10-11; Ps 26; Pro 26","316"
"2026-09-27","Josh 13-20; Luk 12-14; Ps 27; Pro 27","356"
"2026-09-28","Josh 21-24; Jdg 1-3; Luk 15-16; Ps 28; Pro 28","281"
"2026-09-29","Jdg 4-11; Luk 17-18; Ps 29; Pro 29","350"
"2026-09-30","Jdg 12-19; Luk 19-20; Ps 30; Pro 30","280"
"2026-10-01","Jdg 20-21; Rut 1-4; 1 Sa 1-2; Luk 21-22; Ps 31; Pro 31","331"
"2026-10-02","1 Sa 3-9; Luk 23-24; Ps 32; Pro 1","251"
"2026-10-03","1 Sa 10-17; John 1-2; Ps 33; Pro 2","334"
"2026-10-04","1 Sa 18-25; John 3-5; Ps 34; Pro 3","366"
"2026-10-05","1 Sa 26-31; 2 Sa 1; John 6-7; Ps 35; Pro 4","268"
"2026-10-06","2 Sa 2-9; John 8-9; Ps 36; Pro 5","291"
"2026-10-07","2 Sa 10-17; John 10-11; Ps 37; Pro 6","337"
"2026-10-08","2 Sa 18-24; John 12-13; Ps 38; Pro 7","327"
"2026-10-09","1 Kgs 1-8; John 14-15; Ps 39; Pro 8","392"
"2026-10-10","1 Kgs 9-16; John 16-17; Ps 40; Pro 9","325"
"2026-10-11","1 Kgs 17-22; 2 Kgs 1; John 18-20; Ps 41; Pro 10","347"
"2026-10-12","2 Kgs 2-9; John 21; Acts 1; Ps 42; Pro 11","293"
"2026-10-13","2 Kgs 10-17; Acts 2-3; Ps 43; Pro 12","304"
"2026-10-14","2 Kgs 18-24; Acts 4-5; Ps 44; Pro 13","277"
"2026-10-15","2 Kgs 25; 1 Chr 1-7; Acts 6-7; Ps 45; Pro 14","428"
"2026-10-16","1 Chr 8-15; Acts 8-9; Ps 46; Pro 15","328"
"2026-10-17","1 Chr 16-22; Acts 10-11; Ps 47; Pro 16","241"
"2026-10-18","1 Chr 23-29; 2 Chr 1; Acts 12-14; Ps 48; Pro 17","333"
"2026-10-19","2 Chr 2-9; Acts 15-16; Ps 49; Pro 18","265"
"2026-10-20","2 Chr 10-16; Acts 17-18; Ps 50; Pro 19","190"
"2026-10-21","2 Chr 17-24; Acts 19-20; Ps 51; Pro 20","260"
"2026-10-22","2 Chr 25-32; Acts 21-22; Ps 52; Pro 21","274"
"2026-10-23","2 Chr 33-36; Ezr 1-3; Acts 23-24; Ps 53; Pro 22","264"
"2026-10-24","Ezr 4-10; Neh 1; Acts 25-27; Ps 54; Pro 23","300"
"2026-10-25","Neh 2-9; Acts 28; Rom 1; Ps 55; Pro 24","305"
"2026-10-26","Neh 10-13; Est 1-3; Rom 2-3; Ps 56; Pro 25","273"
"2026-10-27","Est 4-10; Job 1; Rom 4-5; Ps 57; Pro 26","175"
"2026-10-28","Job 2-9; Rom 6-7; Ps 58; Pro 27","243"
"2026-10-29","Job 10-16; Rom 8-9; Ps 59; Pro 28","246"
"2026-10-30","Job 17-24; Rom 10-11; Ps 60; Pro 29","258"
"2026-10-31","Job 25-32; Rom 12-14; Ps 61; Pro 30","247"
"2026-11-01","Job 33-40; Rom 15-16; Ps 62; Pro 31","298"
"2026-11-02","Job 41-42; Ps 1-5; 1 Co 1-2; Pro 1","144"
"2026-11-03","Ps 6-13; 1 Co 3-4; Pro 2","139"
"2026-11-04","Ps 14-21; 1 Co 5-6; Pro 3","157"
"2026-11-05","Ps 22-28; 1 Co 7-8; Pro 4","157"
"2026-11-06","Ps 29-36; 1 Co 9-10; Pro 5","202"
"2026-11-07","Ps 37-44; 1 Co 11-13; Pro 6","225"
"2026-11-08","Ps 45-51; 1 Co 14-15; Pro 7","211"
"2026-11-09","Ps 52-59; 1 Co 16; 2 Co 1; Pro 8","145"
"2026-11-10","Ps 60-67; 2 Co 2-3; Pro 9","128"
"2026-11-11","Ps 68-74; 2 Co 4-5; Pro 10","210"
"2026-11-12","Ps 75-82; 2 Co 6-7; Pro 11","204"
"2026-11-13","Ps 83-90; 2 Co 8-10; Pro 12","211"
"2026-11-14","Ps 91-97; 2 Co 11-12; Pro 13","149"
"2026-11-15","Ps 98-105; 2 Co 13; Gal 1; Pro 14","199"
"2026-11-16","Ps 106-113; Gal 2-3; Pro 15","221"
"2026-11-17","Ps 114-120; Gal 4-5; Pro 16","316"
"2026-11-18","Ps 121-128; Gal 6; Eph 1; Pro 17","92"
"2026-11-19","Ps 129-136; Eph 2-3; Pro 18","133"
"2026-11-20","Ps 137-143; Eph 4-6; Pro 19","172"
"2026-11-21","Ps 144-150; Pro 1; Phil 1-2","188"
"2026-11-22","Pro 2-9; Phil 3-4; Ps 63","267"
"2026-11-23","Pro 10-16; Col 1-2; Ps 64","269"
"2026-11-24","Pro 17-24; Col 3-4; Ps 65","283"
"2026-11-25","Pro 25-31; Ecc 1; 1 Th 1-2; Ps 66","250"
"2026-11-26","Ecc 2-8; 1 Th 3-4; Ps 67; Pro 20","173"
"2026-11-27","Ecc 9-12; Sos 1-4; 1 Th 5; 2 Th 1-2; Ps 68; Pro 21","180"
"2026-11-28","Sos 5-8; Isa 1-4; 2 Th 3; 1 Ti 1; Ps 69; Pro 22","179"
"2026-11-29","Isa 5-11; 1 Ti 2-3; Ps 70; Pro 23","192"
"2026-11-30","Isa 12-19; 1 Ti 4-5; Ps 71; Pro 24","170"
"2026-12-01","Isa 20-27; 1 Ti 6; 2 Ti 1; Ps 72; Pro 25","174"
"2026-12-02","Isa 28-35; 2 Ti 2-3; Ps 73; Pro 26","209"
"2026-12-03","Isa 36-42; 2 Ti 4; Tit 1; Ps 74; Pro 27","213"
"2026-12-04","Isa 43-50; Tit 2-3; Phlm; Ps 75; Pro 28","223"
"2026-12-05","Isa 51-58; Heb 1-2; Ps 76; Pro 29","159"
"2026-12-06","Isa 59-65; Heb 3-4; Ps 77; Pro 30","157"
"2026-12-07","Isa 66; Jer 1-7; Heb 5-6; Ps 78; Pro 31","265"
"2026-12-08","Jer 8-15; Heb 7-8; Ps 79; Pro 1","224"
"2026-12-09","Jer 16-22; Heb 9-10; Ps 80; Pro 2","215"
"2026-12-10","Jer 23-30; Heb 11-13; Ps 81; Pro 3","301"
"2026-12-11","Jer 31-38; Jam 1-2; Ps 82; Pro 4","285"
"2026-12-12","Jer 39-45; Jam 3-4; Ps 83; Pro 5","157"
"2026-12-13","Jer 46-52; Lam 1; Jam 5; 1 Pe 1; Ps 84; Pro 6","332"
"2026-12-14","Lam 2-5; Eze 1-4; 1 Pe 2-3; Ps 85; Pro 7","261"
"2026-12-15","Eze 5-11; 1 Pe 4-5; Ps 86; Pro 8","167"
"2026-12-16","Eze 12-19; 2 Pe 1-2; Ps 87; Pro 9","258"
"2026-12-17","Eze 20-27; 2 Pe 3; 1 Jn 1-2; Ps 88; Pro 10","319"
"2026-12-18","Eze 28-34; 1 Jn 3-4; Ps 89; Pro 11","232"
"2026-12-19","Eze 35-42; 1 Jn 5; 2 Jn; Ps 90; Pro 12","262"
"2026-12-20","Eze 43-48; Dan 1-2; 3 Jn; Jude; Ps 91; Pro 13","274"
"2026-12-21","Dan 3-9; Rev 1-2; Ps 92; Pro 14","257"
"2026-12-22","Dan 10-12; Hos 1-5; Rev 3-4; Ps 93; Pro 15","185"
"2026-12-23","Hos 6-13; Rev 5-6; Ps 94; Pro 16","146"
"2026-12-24","Hos 14; Joe 1-3; Amo 1-3; Rev 7-9; Ps 95; Pro 17","179"
"2026-12-25","Amo 4-9; Oba; Jon 1; Rev 10-11; Ps 96; Pro 18","168"
"2026-12-26","Jon 2-4; Mic 1-5; Rev 12-13; Ps 97; Pro 19","135"
"2026-12-27","Mic 6-7; Nah 1-3; Hab 1-2; Rev 14-15; Ps 98; Pro 20","148"
"2026-12-28","Hab 3; Zep 1-3; Hag 1-2; Zec 1-2; Rev 16-17; Ps 99; Pro 21","183"
"2026-12-29","Zec 3-10; Rev 18-19; Ps 100; Pro 22","161"
"2026-12-30","Zec 11-14; Mal 1-4; Rev 20-22; Ps 101; Pro 23","178"`;

/**
 * Minimal CSV parser: handles double-quoted fields, commas/semicolons
 * inside quotes, and escaped ("") quotes. Good enough for this file
 * without pulling in a library.
 */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * READINGS: one entry per day of the plan, in original CSV order.
 * `idx` is a stable identity for each reading (its original row
 * position) that never changes even as entries get reordered or
 * pushed around on the calendar -- read status is tracked against
 * `idx`, not against a date.
 */
window.READINGS = parseCSV(READINGS_CSV_RAW.trim())
  .slice(1) // drop header row
  .map((r, i) => ({
    idx: i,
    date: r[0],
    passage: r[1],
    verses: parseInt(r[2], 10) || null
  }));
