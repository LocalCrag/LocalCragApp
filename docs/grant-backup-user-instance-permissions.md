Run the following command to grant instance permissions to the backup user:

```sql
GRANT CONNECT ON DATABASE "db-name" TO backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO backup;
```

Make sure to grant the access of the schema in the correct db!