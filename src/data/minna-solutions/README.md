# Lời giải bài tập Minna

49 bài đang có dữ liệu nguồn, gồm 949 mục được bộ tách nhận diện.
Bài 12 chưa có dữ liệu crawl nên không tạo đáp án giả.

- `reference`: 880 câu có đáp án tham khảo theo câu hỏi/ngân hàng từ và ngữ pháp.
- `sample`: 53 câu có cách trả lời mẫu hoặc cần giải thích cách khôi phục một lỗi nhỏ.
- `source-issue`: 16 mục thiếu dữ kiện, lỗi văn bản hoặc không thực sự là câu hỏi.

Đây là nội dung biên soạn, **không phải đáp án chính thức của Riki** và chưa được
giáo viên độc lập duyệt toàn bộ. Các câu mở có thể có nhiều cách trả lời hợp lệ.
Đối chiếu trên web chỉ báo khớp/khác lời giải, không kết luận câu khác là sai.

Mỗi file giữ `sourceUrl`, `exerciseId`, nguyên văn `question` và `context` để chống
gắn nhầm đáp án sau khi crawl lại. `answers` là mảng theo thứ tự ô; mỗi ô chứa một
hoặc nhiều cách viết tương đương. Dạng `X`/`×` ở bài trợ từ nghĩa là không thêm trợ từ.
Ở bài đúng/sai, ý nghĩa dấu được giải thích theo từng câu.

Ví dụ quan trọng: bài 14 có ô cần `泳いでい` vì `ます` đã nằm ngoài ô; bài 47 phân
biệt `使いやすそう` (vẻ ngoài) và `複雑だそう` (nghe nói); bài 50 cần `お貸しし`
trước phần `ましょうか` có sẵn. Không tự động nối lại đáp án bằng cách xóa hậu tố.

Tài liệu đối chiếu ngữ pháp (không phải nguồn đáp án cho bộ đề):

- Japan Foundation, [そうです（様態）](https://www.kyozai.jpf.go.jp/kyozai/material/BTS00094/ja/render.do).
- Japan Foundation, [よう（２） — mục đích/kết quả](https://www.jpf.go.jp/j/project/japanese/teach/tsushin/grammar/201310.html).

Kiểm tra dữ liệu bằng `npm run test:minna`. Kiểm tra gồm đủ câu, đúng câu/ngữ cảnh,
số ô và lựa chọn, các trường hợp biến đổi dễ sai, và từ chối khóa đáp án cũ.
Các kiểm tra kỹ thuật này không thay thế việc duyệt tiếng Nhật của giáo viên.
