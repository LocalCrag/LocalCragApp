import re

from util.regexes import email_regex


def test_email_regex():
    assert re.match(email_regex, "test@test.de")
    assert re.match(email_regex, "123test@test.de")
    assert not re.match(email_regex, "123test@test")
    assert not re.match(email_regex, "test@test.")
    assert not re.match(email_regex, "testtest.de")
    assert not re.match(email_regex, "@testtest.de")
    assert re.match(email_regex, "test@test.de ")  # Trailing space is auto removed by re.match
    assert not re.match(email_regex, " test@test.de")
    assert not re.match(email_regex, "test @test.de")
    assert not re.match(email_regex, "test@ test.de")
