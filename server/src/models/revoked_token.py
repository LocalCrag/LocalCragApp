from extensions import db


class RevokedToken(db.Model):
    """
    A token that has been revoked by logout.
    """

    __tablename__ = "revoked_tokens"
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(120))

    def persist(self):
        """
        Persists the revoked token.
        """
        db.session.add(self)
        db.session.commit()

    @classmethod
    def is_jti_blocklisted(cls, jti):
        """
        Check if the jti belongs to a blocklisted token.
        :param jti: JWTs jti to check.
        :return: True if jti is blocklisted.
        """
        query = cls.query.filter_by(jti=jti).first()
        return bool(query)
