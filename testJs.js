const data = require("./src/data.json");
const db = require("./src/" + data.database);
const adminPassword = await db.getAdminPassword("herkyHawk");
console.log("TESTING ADMIN READ: ");
console.log(adminPassword);