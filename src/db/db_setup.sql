/* DROP ALL TABLES */
<<<<<<< HEAD
<<<<<<< HEAD
DROP TABLE admins;
DROP TABLE schedules;
DROP TABLE invites;
DROP TABLE IF EXISTS slots; 
DROP TABLE IF EXISTS reservations;
=======
=======
>>>>>>> bb1011c6abddbf40d57bcec544100235da6fcbc7
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS invites;

/* RECREATE ALL TABLES */
CREATE TABLE admins (
    username VARCHAR(16) PRIMARY KEY,
    password VARCHAR(16) NOT NULL
);

/* SEED TABLES */