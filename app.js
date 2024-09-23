const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { Sequelize } = require("sequelize");
const { User } = require("./models"); // Import User model
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Database connection
const sequelize = new Sequelize("postgis_sample", "postgres", "postgres", {
  host: "localhost",
  dialect: "postgres",
  port: 5432,
});

sequelize
  .authenticate()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Unable to connect to PostgreSQL:", err));

// Check if user is authenticated (middleware)
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // User is authenticated, continue to the next middleware or route
  }
  res.redirect("/login"); // If not authenticated, redirect to login page
}

// Serve the login/register page
app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/map"); // Redirect to dashboard if already logged in
  }
  res.sendFile(path.join(__dirname, "public", "auth.html")); // Serve the login/register page
});

// User registration route
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      username,
      password: hashedPassword,
    });

    // Redirect to login after successful registration
    res.redirect("/login");
  } catch (error) {
    res.status(500).send("Error registering user");
  }
});

// User login route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user in database
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).send("User not found");
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      req.session.user = user; // Store user in session
      res.redirect("/map"); // Redirect to dashboard (map) after successful login
    } else {
      res.status(400).send("Invalid credentials");
    }
  } catch (error) {
    res.status(500).send("Error logging in");
  }
});

// User dashboard (map) route (secured)
app.get("/map", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Serve the dashboard (map) page
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login"); // Redirect to login page after logout
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
