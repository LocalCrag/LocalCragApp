from util.html_inline_styles import (
    replace_wysiwyg_headings_and_font_size,
    sanitize_wysiwyg_html,
    strip_wysiwyg_inline_colors,
)


def test_keep_text_color_style():
    html = '<p><span style="color: rgb(230, 0, 0);">Hello</span></p>'
    assert strip_wysiwyg_inline_colors(html) == html


def test_strip_background_color_keeps_other_styles():
    html = '<span style="background-color: yellow; font-weight: bold;">x</span>'
    assert strip_wysiwyg_inline_colors(html) == '<span style="font-weight: bold">x</span>'


def test_strip_font_color_attribute():
    html = '<font color="#ff0000">Alert</font>'
    assert strip_wysiwyg_inline_colors(html) == "Alert"


def test_unchanged_without_colors():
    html = '<p class="wysiwyg-content"><strong>Bold</strong></p>'
    assert strip_wysiwyg_inline_colors(html) == html


def test_sanitize_wysiwyg_html_keeps_text_color(monkeypatch):
    monkeypatch.setattr(
        "util.bucket_placeholders.get_bucket_placeholders",
        lambda: ("{{BUCKET_PLACEHOLDER}}", "{{BUCKET_PLACEHOLDER}}"),
    )
    html = '<p style="color: #333">Text</p>'
    assert sanitize_wysiwyg_html(html) == html


def test_headings_become_paragraphs_and_font_size_is_removed():
    html = '<h2 style="font-size: 32px; text-align: center">Title</h2><p style="color: red; font-size: 14px">Hi</p>'
    assert (
        replace_wysiwyg_headings_and_font_size(html)
        == '<p style="text-align: center"><strong>Title</strong></p><p style="color: red">Hi</p>'
    )


def test_font_shorthand_and_font_size_attribute_are_removed():
    html = '<p style="font: 16px Arial; font-weight: bold">A</p><font size="5">Big</font>'
    assert replace_wysiwyg_headings_and_font_size(html) == '<p style="font-weight: bold">A</p>Big'


def test_heading_and_font_size_cleanup_leaves_other_html_unchanged():
    html = '<p style="text-align: left"><strong>Hello</strong></p>'
    assert replace_wysiwyg_headings_and_font_size(html) is html


def test_sanitize_wysiwyg_html_replaces_bucket_urls(monkeypatch):
    bucket_url = "https://cdn.example.com/my-bucket"
    monkeypatch.setattr(
        "util.bucket_placeholders.get_bucket_placeholders",
        lambda: ("{{BUCKET_PLACEHOLDER}}", bucket_url),
    )
    html = f'<p><img src="{bucket_url}/uploads/foo.jpg"></p>'
    assert sanitize_wysiwyg_html(html) == '<p><img src="{{BUCKET_PLACEHOLDER}}/uploads/foo.jpg"></p>'
