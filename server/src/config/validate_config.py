def validate_config(config):
    if config['FRONTEND_HOST'][-1] != '/':
        raise Exception('Invalid config: FRONTEND_HOST needs to end in a slash.')
