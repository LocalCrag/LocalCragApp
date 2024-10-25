from app import app
from extensions import db
from tests.conftest import fill_db_with_sample_data

with app.app_context():
    db.create_all()
    fill_db_with_sample_data()
