// Dependencies //
var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models")

var port = process.env.PORT || 3000;

var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set('index', __dirname + '/views');

// Local and Deployed DB //
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
var results = [];

// Routes start here //
app.get("/", function (req, res) {
    db.Article.find({ saved: false }, function (err, result) {
        if (err) throw err;
        res.render("index", { result })
    })

});
app.get("/newscrape", function (req, res) {
    axios.get("https://www.nytimes.com/").then(function (response) {
        var $ = cheerio.load(response.data)
        $("h2 span").each(function (i, element) {
            var headline = $(element).text();
            var link = "https://www.nytimes.com";
            link = link + $(element).parents("a").attr("href");
            var summaryOne = $(element).parent().parent().siblings().children("li:first-child").text();
            var summaryTwo = $(element).parent().parent().siblings().children("li:last-child").text();

            if (headline && summaryOne && link) {
                results.push({
                    headline: headline,
                    summaryOne: summaryOne,
                    summaryTwo: summaryTwo,
                    link: link
                })
            }
        });
        db.Article.create(results)
            .then(function (dbArticle) {
                res.render("index", { dbArticle });
                console.log(dbArticle);
            })
            .catch(function (err) {
                console.log(err);
            })
        app.get("/", function (req, res) {
            res.render("index")
        })
    })
});

app.put("/update/:id", function (req, res) {
    console.log("!!!...UPDATE...!!!")
    db.Article.updateOne({ _id: req.params.id }, { $set: { saved: true } }, function (err, result) {
        if (result.changedRows == 0) {
            return res.status(404).end();
        } else {
            res.status(200).end();
        }
    });
});
app.put("/unsave/:id", function(req, res) {
    console.log("XXXXXXXXXXX")
    console.log(req.body)
    db.Article.updateOne({ _id: req.params.id }, { $set: { saved: false }}, function(err, result) {
        if (result.changedRows == 0) {
            return res.status(404).end();
        } else {
            res.status(200).end();
        }
    })
})

app.put("/newnote/:id", function(req, res) {
    console.log("***********")
    console.log(req.body)
    console.log(req.body._id);
    console.log(req.body.note);
    db.Article.updateOne({ _id: req.body._id }, { $push: { note: req.body.note }}, function(err, result) {
        console.log(result)
        if (result.changedRows == 0) {
            return res.status(404).end();
        } else {
            res.status(200).end();
        } 
    })
})



app.get("/saved", function (req, res) {
    var savedArticles = [];
    db.Article.find({ saved: true }, function (err, saved) {
        if (err) throw err;
        savedArticles.push(saved)
        res.render("saved", { saved })
    })
})


app.listen(port, function () {
    console.log("Server listening on: http://localhost:" + port);
})