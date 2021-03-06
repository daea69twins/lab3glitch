/* DROP ALL TABLES */
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS slots; 
DROP TABLE IF EXISTS reservations;


/* RECREATE ALL TABLES */
CREATE TABLE admins (
    username VARCHAR(16) PRIMARY KEY,
    password VARCHAR(16) NOT NULL
);

CREATE TABLE schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(16) NOT NULL,
    deadline TEXT,
    location VARCHAR(16),
    timezone VARCHAR(16) NOT NULL,
    description TEXT,
    reminder TEXT,
    title VARCHAR(32) NOT NULL,
    FOREIGN KEY (username) REFERENCES admins(username)
);

CREATE TABLE invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sch_id INTEGER NOT NULL, phone INTEGER NOT NULL, FOREIGN KEY (sch_id) REFERENCES schedules(id)
);

CREATE TABLE slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sch_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_rec INTEGER NOT NULL,
    FOREIGN KEY(sch_id) REFERENCES schedules(id)
);

CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id INTEGER NOT NULL,
    identifier VARCHAR(16) NOT NULL,
    phone INTEGER NOT NULL,
    FOREIGN KEY(slot_id) REFERENCES slots(id)
);


/* SEED TABLES */
INSERT INTO admins VALUES ("herkyHawk", "password");
INSERT INTO admins VALUES ("Iowa45", "wewin");