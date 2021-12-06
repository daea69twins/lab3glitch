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
    deadline INTEGER,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    location VARCHAR(16),
    timezone VARCHAR(16) NOT NULL,
    description TEXT,
    title VARCHAR(32) NOT NULL,
    FOREIGN KEY (username) REFERENCES admins(username)
);

CREATE TABLE invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sch_id INTEGER NOT NULL, 
    phone TEXT NOT NULL, 
    FOREIGN KEY (sch_id) REFERENCES schedules(id)
);

CREATE TABLE slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sch_id INTEGER NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
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
INSERT INTO schedules VALUES (NULL, "herkyHawk", NULL, 477170, 484370, "room21", "CST", "herkyhawks meeting", "Badass Sewing Club");
INSERT INTO slots VALUES (NULL, 1, 477170, 477200, 1);
INSERT INTO slots VALUES (NULL, 1, 477200, 477230, 1);
INSERT INTO slots VALUES (NULL, 1, 477230, 477260, 1);
INSERT INTO slots VALUES (NULL, 1, 477260, 477290, 1);
INSERT INTO slots VALUES (NULL, 1, 478610, 478640, 1);
INSERT INTO slots VALUES (NULL, 1, 478640, 478670, 1);
INSERT INTO invites VALUES (NULL, 1, "18473479014");
INSERT INTO invites VALUES (NULL, 1, "13192417796");
INSERT INTO schedules VALUES (NULL, "herkyHawk", NULL, 487252, 491572, "room50", "CST", "Alex Meeting", "Cool kid Club"); 
INSERT INTO schedules VALUES (NULL, "Iowa45", NULL, 477172, 484372, "room69", "CST", "Club Meeting", "Coding Club");