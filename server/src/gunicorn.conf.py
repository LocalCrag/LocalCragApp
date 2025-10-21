bind = "0.0.0.0:5000"
workers = 4
worker_tmp_dir = "/dev/shm"
wsgi_app = "app:app"
chdir = "src"
preload_app = True
timeout = 60


def post_fork(server, worker):
    # Initialize background schedulers in the context of each worker (not in master)
    try:
        from app import app as flask_app
        from schedulers import init_schedulers

        init_schedulers(flask_app)
        server.log.info("APScheduler initialized in worker %s", worker.pid)
    except Exception as e:
        server.log.error("Failed to initialize APScheduler in worker %s: %s", worker.pid, e)
