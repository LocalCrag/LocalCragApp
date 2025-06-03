bind = "0.0.0.0:5000"
workers = 4
worker_tmp_dir = "/dev/shm"
wsgi_app = "app:app"
chdir = "src"
preload_app = True
timeout = 60
