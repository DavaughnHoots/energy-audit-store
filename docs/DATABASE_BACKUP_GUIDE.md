# PostgreSQL Database Backup Guide for Heroku

This guide outlines the steps to create and download a backup of your Heroku PostgreSQL database to send to clients.

## Prerequisites

- Heroku CLI installed and logged in
- Access to the Heroku application with proper permissions

## Step 1: Identify Your PostgreSQL Database

First, list all addons to identify your PostgreSQL database:

```bash
heroku addons --app energy-audit-store
```

This will display something like:
```
Add-on                     Plan        Price    State
--------------------------  ----------  -------  -------
heroku-postgresql:hobby-dev  hobby-dev  free     created
 └─ as DATABASE
```

## Step 2: Create a Backup

### Option 1: Create a Backup Using Heroku PG Backups

```bash
# Create a new backup
heroku pg:backups:capture --app energy-audit-store
```

### Option 2: Export Using pg_dump (More Comprehensive)

```bash
# Get the database connection URL
heroku pg:info --app energy-audit-store

# Get connection string
heroku pg:credentials:url --app energy-audit-store
```

This will provide a URL like:
```
postgres://username:password@host:port/database_name
```

Then use pg_dump with this URL:

```bash
pg_dump -Fc --no-acl --no-owner -h <host> -U <username> <database_name> > energy_audit_store_backup.dump
```

You will be prompted for the password from the connection URL.

## Step 3: Download the Backup

### If Using Heroku PG Backups:

```bash
# List all backups
heroku pg:backups --app energy-audit-store

# Download the latest backup
heroku pg:backups:download --app energy-audit-store
```

This will download a file named `latest.dump` in your current directory.

### If Using pg_dump:

The backup file is already on your local machine (from Step 2, Option 2).

## Step 4: Rename and Prepare the Backup for the Client

```bash
# Rename the backup with a date
mv latest.dump energy_audit_store_backup_$(date +%Y%m%d).dump
```

## Step 5: Verify the Backup File

Check that the backup file was created successfully:

```bash
ls -la energy_audit_store_backup_*.dump
```

## One-Line Commands for Quick Backup

If you just need a quick backup, use these commands:

```bash
# Create backup and download in one step
heroku pg:backups:capture --app energy-audit-store && heroku pg:backups:download --app energy-audit-store && mv latest.dump energy_audit_store_backup_$(date +%Y%m%d).dump
```

## Additional Options

### Schedule Regular Backups

If you want to set up scheduled backups:

```bash
# Schedule daily backups
heroku pg:backups:schedule --at '02:00 America/New_York' --app energy-audit-store
```

### View Backup Information

```bash
# Get info about a specific backup
heroku pg:backups:info b001 --app energy-audit-store
```

### Restore from Backup (If Needed)

```bash
# Restore from a backup
heroku pg:backups:restore b001 --app energy-audit-store
```

## Important Notes

1. The free hobby-dev database plan has a size limit (1GB max)
2. Ensure you have sufficient local storage for the backup
3. Keep backups secure as they contain your database data
4. For large databases, consider compressing the backup file before sending it to clients
