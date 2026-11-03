# Kanji study levels

`jlpt-levels.json` assigns the 95 characters in this project's eight source
chapters to N5, as requested by the learner. N5 also includes characters in
`mochi-n5.json` (transcribed from the [Mochi N5 course](https://kanji.mochidemy.com/write/1))
and OpenJLPT's N5 list. The union is 139 characters. The remaining 2,244
characters from OpenJLPT are assigned to N4–N1, with duplicates removed from
the higher levels. Lessons contain 12 characters. N5 begins with the original
95 in chapter order, then additions in Mochi and OpenJLPT list order. Imported
N4–N1 characters are ordered by school grade, usage frequency, and stroke count.

The current JLPT does not publish official per-level kanji lists. These are
course labels for study planning, not a guarantee of exam coverage.

`openjlpt.json` is a compact snapshot of all 2,383 kanji from
[OpenJLPT](https://github.com/evanclan/OpenJLPT) at commit
`0d1d3410bec90bd4098a7c72de820543cb4f707c`. It keeps readings, the first
English gloss, Kangxi radical, stroke count, grade, frequency, and one example
word when available. `n5-additions.json` provides hand-curated Vietnamese meanings
and Hán Việt for the 44 characters added to N5. Higher-level meanings currently
remain in English and are labeled EN in the UI. Mochi's character roster was
used only to select N5 characters; its displayed meaning table was not copied.

`hanviet.json` adds reference Hán Việt readings for 2,134 characters from
[kanji-data-hanviet](https://github.com/NVL4826/kanji-data-hanviet). That project
credits [KanjiDictVN](https://github.com/trungnt2910/KanjiDictVN) and the
[Hán Nôm dictionary](https://hvdic.thivien.net/) for Vietnamese readings and
definitions. These readings are study hints; they are not Japanese meanings.

`radicals.json` indexes all 2,383 characters under their classical Kangxi
dictionary radical, ordered by radical number. A dictionary radical is a lookup
classification, not a full breakdown of a character's components.

The imported dataset is adapted from OpenJLPT (CC BY-SA 4.0), which uses
JMdict and KANJIDIC2 from EDRDG, Jonathan Waller's JLPT lists, and Tatoeba.
See [OpenJLPT's notice](https://github.com/evanclan/OpenJLPT/blob/main/NOTICE.md)
and the [CC BY-SA 4.0 license](https://creativecommons.org/licenses/by-sa/4.0/).
The adapted data in this directory is shared under CC BY-SA 4.0.
