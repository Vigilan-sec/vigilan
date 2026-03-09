from app.security.auth import hash_password, hash_session_token, verify_password


def test_password_hash_round_trip() -> None:
    password = "correct horse battery staple"
    encoded = hash_password(password)

    assert encoded != password
    assert verify_password(password, encoded) is True
    assert verify_password("wrong-password", encoded) is False


def test_session_token_hash_is_stable() -> None:
    token = "local-demo-token"

    assert hash_session_token(token) == hash_session_token(token)
    assert hash_session_token(token) != hash_session_token("different-token")
