def setup_logging():
    """Set up and return a logger with custom formatting."""

    import logging
    from utils.customFormatter import CustomFormatter

    logger = logging.getLogger("atlas_logger")

    # Only configure if handlers haven't been added yet
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        ch = logging.StreamHandler()
        ch.setLevel(logging.DEBUG)
        ch.setFormatter(CustomFormatter())
        logger.addHandler(ch)

    return logger
