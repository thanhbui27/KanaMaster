"""Parser regressions: python -m unittest discover -s scripts -p test_crawl_riki.py"""
import unittest

from crawl_riki import parse_lesson


class ParserTests(unittest.TestCase):
    def test_includes_practice_outside_grammar_container(self):
        html = '''<h1 class="rikiDetailBlockTop_heading">Minna bài 1</h1>
        <section class="pageDetailContent"><div class="box_content_write">
        <h2 class="titleH2">Từ vựng</h2><div class="pageDetailContent_post">
        <table><tr><td>私</td><td>Tôi</td></tr></table></div></div></section>
        <footer>Do not import</footer>
        <section class="pageDetailContent"><div class="box_content_write black">
        <div class="heading">Luyện tập</div><p>A（　）B</p>
        <img src="/question.png"><a href="/answer">Answer</a>
        </div></section>'''
        data = parse_lesson(html, 1, "https://riki.edu.vn/minna-no-nihongo/bai-1")
        self.assertEqual([s['kind'] for s in data['sections']], ['vocabulary', 'practice'])
        self.assertEqual(data['sections'][0]['blocks'][0]['rows'][0][0]['text'], '私')
        practice = data['sections'][1]
        self.assertIn('A（　）B', practice['text'])
        self.assertNotIn('Luyện tập', practice['text'])
        self.assertEqual(practice['media'][0]['url'], 'https://riki.edu.vn/question.png')
        self.assertEqual(practice['links'][0]['url'], 'https://riki.edu.vn/answer')
        self.assertNotIn('Do not import', str(data))

    def test_rejects_wrong_page(self):
        with self.assertRaises(ValueError):
            parse_lesson('<h1>Page not found</h1>', 1, 'https://riki.edu.vn')

    def test_inline_spans_preserve_word_spacing(self):
        html = '''<h1 class="rikiDetailBlockTop_heading">Minna bài 1</h1>
        <section class="pageDetailContent"><div class="box_content_write">
        <p><span>Tôi </span><strong>là </strong><span>sinh viên.</span></p>
        </div></section>'''
        data = parse_lesson(html, 1, 'https://riki.edu.vn')
        self.assertEqual(data['sections'][0]['blocks'][0]['text'], 'Tôi là sinh viên.')

    def test_rejects_unhandled_content(self):
        html = '''<h1 class="rikiDetailBlockTop_heading">Minna bài 1</h1>
        <section class="pageDetailContent">
        <div class="box_content_write"><p>Known</p></div>
        <div class="pageDetailContent_post">Unhandled</div></section>'''
        with self.assertRaisesRegex(ValueError, 'Unmatched'):
            parse_lesson(html, 1, 'https://riki.edu.vn')


if __name__ == '__main__':
    unittest.main()
