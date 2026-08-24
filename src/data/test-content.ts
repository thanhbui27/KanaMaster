import type { KanaScript } from "@/data/kana";

export type Difficulty = "easy" | "medium" | "hard";

export type TestContentItem = {
  id: string;
  text: string;
  romaji: string;
  script: KanaScript;
  difficulty: Difficulty;
};

function content(script: KanaScript, values: Array<[string, string, Difficulty?]>): TestContentItem[] {
  return values.map(([text, romaji, difficulty = "easy"], index) => ({
    id: `${script}-${index + 1}-${romaji.replace(/\s+/g, "-")}`,
    text,
    romaji,
    script,
    difficulty,
  }));
}

export const WORDS_BY_SCRIPT: Record<KanaScript, TestContentItem[]> = {
  hiragana: content("hiragana", [
    ["ねこ", "neko"], ["いぬ", "inu"], ["さかな", "sakana"], ["こころ", "kokoro"], ["むらさき", "murasaki"],
    ["やま", "yama"], ["かわ", "kawa"], ["そら", "sora"], ["はな", "hana"], ["みず", "mizu"],
    ["きって", "kitte", "medium"], ["がっこう", "gakkou", "medium"], ["でんしゃ", "densha", "medium"], ["りょこう", "ryokou", "medium"],
    ["じてんしゃ", "jitensha", "medium"], ["きょうしつ", "kyoushitsu", "medium"], ["しんぶん", "shinbun", "medium"],
    ["ちょうちょ", "choucho", "hard"], ["りゅうがく", "ryuugaku", "hard"], ["びょういん", "byouin", "hard"],
    ["しゅくだい", "shukudai", "hard"], ["おんがく", "ongaku", "medium"], ["たべもの", "tabemono"], ["ともだち", "tomodachi", "medium"],
  ]),
  katakana: content("katakana", [
    ["ネコ", "neko"], ["イヌ", "inu"], ["カメラ", "kamera"], ["ホテル", "hoteru"], ["テレビ", "terebi"],
    ["バス", "basu"], ["パン", "pan"], ["ドア", "doa"], ["ペン", "pen"], ["メモ", "memo"],
    ["ケーキ", "keeki", "medium"], ["コーヒー", "koohii", "medium"], ["スーパー", "suupaa", "medium"],
    ["タクシー", "takushii", "medium"], ["コンピューター", "konpyuutaa", "hard"], ["レストラン", "resutoran", "medium"],
    ["チョコレート", "chokoreeto", "hard"], ["サッカー", "sakkaa", "medium"], ["ベッド", "beddo", "medium"],
    ["ミュージック", "myuujikku", "hard"], ["ニュース", "nyuusu", "medium"], ["ジャケット", "jaketto", "hard"],
    ["アイス", "aisu"], ["オレンジ", "orenji", "medium"],
  ]),
};

export const PHRASES_BY_SCRIPT: Record<KanaScript, TestContentItem[]> = {
  hiragana: content("hiragana", [
    ["うみへいく", "umi e iku"], ["ほんをよむ", "hon o yomu"], ["みずをのむ", "mizu o nomu"],
    ["ねことあそぶ", "neko to asobu"], ["そらをみる", "sora o miru"], ["はなをかう", "hana o kau"],
    ["ひとりあるき", "hitori aruki", "medium"], ["おもいをつたえる", "omoi o tsutaeru", "medium"],
    ["こころあたたまる", "kokoro atatamaru", "medium"], ["でんしゃにのる", "densha ni noru", "medium"],
    ["がっこうへいく", "gakkou e iku", "medium"], ["ともだちとはなす", "tomodachi to hanasu", "medium"],
    ["きょうしつでべんきょうする", "kyoushitsu de benkyou suru", "hard"],
    ["りょこうのけいかくをたてる", "ryokou no keikaku o tateru", "hard"],
    ["あたらしいことにちょうせんする", "atarashii koto ni chousen suru", "hard"],
  ]),
  katakana: content("katakana", [
    ["バスニノル", "basu ni noru"], ["パンヲタベル", "pan o taberu"], ["テレビヲミル", "terebi o miru"],
    ["メモヲトル", "memo o toru"], ["ホテルニイク", "hoteru ni iku"], ["ドアヲアケル", "doa o akeru"],
    ["コーヒーヲノム", "koohii o nomu", "medium"], ["ケーキヲカウ", "keeki o kau", "medium"],
    ["タクシーヲヨブ", "takushii o yobu", "medium"], ["スーパーへイク", "suupaa e iku", "medium"],
    ["サッカーヲスル", "sakkaa o suru", "medium"], ["ニュースヲミル", "nyuusu o miru", "medium"],
    ["レストランデディナーヲタベル", "resutoran de dinaa o taberu", "hard"],
    ["コンピューターデレポートヲカク", "konpyuutaa de repooto o kaku", "hard"],
    ["ミュージックヲキキナガラアルク", "myuujikku o kikinagara aruku", "hard"],
  ]),
};
