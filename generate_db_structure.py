import psycopg2
from psycopg2 import sql
from prettytable import PrettyTable
import argparse
import os
from datetime import datetime
import getpass
from tqdm import tqdm
import logging

def setup_logging():
    """
    Configure logging for the script.
    """
    logging.basicConfig(
        filename='db_structure.log',
        filemode='w',
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

def get_connection(host, port, dbname, user, password):
    """
    Establish a connection to the PostgreSQL database.
    """
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        logging.info("Successfully connected to the database.")
        return conn
    except psycopg2.Error as e:
        logging.error(f"Error connecting to the database: {e}")
        print(f"Error connecting to the database: {e}")
        exit(1)

def get_tables(conn):
    """
    Retrieve all base tables in the database excluding system schemas.
    """
    query = """
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY table_schema, table_name;
    """
    with conn.cursor() as cur:
        cur.execute(query)
        tables = cur.fetchall()
        logging.info(f"Retrieved {len(tables)} tables from the database.")
        return tables

def get_columns(conn, schema, table):
    """
    Retrieve column details for a given table.
    """
    query = """
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = %s
      AND table_name = %s
    ORDER BY ordinal_position;
    """
    with conn.cursor() as cur:
        cur.execute(query, (schema, table))
        columns = cur.fetchall()
        logging.info(f"Retrieved {len(columns)} columns for table {schema}.{table}.")
        return columns

def get_primary_keys(conn, schema, table):
    """
    Retrieve primary key columns for a given table.
    """
    query = """
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = %s
      AND tc.table_name = %s
    ORDER BY kcu.ordinal_position;
    """
    with conn.cursor() as cur:
        cur.execute(query, (schema, table))
        pks = [row[0] for row in cur.fetchall()]
        logging.info(f"Primary keys for table {schema}.{table}: {pks}")
        return pks

def get_foreign_keys(conn, schema, table):
    """
    Retrieve foreign key constraints for a given table.
    """
    query = """
    SELECT
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = %s
      AND tc.table_name = %s;
    """
    with conn.cursor() as cur:
        cur.execute(query, (schema, table))
        fks = cur.fetchall()
        logging.info(f"Retrieved {len(fks)} foreign keys for table {schema}.{table}.")
        return fks

def get_indexes(conn, schema, table):
    """
    Retrieve indexes for a given table.
    """
    query = """
    SELECT
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = %s
      AND tablename = %s
    ORDER BY indexname;
    """
    with conn.cursor() as cur:
        cur.execute(query, (schema, table))
        indexes = cur.fetchall()
        logging.info(f"Retrieved {len(indexes)} indexes for table {schema}.{table}.")
        return indexes

def generate_structure(conn, output_file):
    """
    Generate the database structure report and write it to the output file.
    """
    setup_logging()
    logging.info("Starting database structure generation.")
    
    tables = get_tables(conn)
    if not tables:
        logging.warning("No tables found in the database.")
        print("No tables found in the database.")
        return
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"Database Structure Report\n")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        for schema, table in tqdm(tables, desc="Processing Tables"):
            logging.info(f"Processing table: {schema}.{table}")
            f.write(f"Schema: {schema}\n")
            f.write(f"Table: {table}\n")
            f.write("-" * 40 + "\n")
            
            # Columns
            columns = get_columns(conn, schema, table)
            if columns:
                table_columns = PrettyTable()
                table_columns.field_names = ["Column Name", "Data Type", "Nullable", "Default"]
                for col in columns:
                    table_columns.add_row(col)
                f.write("Columns:\n")
                f.write(str(table_columns))
                f.write("\n\n")
            else:
                f.write("No columns found.\n\n")
            
            # Primary Keys
            pks = get_primary_keys(conn, schema, table)
            if pks:
                f.write(f"Primary Key: {', '.join(pks)}\n\n")
            else:
                f.write("Primary Key: None\n\n")
            
            # Foreign Keys
            fks = get_foreign_keys(conn, schema, table)
            if fks:
                f.write("Foreign Keys:\n")
                fk_table = PrettyTable()
                fk_table.field_names = ["Column", "Foreign Schema", "Foreign Table", "Foreign Column"]
                for fk in fks:
                    fk_table.add_row(fk)
                f.write(str(fk_table))
                f.write("\n\n")
            else:
                f.write("Foreign Keys: None\n\n")
            
            # Indexes
            indexes = get_indexes(conn, schema, table)
            if indexes:
                f.write("Indexes:\n")
                for index_name, index_def in indexes:
                    f.write(f"- `{index_name}`: {index_def}\n")
                f.write("\n")
            else:
                f.write("Indexes: None\n\n")
            
            f.write("=" * 80 + "\n\n")
    
    logging.info(f"Database structure has been written to {output_file}")
    print(f"Database structure has been written to {output_file}")

def main():
    """
    Main function to parse arguments and initiate the structure generation.
    """
    parser = argparse.ArgumentParser(
        description=(
            'Generate a PostgreSQL database structure layout as a text document.'
        )
    )
    parser.add_argument(
        '--host',
        type=str,
        default='localhost',
        help='Database host (default: localhost)'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=5432,
        help='Database port (default: 5432)'
    )
    parser.add_argument(
        '--dbname',
        type=str,
        required=True,
        help='Name of the PostgreSQL database'
    )
    parser.add_argument(
        '--user',
        type=str,
        required=True,
        help='Database user'
    )
    parser.add_argument(
        '--password',
        type=str,
        help='Password for the database user. If not provided, you will be prompted.'
    )
    parser.add_argument(
        '-o', '--output',
        type=str,
        default='database_structure.txt',
        help='Output file name (default: database_structure.txt)'
    )
    
    args = parser.parse_args()
    # Securely handle password
    if args.password:
        password = args.password
    else:
        password = getpass.getpass(prompt='Enter database password: ')
    
    conn = get_connection(
        host=args.host,
        port=args.port,
        dbname=args.dbname,
        user=args.user,
        password=password
    )
    
    try:
        generate_structure(conn, args.output)
    finally:
        conn.close()
        logging.info("Database connection closed.")

if __name__ == '__main__':
    main()
