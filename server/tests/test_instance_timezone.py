from datetime import datetime

import pytest
import pytz
from marshmallow import ValidationError

from models.instance_settings import InstanceSettings
from util.instance_timezone import instance_local_date, validate_timezone


def test_validate_timezone_accepts_iana_name():
    validate_timezone("Europe/Berlin")


def test_validate_timezone_rejects_unknown_name():
    with pytest.raises(ValidationError, match="Invalid timezone"):
        validate_timezone("Not/A_Timezone")


def test_instance_local_date_uses_configured_timezone():
    settings = InstanceSettings.return_it()
    settings.timezone = "Europe/Berlin"
    moment = datetime(2026, 6, 4, 22, 30, tzinfo=pytz.utc)
    assert instance_local_date(moment) == datetime(2026, 6, 5).date()
