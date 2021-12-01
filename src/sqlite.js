/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const fs = require("fs");

// Initialize the database
const dbFile = "./src/db/daea.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;

/* 
We're using the sqlite wrapper so that we can make async / await connections
- https://www.npmjs.com/package/sqlite
*/
dbWrapper
    .open({
      filename: dbFile,
      driver: sqlite3.Database
    })
    .then(async dBase => {
      db = dBase;

      // We use try and catch blocks throughout to handle any database errors
      try {
        // The async / await syntax lets us write the db operations in a way that won't block the app
        if (!exists) {
          // Database doesn't exist yet - create example_table table
          await db.run(
              "CREATE TABLE example_table (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, quantity INTEGER)"
          );

          // Add default choices to table
          await db.run(
              "INSERT INTO example_table VALUES (NULL, 'moose', 69), (NULL, 'goose', 420)"
          );

        } else {
          // We have a database already - write Choices records to log for info
          console.log(await db.all("SELECT * FROM example_table"));

          //If you need to remove a table from the database use this syntax
          //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
        }
      } catch (dbError) {
        console.error(dbError);
      }
    });

// Our server script will call these methods to connect to the db
module.exports = {

//   /**
//    * Get the options in the database
//    *
//    * Return everything in the Choices table
//    * Throw an error in case of db connection issues
//    */
//   getOptions: async () => {
//     // We use a try catch block in case of db errors
//     try {
//       return await db.all("SELECT * from Choices");
//     } catch (dbError) {
//       // Database connection error
//       console.error(dbError);
//     }
//   },

  getExamples: async () => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * FROM example_table");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  createExample: async (name, quantity) => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("INSERT INTO example_table VALUES (NULL, '"+name+"', "+quantity+")");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  getAdminPassword: async (username) => {
    try {
      return await db.all("SELECT password from admins WHERE username='"+username+"'");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },


  createInvite: async (sch_id, phone) => {
    try {
      return await db.all("INSERT INTO invites VALUES (NULL, "+sch_id+", "+phone+")");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },


  createSlot: async (sch_id, start_time, end_time, max_rec) => {
    try {
      return await db.all("INSERT INTO slots VALUES (NULL, "+sch_id+", '"+start_time+"', '"+end_time+"', "+max_rec+")");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },


  createSchedule: async (username, deadline, location, timezone, description, reminder, title) => {
    try {
      return await db.all("INSERT INTO schedules VALUES (NULL, '"+username+"', '"+deadline+"', '"+location+"', '"+timezone+"', '"+description+"', '"+reminder+"', '"+title+"')");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },


createReservation: async (slot_id, identifier, phone) => {
    try {
      return await db.all("INSERT INTO reservations VALUES (NULL, "+slot_id+", '"+identifier+"', "+phone+")");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  getSchedule: async (id) => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * FROM example_table");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },


  getSlot: async (id) => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT sch_id FROM slots WHERE id="+id);
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  getInvite: async (id) => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT sch_id FROM invites WHERE id="+id);
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  getReservation: async (id) => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT slot_id FROM reservations WHERE id="+id);
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },


//   /**
//    * Process a user vote
//    *
//    * Receive the user vote string from server
//    * Add a log entry
//    * Find and update the chosen option
//    * Return the updated list of votes
//    */
//   processVote: async vote => {
//     // Insert new Log table entry indicating the user choice and timestamp
//     try {
//       // Check the vote is valid
//       const option = await db.all(
//         "SELECT * from Choices WHERE language = ?",
//         vote
//       );
//       if (option.length > 0) {
//         // Build the user data from the front-end and the current time into the sql query
//         await db.run("INSERT INTO Log (choice, time) VALUES (?, ?)", [
//           vote,
//           new Date().toISOString()
//         ]);

//         // Update the number of times the choice has been picked by adding one to it
//         await db.run(
//           "UPDATE Choices SET picks = picks + 1 WHERE language = ?",
//           vote
//         );
//       }

//       // Return the choices so far - page will build these into a chart
//       return await db.all("SELECT * from Choices");
//     } catch (dbError) {
//       console.error(dbError);
//     }
//   },

//   /**
//    * Get logs
//    *
//    * Return choice and time fields from all records in the Log table
//    */
//   getLogs: async () => {
//     // Return most recent 20
//     try {
//       // Return the array of log entries to admin page
//       return await db.all("SELECT * from Log ORDER BY time DESC LIMIT 20");
//     } catch (dbError) {
//       console.error(dbError);
//     }
//   },

//   /**
//    * Clear logs and reset votes
//    *
//    * Destroy everything in Log table
//    * Reset votes in Choices table to zero
//    */
//   clearHistory: async () => {
//     try {
//       // Delete the logs
//       await db.run("DELETE from Log");

//       // Reset the vote numbers
//       await db.run("UPDATE Choices SET picks = 0");

//       // Return empty array
//       return [];
//     } catch (dbError) {
//       console.error(dbError);
//     }
//   }
};
