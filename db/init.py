import sqlite3

# Connect to (or create) the database file
conn = sqlite3.connect("auth.db")  # Creates auth.db in project folder
cursor = conn.cursor()

# Create the users table with username, password, and name
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL
)
""")


cursor.execute("""
INSERT OR IGNORE INTO users (username, password, name)
VALUES (?, ?, ?)
""", ("EMP-20001", "password", "Samantha Lee"))
cursor.execute("""
INSERT OR IGNORE INTO users (username, password, name)
VALUES (?, ?, ?)
""", ("EMP-20002", "password", "Nur Aisyah Binte Rahman"))
cursor.execute("""
INSERT OR IGNORE INTO users (username, password, name)
VALUES (?, ?, ?)
""", ("EMP-20003", "password", "Rohan Mehta"))
cursor.execute("""
INSERT OR IGNORE INTO users (username, password, name)
VALUES (?, ?, ?)
""", ("EMP-20004", "password", "Grace Lee"))
cursor.execute("""
INSERT OR IGNORE INTO users (username, password, name)
VALUES (?, ?, ?)
""", ("EMP-20005", "password", "Felicia Goh"))

# Commit changes and close connection
conn.commit()
conn.close()

print("Database auth.db created with table 'users' and test user added.")
