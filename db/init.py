import sqlite3

# Connect to (or create) the database file
conn = sqlite3.connect("auth.db")
cursor = conn.cursor()

# Create the users table (with isadmin column included)
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    isadmin INTEGER NOT NULL DEFAULT 0
)
""")

# Insert or update test users
users = [
    ("EMP-20001", "password", "Samantha Lee", 0),
    ("EMP-20002", "password", "Nur Aisyah Binte Rahman", 0),
    ("EMP-20003", "password", "Rohan Mehta", 0),
    ("EMP-20004", "password", "Grace Lee", 1),  # Admin
    ("EMP-20005", "password", "Felicia Goh", 0)
]

for user in users:
    cursor.execute("""
    INSERT INTO users (username, password, name, isadmin)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
        password=excluded.password,
        name=excluded.name,
        isadmin=excluded.isadmin
    """, user)

conn.commit()
conn.close()

print("✅ Database auth.db created with 'isadmin' column and users added.")