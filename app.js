var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var assert = require('assert');

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();
var ldap = require("ldapjs");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

function authenticateDN(username, password) {
  var client = ldap.createClient({
    url: "ldap://brahma.powergrid.in:389",
  });
  client.bind(username, password, function (err) {
    if (err) {
      console.log("Incorrect Credentials!");
    } else {
      const opts = {
        filter:
          "sAMAccountName=60001441",
        scope: "sub",
        attributes: ["name", "title", "l"],
      };

      client.search("OU=WR2,DC=powergrid,DC=in", opts, (err, res) => {
        assert.ifError(err);

        res.on("searchEntry", function (data) {
          //console.log("Data found", data);
          var empData= JSON.stringify(data.object);
          var empDataJSON = JSON.parse(empData);
          console.log(empDataJSON.name, empDataJSON.title, empDataJSON.l);
        });
        res.once("error", function (error) {
          throw error;
        });
        res.once("end", function () {
          //console.log("All passed");
          process.exit(0);
        });
      });
    }
  });
}

authenticateDN("60003836@powergrid.in", "Ank@122221");

module.exports = app;
