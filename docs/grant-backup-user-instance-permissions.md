Make sure you have a backup user and a backup manager role.

```sql
-- Create a role for managing backup permissions
CREATE ROLE db_backup_manager;

-- Grant backup user privileges through this role. Users creating new tables 
-- etc should also have this role so permissions can be inherited.
GRANT db_backup_manager TO backup;
GRANT db_backup_manager TO OTHERUSER;
```

Run the following command to grant instance permissions to the backup user:

```sql
GRANT CONNECT ON DATABASE "db-name" TO backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO backup;
ALTER DEFAULT PRIVILEGES FOR ROLE db_backup_manager IN SCHEMA public GRANT SELECT ON TABLES TO backup;
ALTER DEFAULT PRIVILEGES FOR ROLE db_backup_manager IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO backup;
```

Make sure to grant the access of the schema in the correct db!