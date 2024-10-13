import os
import smtplib
import subprocess
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import yaml
import traceback
from datetime import datetime
import shutil

from pathlib import Path


def delete_old_files(folder_path, age_threshold):
    """
    Deletes files in folder that are older than the given threshold.
    """
    now = time.time()
    for root, dirs, files in os.walk(folder_path, topdown=False):
        for name in files:
            file_path = os.path.join(root, name)
            file_age = now - os.path.getmtime(file_path)
            if file_age > age_threshold * 86400:
                os.remove(file_path)


config = yaml.safe_load(Path(os.path.dirname(os.path.realpath(__file__)) + "/backup_config.yml").read_text())


def send_failure_message(message):
    """
    Mails the captured logs to the configured email receiver.
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "LocalCrag backup failed"
    msg["From"] = config["smtp"]["sender"]
    msg["To"] = config["smtp"]["receiver"]
    msg.attach(MIMEText(message, "html"))

    with smtplib.SMTP_SSL(config["smtp"]["host"], config["smtp"]["port"]) as server:
        server.login(config["smtp"]["user"], config["smtp"]["password"])
        server.sendmail(config["smtp"]["sender"], config["smtp"]["receiver"], msg.as_string())
        server.quit()


env = {"PGPASSWORD": config["database"]["password"]}

logs = []

try:

    backup_directory = Path(config["backupDirectory"])
    backup_directory = backup_directory.joinpath("localcrag_backups")
    backup_directory.mkdir(parents=True, exist_ok=True)

    for instance in config["instances"]:
        # Create directories
        instance_directory = backup_directory.joinpath(instance["name"])
        instance_directory.mkdir(parents=True, exist_ok=True)
        database_directory = instance_directory.joinpath("database")
        database_directory.mkdir(parents=True, exist_ok=True)
        bucket_directory = instance_directory.joinpath("bucket")
        bucket_directory.mkdir(parents=True, exist_ok=True)

        # Dump database
        try:
            delete_old_files(database_directory, 30)
        except Exception:
            logs.append((f"{instance['name']}: Deleting old dumps", traceback.format_exc()))
        try:
            date = datetime.today().strftime("%Y-%m-%d_%H-%M-%S")
            dump_path = f"{database_directory}/{instance['database']}_{date}.pgdumpfile"
            dump_cmd = f"{config['database']['pgDumpPath']} --file={dump_path} --dbname={instance['database']} --username={config['database']['username']} --host={config['database']['host']} --port={config['database']['port']} --format=c --inserts --clean --create"
            subprocess.check_output(dump_cmd, shell=True, env=env, timeout=60)
            # Copy the dump to a fixed name for ci cd pipeline access
            # Allows "Check Migrate from prod DB" to have a DB for testing
            shutil.copyfile(dump_path, f"{database_directory}/cicd_test_dump.pgdumpfile")
        except Exception:
            logs.append((f"{instance['name']}: pg_dump", traceback.format_exc()))

        # Sync bucket
        try:
            sync_cmd = f"{config['s3cmd']['s3cmdPath']} sync s3://{instance['bucket']} {bucket_directory}"
            subprocess.check_output(sync_cmd, shell=True, env=env)
        except Exception:
            logs.append((f"{instance['name']}: s3cmd", traceback.format_exc()))

except Exception as e:
    logs.append(("Overall script failure", str(e)))

# Send out a message if any errors happened
if len(logs) > 0:
    formatted_logs = ""
    for log in logs:
        formatted_logs += f"<h2>{log[0]}</h2><code>{log[1]}</code>"
    send_failure_message(formatted_logs)
