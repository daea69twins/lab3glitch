/* DROP ALL TABLES */
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS invites;

/* RECREATE ALL TABLES */
CREATE TABLE admins (
    username VARCHAR(16) PRIMARY KEY,
    password VARCHAR(16) NOT NULL
);

/* SEED TABLES */