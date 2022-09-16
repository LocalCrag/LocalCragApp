from extensions import db
from models.customer import Customer

class Language(db.Model):
    """
    An available system language.
    """
    __tablename__ = 'languages'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String, nullable=False)
    is_default_language = db.Column(db.Boolean, nullable=False, default=False)

    @classmethod
    def return_all(cls):
        return cls.query.all()

