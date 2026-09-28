export type NoteRow = { ja: string; kana: string; romaji: string; zh: string; pinyin: string; vi: string; note: string };
export type NoteSection = { title: string; intro: string; rows: NoteRow[] };
export type NoteTopic = { id: string; title: string; ja: string; description: string; tips: string[]; sections: NoteSection[] };
function rows(text: string): NoteRow[] {
  return text.trim().split("\n").map(line => {
    const [ja, kana, romaji, zh, pinyin, vi, note = ""] = line.split("|").map(v => v.trim());
    return { ja, kana, romaji, zh, pinyin, vi, note };
  });
}

export const noteTopics: NoteTopic[] = [
  { id: "numbers", title: "Số đếm", ja: "数字", description: "Từ 0 đến số lớn, biến âm hàng trăm/nghìn và cách ghép số.", tips: [
    "Số 4, 7, 9 có nhiều cách đọc. Khi đếm riêng ưu tiên よん・なな・きゅう; khi ghép giờ, tháng hoặc trợ số từ phải học cách đọc của cả cụm.",
    "Tiếng Nhật và tiếng Trung chia đơn vị lớn theo nhóm 4 chữ số: 万／万 = 10.000, 億／亿 = 100.000.000. Không đọc theo từng nhóm nghìn như tiếng Việt.",
    "Tiếng Trung: 二 (èr) dùng khi đếm số; 两 (liǎng) thường dùng trước lượng từ, như 两个人. Pinyin ở đây ghi thanh từ điển; 一 và 不 có thể đổi thanh khi nói trong cụm.",
    "Romaji dùng dấu dài: ū = kéo dài u, ō = kéo dài o. Hai phụ âm như pp/tt/kk biểu thị ngắt một nhịp trước phụ âm, không đọc thêm một nguyên âm."
  ], sections: [
    { title: "0–10 và cách ghép số", intro: "Đọc hàng chục trước hàng đơn vị: 21 = 二十 + 一. Không chèn の giữa các chữ số.", rows: rows(`
零|れい|rei|零|líng|0|ゼロ (zero) cũng thông dụng; số điện thoại có thể đọc まる.
一|いち|ichi|一|yī|1
二|に|ni|二|èr|2|两 liǎng là cách dùng khác của số hai trước nhiều lượng từ.
三|さん|san|三|sān|3
四|よん|yon|四|sì|4|し (shi) dùng trong một số tổ hợp, như 四月.
五|ご|go|五|wǔ|5
六|ろく|roku|六|liù|6
七|なな|nana|七|qī|7|しち (shichi) dùng trong 七時・七月.
八|はち|hachi|八|bā|8
九|きゅう|kyū|九|jiǔ|9|く (ku) dùng trong 九時・九月.
十|じゅう|jū|十|shí|10
十一|じゅういち|jūichi|十一|shí yī|11
十九|じゅうきゅう|jūkyū|十九|shí jiǔ|19
二十|にじゅう|nijū|二十|èr shí|20|Khác 二十歳 (はたち) và 二十日 (はつか).
二十一|にじゅういち|nijūichi|二十一|èr shí yī|21
九十九|きゅうじゅうきゅう|kyūjūkyū|九十九|jiǔ shí jiǔ|99
`) },
    { title: "Hàng trăm, nghìn và số lớn", intro: "Đặc biệt chú ý 300, 600, 800, 3.000 và 8.000; không ghép âm máy móc.", rows: rows(`
百|ひゃく|hyaku|一百|yī bǎi|100|Thông thường không nói いちひゃく.
二百|にひゃく|nihyaku|二百|èr bǎi|200|Tiếng Trung cũng dùng 两百 (liǎng bǎi).
三百|さんびゃく|sanbyaku|三百|sān bǎi|300|ひゃく đổi thành びゃく.
六百|ろっぴゃく|roppyaku|六百|liù bǎi|600|Âm ngắt っ + ぴゃく.
八百|はっぴゃく|happyaku|八百|bā bǎi|800|Không đọc はちひゃく.
千|せん|sen|一千|yī qiān|1.000
三千|さんぜん|sanzen|三千|sān qiān|3.000|せん đổi thành ぜん.
八千|はっせん|hassen|八千|bā qiān|8.000|Không đọc はちせん.
一万|いちまん|ichiman|一万|yī wàn|10.000
十万|じゅうまん|jūman|十万|shí wàn|100.000
百万|ひゃくまん|hyakuman|一百万|yī bǎi wàn|1.000.000
一千万|いっせんまん|issenman|一千万|yī qiān wàn|10.000.000|Trong số ghép này đọc いっせん.
一億|いちおく|ichioku|一亿|yī yì|100.000.000
一兆|いっちょう|itchō|一万亿|yī wàn yì|1.000.000.000.000|Dùng 万亿 trong tiếng Trung để tránh khác biệt cách hiểu chữ 兆.
一万二千三百四十五|いちまんにせんさんびゃくよんじゅうご|ichiman nisen sanbyaku yonjūgo|一万二千三百四十五|yī wàn èr qiān sān bǎi sì shí wǔ|12.345
`) }
  ] },
  { id: "clock", title: "Cách nói thời gian", ja: "時刻・日付", description: "Giờ trên đồng hồ, phút, ngày trong tuần, ngày tháng và cách hỏi.", tips: [
    "Mốc giờ: số + 時 (じ). Nhớ riêng 四時 よじ, 七時 しちじ, 九時 くじ. 午前 là AM, 午後 là PM; 12 giờ trưa có thể nói 正午 (しょうご).",
    "分 đọc ふん hoặc ぷん tùy số trước nó. Với 10 phút có cả じゅっぷん và じっぷん; bảng dùng じゅっぷん. 何分 đọc なんぷん.",
    "Ngày mùng 1 đọc ついたち; khoảng một ngày đọc いちにち. Ngày 2–10, 14, 20, 24 cần nhớ riêng. Ngày còn lại thường ghép số + にち; 17 và 19 dùng じゅうしちにち・じゅうくにち.",
    "Mốc cụ thể thường đi với に: 七時に起きます. きょう・あした・毎日 thường không thêm に. Thứ tự ngày tháng là năm → tháng → ngày."
  ], sections: [
    { title: "12 giờ trên đồng hồ", intro: "Tiếng Nhật dùng 時; tiếng Trung nói 点. Đây là thời điểm, không phải số tiếng kéo dài.", rows: rows(`
一時|いちじ|ichiji|一点|yī diǎn|1 giờ
二時|にじ|niji|两点|liǎng diǎn|2 giờ|Tiếng Trung thông dụng là 两点, không dùng 二点 trong cách nói giờ cơ bản.
三時|さんじ|sanji|三点|sān diǎn|3 giờ
四時|よじ|yoji|四点|sì diǎn|4 giờ|Không đọc よんじ.
五時|ごじ|goji|五点|wǔ diǎn|5 giờ
六時|ろくじ|rokuji|六点|liù diǎn|6 giờ
七時|しちじ|shichiji|七点|qī diǎn|7 giờ|ななじ đôi khi dùng để tránh nghe nhầm; mẫu cơ bản là しちじ.
八時|はちじ|hachiji|八点|bā diǎn|8 giờ
九時|くじ|kuji|九点|jiǔ diǎn|9 giờ|Không đọc きゅうじ.
十時|じゅうじ|jūji|十点|shí diǎn|10 giờ
十一時|じゅういちじ|jūichiji|十一点|shí yī diǎn|11 giờ
十二時|じゅうにじ|jūniji|十二点|shí èr diǎn|12 giờ
`) },
    { title: "Phút và các mẫu nói giờ", intro: "Số phút đọc giống nhau khi nói phút trên đồng hồ và độ dài tính bằng phút; ngữ cảnh quyết định nghĩa.", rows: rows(`
一分|いっぷん|ippun|一分钟|yī fēnzhōng|1 phút|ふん → ぷん, có âm ngắt.
二分|にふん|nifun|两分钟|liǎng fēnzhōng|2 phút
三分|さんぷん|sanpun|三分钟|sān fēnzhōng|3 phút
四分|よんぷん|yonpun|四分钟|sì fēnzhōng|4 phút
五分|ごふん|gofun|五分钟|wǔ fēnzhōng|5 phút
六分|ろっぷん|roppun|六分钟|liù fēnzhōng|6 phút
七分|ななふん|nanafun|七分钟|qī fēnzhōng|7 phút
八分|はっぷん|happun|八分钟|bā fēnzhōng|8 phút|はちふん cũng có dùng; bảng chọn はっぷん.
九分|きゅうふん|kyūfun|九分钟|jiǔ fēnzhōng|9 phút
十分|じゅっぷん|juppun|十分钟|shí fēnzhōng|10 phút|じっぷん cũng đúng.
十五分|じゅうごふん|jūgofun|十五分钟|shí wǔ fēnzhōng|15 phút
三十分|さんじゅっぷん|sanjuppun|三十分钟|sān shí fēnzhōng|30 phút|さんじっぷん cũng đúng.
四時半|よじはん|yoji han|四点半|sì diǎn bàn|4 giờ rưỡi|半 = nửa; ở đây thêm 30 phút.
午前七時十五分|ごぜんしちじじゅうごふん|gozen shichiji jūgofun|早上七点十五分|zǎoshang qī diǎn shí wǔ fēn|7:15 sáng
午後九時|ごごくじ|gogo kuji|晚上九点|wǎnshang jiǔ diǎn|9 giờ tối|21:00; không nhầm 午後 với chỉ buổi chiều trong tiếng Việt.
今、何時ですか。|いま、なんじですか。|ima, nanji desu ka|现在几点？|xiànzài jǐ diǎn|Bây giờ là mấy giờ?
七時に起きます。|しちじにおきます。|shichiji ni okimasu|七点起床。|qī diǎn qǐchuáng|Tôi dậy lúc 7 giờ.|に đánh dấu thời điểm.
`) },
    { title: "Ngày trong tuần", intro: "Dùng ～曜日 (ようび). Hỏi thứ mấy bằng 何曜日 (なんようび).", rows: rows(`
月曜日|げつようび|getsuyōbi|星期一|xīngqī yī|Thứ Hai
火曜日|かようび|kayōbi|星期二|xīngqī èr|Thứ Ba
水曜日|すいようび|suiyōbi|星期三|xīngqī sān|Thứ Tư
木曜日|もくようび|mokuyōbi|星期四|xīngqī sì|Thứ Năm
金曜日|きんようび|kin'yōbi|星期五|xīngqī wǔ|Thứ Sáu
土曜日|どようび|doyōbi|星期六|xīngqī liù|Thứ Bảy
日曜日|にちようび|nichiyōbi|星期日|xīngqī rì|Chủ nhật|Tiếng Trung cũng nói 星期天 (xīngqī tiān).
`) },
    { title: "12 tháng trong năm", intro: "Tháng trên lịch dùng 月 đọc がつ; khoảng nhiều tháng dùng ～か月, không dùng ～がつ.", rows: rows(`
一月|いちがつ|ichigatsu|一月|yī yuè|Tháng 1
二月|にがつ|nigatsu|二月|èr yuè|Tháng 2|二月 khác 两个月 (hai tháng).
三月|さんがつ|sangatsu|三月|sān yuè|Tháng 3
四月|しがつ|shigatsu|四月|sì yuè|Tháng 4|Không đọc よんがつ.
五月|ごがつ|gogatsu|五月|wǔ yuè|Tháng 5
六月|ろくがつ|rokugatsu|六月|liù yuè|Tháng 6
七月|しちがつ|shichigatsu|七月|qī yuè|Tháng 7
八月|はちがつ|hachigatsu|八月|bā yuè|Tháng 8
九月|くがつ|kugatsu|九月|jiǔ yuè|Tháng 9|Không đọc きゅうがつ.
十月|じゅうがつ|jūgatsu|十月|shí yuè|Tháng 10
十一月|じゅういちがつ|jūichigatsu|十一月|shí yī yuè|Tháng 11
十二月|じゅうにがつ|jūnigatsu|十二月|shí èr yuè|Tháng 12
`) },
    { title: "Ngày tháng: các cách đọc cần nhớ", intro: "Từ 11 trở đi, ghép số + 日, nhưng học riêng 14・17・19・20・24. Tiếng Trung khẩu ngữ dùng 号; văn viết cũng dùng 日 (rì).", rows: rows(`
一日|ついたち|tsuitachi|一号|yī hào|Ngày 1|Chỉ cách đọc ngày trên lịch; một ngày là いちにち.
二日|ふつか|futsuka|二号|èr hào|Ngày 2
三日|みっか|mikka|三号|sān hào|Ngày 3
四日|よっか|yokka|四号|sì hào|Ngày 4
五日|いつか|itsuka|五号|wǔ hào|Ngày 5
六日|むいか|muika|六号|liù hào|Ngày 6
七日|なのか|nanoka|七号|qī hào|Ngày 7
八日|ようか|yōka|八号|bā hào|Ngày 8|Chú ý nguyên âm dài よう.
九日|ここのか|kokonoka|九号|jiǔ hào|Ngày 9
十日|とおか|tōka|十号|shí hào|Ngày 10|Nguyên âm dài とお.
十一日|じゅういちにち|jūichinichi|十一号|shí yī hào|Ngày 11
十四日|じゅうよっか|jūyokka|十四号|shí sì hào|Ngày 14
十七日|じゅうしちにち|jūshichinichi|十七号|shí qī hào|Ngày 17
十九日|じゅうくにち|jūkunichi|十九号|shí jiǔ hào|Ngày 19
二十日|はつか|hatsuka|二十号|èr shí hào|Ngày 20
二十一日|にじゅういちにち|nijūichinichi|二十一号|èr shí yī hào|Ngày 21|Mẫu ghép thông thường.
二十四日|にじゅうよっか|nijūyokka|二十四号|èr shí sì hào|Ngày 24
三十一日|さんじゅういちにち|sanjūichinichi|三十一号|sān shí yī hào|Ngày 31
何月何日ですか。|なんがつなんにちですか。|nangatsu nannichi desu ka|几月几号？|jǐ yuè jǐ hào|Ngày mấy tháng mấy?
`) }
  ] },
  { id: "duration", title: "Khoảng thời gian", ja: "期間", description: "Phân biệt lúc nào và bao lâu; giây, phút, tiếng, ngày, tuần, tháng, năm.", tips: [
    "三時 = 3 giờ trên đồng hồ; 三時間 = kéo dài 3 tiếng. 三月 = tháng 3; 三か月 = kéo dài 3 tháng. Không dùng に sau khoảng thời gian trong mẫu 毎日二時間勉強します.",
    "Giờ kéo dài cần 時間 (じかん). Tuần dùng 週間 (しゅうかん). Phút, ngày, tháng, năm có thể thêm 間 để nhấn mạnh khoảng kéo dài nhưng không phải lúc nào cũng bắt buộc.",
    "一日: ngày mùng 1 là ついたち; kéo dài 1 ngày là いちにち. Các ngày 2–10 thường giữ cách đọc đặc biệt cả khi diễn tả số ngày.",
    "から…まで nêu điểm đầu và điểm cuối. までに nêu hạn chót hoàn thành. ～に～回 diễn tả tần suất, chẳng hạn 一週間に三回.",
    "Tiếng Trung không chia động từ theo thì như tiếng Nhật. Khi nói khoảng kéo dài đã hoàn thành, 了 thường cần xét theo cả câu, không tự thêm vào mọi ví dụ."
  ], sections: [
    { title: "Đơn vị và số lượng thời gian", intro: "Bảng ghi một cách đọc thông dụng; các cách viết か月・ヶ月・箇月 đều gặp trong thực tế.", rows: rows(`
一秒|いちびょう|ichibyō|一秒|yī miǎo|1 giây
十分間|じゅっぷんかん|juppunkan|十分钟|shí fēnzhōng|10 phút|じっぷんかん cũng đúng; có thể nói 十分.
三十分|さんじゅっぷん|sanjuppun|半个小时|bàn ge xiǎoshí|Nửa tiếng (30 phút)|さんじっぷん cũng đúng; cách diễn đạt thông dụng trong hội thoại.
一時間|いちじかん|ichijikan|一个小时|yī ge xiǎoshí|1 tiếng
二時間|にじかん|nijikan|两个小时|liǎng ge xiǎoshí|2 tiếng
四時間|よじかん|yojikan|四个小时|sì ge xiǎoshí|4 tiếng|Không đọc よんじかん.
一時間半|いちじかんはん|ichijikan han|一个半小时|yī ge bàn xiǎoshí|1 tiếng rưỡi
一日|いちにち|ichinichi|一天|yī tiān|1 ngày|Không đọc ついたち khi nói độ dài.
二日間|ふつかかん|futsukakan|两天|liǎng tiān|2 ngày
四日間|よっかかん|yokkakan|四天|sì tiān|4 ngày
十日間|とおかかん|tōkakan|十天|shí tiān|10 ngày
二十日間|はつかかん|hatsukakan|二十天|èr shí tiān|20 ngày
一週間|いっしゅうかん|isshūkan|一个星期|yī ge xīngqī|1 tuần|Có âm ngắt っ, khác いちしゅうかん.
二週間|にしゅうかん|nishūkan|两个星期|liǎng ge xīngqī|2 tuần
一か月|いっかげつ|ikkagetsu|一个月|yī ge yuè|1 tháng
三か月|さんかげつ|sankagetsu|三个月|sān ge yuè|3 tháng|Không đọc さんがつ (tháng 3).
六か月|ろっかげつ|rokkagetsu|六个月|liù ge yuè|6 tháng
一年|いちねん|ichinen|一年|yī nián|1 năm
四年間|よねんかん|yonenkan|四年|sì nián|4 năm|四年 đọc よねん, không phải よんねん.
半年|はんとし|hantoshi|半年|bàn nián|Nửa năm|Cách đọc cơ bản là はんとし.
何時間|なんじかん|nanjikan|几个小时|jǐ ge xiǎoshí|Mấy tiếng?
どのくらい|どのくらい|dono kurai|多久|duō jiǔ|Bao lâu?|Cũng có thể hỏi mức độ/khoảng cách tùy ngữ cảnh.
`) },
    { title: "Mẫu câu và những cặp dễ nhầm", intro: "Đọc cả câu để phân biệt thời điểm, thời lượng, hạn chót và tần suất.", rows: rows(`
毎日二時間勉強します。|まいにちにじかんべんきょうします。|mainichi nijikan benkyō shimasu|每天学习两个小时。|měi tiān xuéxí liǎng ge xiǎoshí|Mỗi ngày tôi học 2 tiếng.|Không thêm に sau 二時間 ở cấu trúc này.
二時に勉強します。|にじにべんきょうします。|niji ni benkyō shimasu|两点学习。|liǎng diǎn xuéxí|Tôi học lúc 2 giờ.|Đây là thời điểm nên có に.
九時から五時まで働きます。|くじからごじまではたらきます。|kuji kara goji made hatarakimasu|从九点工作到五点。|cóng jiǔ diǎn gōngzuò dào wǔ diǎn|Tôi làm việc từ 9 giờ đến 5 giờ.
五時までに帰ります。|ごじまでにかえります。|goji made ni kaerimasu|五点之前回来。|wǔ diǎn zhīqián huílai|Tôi về chậm nhất lúc 5 giờ.|までに là hạn chót, khác làm việc kéo dài đến 5 giờ.
一週間に三回運動します。|いっしゅうかんにさんかいうんどうします。|isshūkan ni sankai undō shimasu|每周运动三次。|měi zhōu yùndòng sān cì|Mỗi tuần tôi tập thể dục 3 lần.
駅まで十分かかります。|えきまでじゅっぷんかかります。|eki made juppun kakarimasu|到车站需要十分钟。|dào chēzhàn xūyào shí fēnzhōng|Đến ga mất 10 phút.|かかります nói thời gian cần thiết.
三か月前に来ました。|さんかげつまえにきました。|sankagetsu mae ni kimashita|三个月前来了。|sān ge yuè qián lái le|Tôi đã đến cách đây 3 tháng.|Khoảng + 前に là mốc tính lùi.
三日後に帰ります。|みっかごにかえります。|mikka go ni kaerimasu|三天后回去。|sān tiān hòu huíqù|Tôi về sau 3 ngày.|後 đọc ご trong cụm này.
`) }
  ] },
  { id: "counters", title: "Từ đếm, trợ số từ", ja: "助数詞", description: "Chọn đơn vị theo đồ vật; người, vật dài, vật mỏng, con vật, lần và tuổi.", tips: [
    "Tiếng Nhật: 本を三冊買います hoặc 三冊の本を買います. Không nói 三本 khi muốn đếm ba cuốn sách: chữ 本 trong tên đồ vật và trợ số từ 本 có chức năng khác nhau.",
    "～つ là cách đếm đồ vật chung từ 1 đến 10; không thay được mọi trợ số từ, đặc biệt người và nhiều ngữ cảnh chuyên biệt.",
    "Tiếng Trung cũng cần lượng từ: 三本书 là ba cuốn sách, 三张纸 là ba tờ giấy. Lượng từ hai ngôn ngữ không tương ứng một-một.",
    "Âm của trợ số từ có thể đổi: 一本 いっぽん, 三本 さんぼん, 六本 ろっぽん. Hãy ghi nhớ cả số + trợ số từ.",
    "Tuổi dùng 歳 (さい), riêng 20 tuổi là 二十歳 (はたち). Hỏi lịch sự bằng おいくつですか; hỏi bình thường bằng 何歳ですか."
  ], sections: [
    { title: "Đếm chung 1–10", intro: "Dùng khi đếm đồ vật chung trong ngữ cảnh phù hợp. Tiếng Trung dưới đây dùng lượng từ chung 个 để đối chiếu.", rows: rows(`
一つ|ひとつ|hitotsu|一个|yī ge|1 cái
二つ|ふたつ|futatsu|两个|liǎng ge|2 cái
三つ|みっつ|mittsu|三个|sān ge|3 cái
四つ|よっつ|yottsu|四个|sì ge|4 cái
五つ|いつつ|itsutsu|五个|wǔ ge|5 cái
六つ|むっつ|muttsu|六个|liù ge|6 cái
七つ|ななつ|nanatsu|七个|qī ge|7 cái
八つ|やっつ|yattsu|八个|bā ge|8 cái
九つ|ここのつ|kokonotsu|九个|jiǔ ge|9 cái
十|とお|tō|十个|shí ge|10 cái|Không có つ ở cuối.
いくつ|いくつ|ikutsu|几个|jǐ ge|Mấy cái?|Từ hỏi của nhóm ～つ.
`) },
    { title: "Chọn trợ số từ theo loại", intro: "Các ví dụ có danh từ cụ thể để bản dịch tiếng Trung chọn đúng lượng từ.", rows: rows(`
学生三人|がくせいさんにん|gakusei sannin|三个学生|sān ge xuésheng|3 học sinh|人 (にん) đếm người; 一人・二人 là ngoại lệ.
鉛筆二本|えんぴつにほん|enpitsu nihon|两支铅笔|liǎng zhī qiānbǐ|2 cây bút chì|本 (ほん): vật dài như bút, chai, ô.
紙三枚|かみさんまい|kami sanmai|三张纸|sān zhāng zhǐ|3 tờ giấy|枚 (まい): vật mỏng, phẳng.
本三冊|ほんさんさつ|hon sansatsu|三本书|sān běn shū|3 cuốn sách|冊 (さつ): sách, vở đóng quyển.
車二台|くるまにだい|kuruma nidai|两辆车|liǎng liàng chē|2 chiếc ô tô|台 (だい): xe, máy móc; lượng từ Trung thay đổi theo danh từ.
猫三匹|ねこさんびき|neko sanbiki|三只猫|sān zhī māo|3 con mèo|匹 (ひき): nhiều loài vật nhỏ; có biến âm.
馬二頭|うまにとう|uma nitō|两匹马|liǎng pǐ mǎ|2 con ngựa|頭 (とう): động vật lớn.
鳥一羽|とりいちわ|tori ichiwa|一只鸟|yī zhī niǎo|1 con chim|羽 (わ): chim; cách đọc một số số khác có biến thể.
卵二個|たまごにこ|tamago niko|两个鸡蛋|liǎng ge jīdàn|2 quả trứng|個 (こ): vật nhỏ, rời.
水一杯|みずいっぱい|mizu ippai|一杯水|yī bēi shuǐ|1 cốc nước|杯 (はい): cốc/chén chất chứa.
靴一足|くついっそく|kutsu issoku|一双鞋|yī shuāng xié|1 đôi giày|足 (そく): đếm đôi giày, tất.
一回|いっかい|ikkai|一次|yī cì|1 lần|回 (かい): số lần; khác 階 đếm tầng.
三階|さんがい|sangai|三楼|sān lóu|Tầng 3|階 thường đọc かい, nhưng 三階 đọc さんがい.
四歳|よんさい|yonsai|四岁|sì suì|4 tuổi|歳 đọc さい; 1・8・10 có âm ngắt.
`) },
    { title: "Người, tuổi và âm đặc biệt", intro: "Học các trường hợp dễ đọc sai trước; những số thường còn lại ghép số với đơn vị.", rows: rows(`
一人|ひとり|hitori|一个人|yī ge rén|1 người
二人|ふたり|futari|两个人|liǎng ge rén|2 người
四人|よにん|yonin|四个人|sì ge rén|4 người|Không đọc よんにん.
七人|しちにん|shichinin|七个人|qī ge rén|7 người|ななにん cũng được dùng.
何人|なんにん|nannin|几个人|jǐ ge rén|Mấy người?
一歳|いっさい|issai|一岁|yī suì|1 tuổi
八歳|はっさい|hassai|八岁|bā suì|8 tuổi
十歳|じゅっさい|jussai|十岁|shí suì|10 tuổi|じっさい cũng đúng.
二十歳|はたち|hatachi|二十岁|èr shí suì|20 tuổi|Cách đọc đặc biệt, không áp dụng cho số 20 nói chung.
一本|いっぽん|ippon|一支|yī zhī|1 cây (ví dụ bút)
三本|さんぼん|sanbon|三支|sān zhī|3 cây (bút)
六本|ろっぽん|roppon|六支|liù zhī|6 cây (bút)
八本|はっぽん|happon|八支|bā zhī|8 cây (bút)
十本|じゅっぽん|juppon|十支|shí zhī|10 cây (bút)|じっぽん cũng đúng.
何本|なんぼん|nanbon|几支|jǐ zhī|Mấy cây (bút)?
一匹|いっぴき|ippiki|一只|yī zhī|1 con (vật nhỏ)
三匹|さんびき|sanbiki|三只|sān zhī|3 con (vật nhỏ)
六匹|ろっぴき|roppiki|六只|liù zhī|6 con (vật nhỏ)
八匹|はっぴき|happiki|八只|bā zhī|8 con (vật nhỏ)
十匹|じゅっぴき|juppiki|十只|shí zhī|10 con (vật nhỏ)|じっぴき cũng đúng.
何匹|なんびき|nanbiki|几只|jǐ zhī|Mấy con (vật nhỏ)?
一冊|いっさつ|issatsu|一本|yī běn|1 quyển
八冊|はっさつ|hassatsu|八本|bā běn|8 quyển
十冊|じゅっさつ|jussatsu|十本|shí běn|10 quyển|じっさつ cũng đúng.
一個|いっこ|ikko|一个|yī ge|1 vật nhỏ
六個|ろっこ|rokko|六个|liù ge|6 vật nhỏ
八個|はっこ|hakko|八个|bā ge|8 vật nhỏ
十個|じゅっこ|jukko|十个|shí ge|10 vật nhỏ|じっこ cũng đúng.
三杯|さんばい|sanbai|三杯|sān bēi|3 cốc
六杯|ろっぱい|roppai|六杯|liù bēi|6 cốc
八杯|はっぱい|happai|八杯|bā bēi|8 cốc
十杯|じゅっぱい|juppai|十杯|shí bēi|10 cốc|じっぱい cũng đúng.
`) },
    { title: "Đưa số lượng vào câu", intro: "Hai cách đặt số lượng đều đúng; lượng từ tiếng Trung phải đi cùng danh từ thích hợp.", rows: rows(`
本を三冊買います。|ほんをさんさつかいます。|hon o sansatsu kaimasu|买三本书。|mǎi sān běn shū|Tôi mua 3 cuốn sách.|Danh từ + を + số lượng + động từ.
三冊の本を買います。|さんさつのほんをかいます。|sansatsu no hon o kaimasu|买三本书。|mǎi sān běn shū|Tôi mua 3 cuốn sách.|Số lượng + の + danh từ.
コーヒーを二杯ください。|こーひーをにはいください。|kōhī o nihai kudasai|请给我两杯咖啡。|qǐng gěi wǒ liǎng bēi kāfēi|Cho tôi 2 cốc cà phê.
何歳ですか。|なんさいですか。|nansai desu ka|几岁？|jǐ suì|Bao nhiêu tuổi?|Dùng phù hợp quan hệ và ngữ cảnh; hỏi lịch sự hơn bằng おいくつですか.
`) }
  ] },
  { id: "verbs", title: "Biến đổi động từ", ja: "動詞の活用", description: "Ba nhóm động từ, quy tắc chia và bảng đối chiếu các thể thường gặp.", tips: [
    "Nhóm I (五段): 書く・読む・話す… Nhóm II (一段): thường kết thúc bằng -いる/-える như 見る・食べる. Nhóm III: する và 来る. Không thể xác định nhóm chỉ dựa vào đuôi る.",
    "帰る・入る・走る・切る・知る・要る vẫn thuộc nhóm I dù có âm -iru/-eru. Hãy học nhóm cùng nghĩa: 切る (cắt, nhóm I) khác 着る (mặc, nhóm II).",
    "Thể từ điển và ます đều có thể nói hiện tại/thói quen hoặc tương lai tùy ngữ cảnh. Thể た chỉ quá khứ/hoàn tất; không đồng nghĩa trong mọi trường hợp với 了 trong tiếng Trung.",
    "Thể て không có một nghĩa tiếng Việt duy nhất: dùng nối câu hoặc kết hợp ください・います・もいい… Thể ない là phủ định; ないでください = xin đừng, なければなりません = phải.",
    "Bị động và khả năng có thể trùng hình thức ở nhóm II: 食べられる = ăn được hoặc bị ăn, tùy ngữ cảnh. Không dùng dạng rút gọn 食べれる làm mẫu chuẩn trong bảng này.",
    "Mệnh lệnh và cấm đoán trực tiếp có sắc thái mạnh. Khi nhờ người khác thường dùng ～てください hoặc lời nhờ lịch sự hơn. Bản dịch Trung thể hiện nghĩa, không phải hệ chia động từ tương đương."
  ], sections: [
    { title: "Nhận diện nhóm và các ngoại lệ", intro: "Bắt đầu từ thể từ điển; đừng đoán nhóm chỉ từ dạng ます.", rows: rows(`
書く|かく|kaku|写|xiě|Viết — nhóm I|書きます → 書いて → 書かない.
読む|よむ|yomu|读|dú|Đọc — nhóm I|読みます → 読んで → 読まない.
話す|はなす|hanasu|说话|shuōhuà|Nói — nhóm I|話します → 話して → 話さない.
食べる|たべる|taberu|吃|chī|Ăn — nhóm II|Bỏ る: 食べ + ます／て／ない.
見る|みる|miru|看|kàn|Xem — nhóm II|見ます → 見て → 見ない.
する|する|suru|做|zuò|Làm — nhóm III|します → して → しない.
来る|くる|kuru|来|lái|Đến — nhóm III|来ます きます, 来て きて, 来ない こない; chữ 来 đổi cách đọc.
帰る|かえる|kaeru|回去|huíqù|Về — nhóm I|帰って, không phải 帰て.
入る|はいる|hairu|进入|jìnrù|Vào — nhóm I|入って・入らない.
走る|はしる|hashiru|跑|pǎo|Chạy — nhóm I|走って・走らない.
切る|きる|kiru|切|qiē|Cắt — nhóm I|切って・切らない; đối chiếu 着る.
着る|きる|kiru|穿|chuān|Mặc — nhóm II|着て・着ない; cùng âm きる nhưng chia khác 切る.
知る|しる|shiru|知道|zhīdào|Biết — nhóm I|知っている = biết; phủ định thường nói 知りません.
要る|いる|iru|需要|xūyào|Cần — nhóm I|要ります・要らない; khác いる (có mặt, nhóm II).
いる|いる|iru|在|zài|Có mặt/tồn tại (người, vật sống) — nhóm II|います・いて・いない.
`) },
    { title: "Thể て / た của nhóm I", intro: "う・つ・る → って; む・ぶ・ぬ → んで; く → いて; ぐ → いで; す → して. Thể た đổi て→た, で→だ. Riêng 行く → 行って／行った.", rows: rows(`
買う → 買って → 買った|かう → かって → かった|kau → katte → katta|买|mǎi|Mua|う → って／った.
待つ → 待って → 待った|まつ → まって → まった|matsu → matte → matta|等|děng|Chờ|つ → って／った.
帰る → 帰って → 帰った|かえる → かえって → かえった|kaeru → kaette → kaetta|回去|huíqù|Về|る nhóm I → って／った.
読む → 読んで → 読んだ|よむ → よんで → よんだ|yomu → yonde → yonda|读|dú|Đọc|む → んで／んだ.
遊ぶ → 遊んで → 遊んだ|あそぶ → あそんで → あそんだ|asobu → asonde → asonda|玩|wán|Chơi|ぶ → んで／んだ.
死ぬ → 死んで → 死んだ|しぬ → しんで → しんだ|shinu → shinde → shinda|死|sǐ|Chết|ぬ → んで／んだ.
書く → 書いて → 書いた|かく → かいて → かいた|kaku → kaite → kaita|写|xiě|Viết|く → いて／いた.
泳ぐ → 泳いで → 泳いだ|およぐ → およいで → およいだ|oyogu → oyoide → oyoida|游泳|yóuyǒng|Bơi|ぐ → いで／いだ.
話す → 話して → 話した|はなす → はなして → はなした|hanasu → hanashite → hanashita|说话|shuōhuà|Nói|す → して／した.
行く → 行って → 行った|いく → いって → いった|iku → itte → itta|去|qù|Đi|Ngoại lệ: không dùng 行いて.
`) },
    { title: "Phủ định, khả năng, điều kiện và ý chí", intro: "Nhóm I đổi âm cuối theo hàng: i + ます; a + ない; e + る (khả năng); e + ば; o + う. Riêng đuôi う → わない. Nhóm II bỏ る rồi thêm đuôi thích hợp.", rows: rows(`
書く → 書きます|かく → かきます|kaku → kakimasu|写（礼貌表达）|xiě (lǐmào biǎodá)|Viết — lịch sự|Nhóm I: く → き + ます.
書く → 書かない|かく → かかない|kaku → kakanai|不写|bù xiě|Không viết|Nhóm I: く → か + ない.
買う → 買わない|かう → かわない|kau → kawanai|不买|bù mǎi|Không mua|う → わない, không phải あない.
ある → ない|ある → ない|aru → nai|没有|méiyǒu|Không có (đồ vật)|Ngoại lệ phủ định, không nói あらない ở tiếng Nhật chuẩn hiện đại.
食べる → 食べない|たべる → たべない|taberu → tabenai|不吃|bù chī|Không ăn|Nhóm II bỏ る + ない.
書く → 書ける|かく → かける|kaku → kakeru|能写|néng xiě|Viết được|Nhóm I: âm e + る.
食べる → 食べられる|たべる → たべられる|taberu → taberareru|能吃|néng chī|Ăn được|Nhóm II bỏ る + られる; cũng có thể là bị động tùy câu.
する → できる|する → できる|suru → dekiru|能做|néng zuò|Làm được|Khả năng bất quy tắc.
来る → 来られる|くる → こられる|kuru → korareru|能来|néng lái|Đến được|来 đổi cách đọc thành こ.
書く → 書けば|かく → かけば|kaku → kakeba|如果写|rúguǒ xiě|Nếu viết|Điều kiện ば: âm e + ば.
食べる → 食べれば|たべる → たべれば|taberu → tabereba|如果吃|rúguǒ chī|Nếu ăn|Nhóm II bỏ る + れば.
書く → 書こう|かく → かこう|kaku → kakō|写吧|xiě ba|Hãy viết / định viết|Thể ý chí nhóm I: âm o + う; nghĩa tùy câu.
食べる → 食べよう|たべる → たべよう|taberu → tabeyō|吃吧|chī ba|Hãy ăn / định ăn|Nhóm II bỏ る + よう.
する → しよう|する → しよう|suru → shiyō|做吧|zuò ba|Hãy làm / định làm
来る → 来よう|くる → こよう|kuru → koyō|来吧|lái ba|Hãy đến / định đến
`) },
    { title: "Một động từ qua các thể: 食べる", intro: "Mẫu nhóm II để so sánh đuôi. Dạng độc lập chỉ minh họa cấu trúc; nghĩa chính xác phải xét cả câu. Tiếng Trung không biến đổi đuôi động từ theo bảng này.", rows: rows(`
食べます|たべます|tabemasu|吃（礼貌表达）|chī (lǐmào biǎodá)|Ăn — lịch sự, không quá khứ|Dùng cho thói quen hoặc dự định tương lai.
食べません|たべません|tabemasen|不吃（礼貌表达）|bù chī (lǐmào biǎodá)|Không ăn — lịch sự|Gốc ます + ません.
食べました|たべました|tabemashita|吃了|chī le|Đã ăn — lịch sự|Gốc ます + ました.
食べませんでした|たべませんでした|tabemasen deshita|没吃|méi chī|Đã không ăn — lịch sự|Phủ định quá khứ lịch sự.
食べる|たべる|taberu|吃|chī|Ăn — từ điển, thể thường|Không quá khứ; hiện tại hay tương lai tùy câu.
食べない|たべない|tabenai|不吃|bù chī|Không ăn — thể ない|Bỏ る + ない.
食べなかった|たべなかった|tabenakatta|没吃|méi chī|Đã không ăn — thường|ない → なかった.
食べて|たべて|tabete|吃（连接形式）|chī (liánjiē xíngshì)|Thể て của ăn|Dùng nối hoặc ghép cấu trúc; không phải một thì riêng.
食べた|たべた|tabeta|吃了|chī le|Đã ăn — thể た|Bỏ る + た.
食べたい|たべたい|tabetai|想吃|xiǎng chī|Muốn ăn|Gốc ます + たい; phủ định 食べたくない.
食べられる|たべられる|taberareru|能吃／被吃|néng chī / bèi chī|Ăn được / bị ăn|Khả năng và bị động nhóm II có cùng hình thức.
食べれば|たべれば|tabereba|如果吃|rúguǒ chī|Nếu ăn — điều kiện ば|Bỏ る + れば.
食べたら|たべたら|tabetara|如果吃／吃了以后|rúguǒ chī / chī le yǐhòu|Nếu ăn / sau khi ăn — たら|Thể た + ら; không hoàn toàn thay thế ば trong mọi câu.
食べよう|たべよう|tabeyō|吃吧|chī ba|Hãy ăn / định ăn — ý chí|食べようと思います: tôi định ăn.
食べさせる|たべさせる|tabesaseru|让吃|ràng chī|Cho/bắt ăn — sai khiến|Bỏ る + させる; ai cho/bắt ai cần diễn đạt trong câu.
食べさせられる|たべさせられる|tabesaserareru|被迫吃|bèi pò chī|Bị bắt ăn — sai khiến bị động|Nhóm II: bỏ る + させられる.
食べろ|たべろ|tabero|吃！|chī|Ăn đi — mệnh lệnh|Không dùng thay lời mời lịch sự.
食べるな|たべるな|taberu na|别吃！|bié chī|Đừng ăn — cấm đoán|Từ điển + な; khác thể phủ định 食べない.
`) },
    { title: "Bị động, sai khiến và cách dùng trong câu", intro: "Nhóm I: âm a + れる (bị động), âm a + せる (sai khiến); う chuyển わ. Nhóm II: bỏ る + られる／させる. する → される／させる; 来る → 来られる／来させる.", rows: rows(`
先生に褒められました。|せんせいにほめられました。|sensei ni homeraremashita|被老师表扬了。|bèi lǎoshī biǎoyáng le|Tôi được giáo viên khen.|褒める (II) → 褒められる → 褒められました; bị động không luôn mang nghĩa xấu.
母は子供に野菜を食べさせます。|はははこどもにやさいをたべさせます。|haha wa kodomo ni yasai o tabesasemasu|妈妈让孩子吃蔬菜。|māma ràng háizi chī shūcài|Mẹ cho/bắt con ăn rau.|Sai khiến có thể là cho phép hoặc bắt buộc, tùy ngữ cảnh.
少し考えさせてください。|すこしかんがえさせてください。|sukoshi kangaesasete kudasai|请让我想一想。|qǐng ràng wǒ xiǎng yi xiǎng|Xin cho tôi suy nghĩ một chút.|考える → 考えさせる → 考えさせて.
毎日日本語を勉強しています。|まいにちにほんごをべんきょうしています。|mainichi nihongo o benkyō shite imasu|每天都在学习日语。|měi tiān dōu zài xuéxí Rìyǔ|Tôi đang duy trì học tiếng Nhật mỗi ngày.|～ています còn chỉ thói quen, không chỉ hành động ngay lúc nói.
ここで写真を撮ってもいいですか。|ここでしゃしんをとってもいいですか。|koko de shashin o totte mo ii desu ka|可以在这里拍照吗？|kěyǐ zài zhèlǐ pāizhào ma|Tôi chụp ảnh ở đây được không?|撮る (I) → 撮って + もいいですか.
明日までに出さなければなりません。|あしたまでにださなければなりません。|ashita made ni dasanakereba narimasen|必须在明天之前交。|bìxū zài míngtiān zhīqián jiāo|Phải nộp chậm nhất ngày mai.|出す → 出さない → 出さなければなりません.
行ったら、電話してください。|いったら、でんわしてください。|ittara, denwa shite kudasai|到了以后，请打电话。|dào le yǐhòu, qǐng dǎ diànhuà|Đến nơi rồi hãy gọi điện nhé.|行った + ら; bản dịch theo ngữ cảnh đi đến nơi.
書け。|かけ。|kake|写！|xiě|Viết đi!|Mệnh lệnh nhóm I: âm e; mạnh, không phải lời nhờ lịch sự.
食べろ。|たべろ。|tabero|吃！|chī|Ăn đi!|Mệnh lệnh nhóm II: bỏ る + ろ; sắc thái mạnh.
行くな。|いくな。|iku na|别去！|bié qù|Đừng đi!|Cấm đoán: từ điển + な; khác phủ định 行かない.
`) }
  ] }
];

export const notesSources = [
  { title: "Japan Foundation · Irodori: tổng hợp ngữ pháp", url: "https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf" },
  { title: "Japan Foundation · Hướng dẫn số, thời gian và trợ số từ", url: "https://www.jpf.go.jp/j/urawa/j_rsorcs/textbook/dl/setsumei/setsumei_all.pdf" },
];
