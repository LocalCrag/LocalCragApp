from util.html_inline_styles import (
    sanitize_wysiwyg_html,
    strip_wysiwyg_inline_colors,
)


def test_strip_color_style():
    html = '<p><span style="color: rgb(230, 0, 0);">Hello</span></p>'
    assert strip_wysiwyg_inline_colors(html) == "<p><span>Hello</span></p>"


def test_strip_background_color_keeps_other_styles():
    html = '<span style="background-color: yellow; font-weight: bold;">x</span>'
    assert strip_wysiwyg_inline_colors(html) == '<span style="font-weight: bold">x</span>'


def test_strip_font_color_attribute():
    html = '<font color="#ff0000">Alert</font>'
    assert strip_wysiwyg_inline_colors(html) == "Alert"


def test_unchanged_without_colors():
    html = '<p class="quill-content"><strong>Bold</strong></p>'
    assert strip_wysiwyg_inline_colors(html) == html


def test_sanitize_wysiwyg_html_strips_colors(monkeypatch):
    monkeypatch.setattr(
        "util.bucket_placeholders.get_bucket_placeholders",
        lambda: ("{{BUCKET_PLACEHOLDER}}", "{{BUCKET_PLACEHOLDER}}"),
    )
    html = '<p style="color: #333">Text</p>'
    assert sanitize_wysiwyg_html(html) == "<p>Text</p>"


def test_sanitize_wysiwyg_html_replaces_bucket_urls(monkeypatch):
    bucket_url = "https://cdn.example.com/my-bucket"
    monkeypatch.setattr(
        "util.bucket_placeholders.get_bucket_placeholders",
        lambda: ("{{BUCKET_PLACEHOLDER}}", bucket_url),
    )
    html = f'<p><img src="{bucket_url}/uploads/foo.jpg"></p>'
    assert sanitize_wysiwyg_html(html) == '<p><img src="{{BUCKET_PLACEHOLDER}}/uploads/foo.jpg"></p>'
