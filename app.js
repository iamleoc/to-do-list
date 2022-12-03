// Set Up

const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

function toTitleCase(str) {
    return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
};

const itemsSchema = {
    name: String
};
const Item = mongoose.model(
    "Item",
    itemsSchema
);

const item1 = new Item ({
    name: "Welcome to your to do list!"
});
const item2 = new Item ({
    name: "Hit the + to add a new item"
});
const item3 = new Item ({
    name: "<-- Press the delete button to remove an item"
});
defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

let day = "Today";

// Code

app.get("/", function(req, res) {
    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added default items to DB!");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {title: day, listOfItems: foundItems});
        };
    });


})

app.get("/:customListName", function(req, res){
    const customListName = req.params.customListName.toLowerCase();
    List.findOne({name: customListName}, function(err, list){
        if (err){
            console.log(err)
        } else {
            if (list){
                res.render("list", {title: toTitleCase(list.name), listOfItems: list.items});
            } else {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            };
        };
    });
});


app.post("/", function(req, res) {
    const itemName = req.body.item;
    const list = req.body.list.toLowerCase();

    const item = new Item({
        name: itemName
    });

    if (list === day) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: list}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + list);
        })
    }
})

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const list = req.body.listName.toLowerCase();

    if (list === day) {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if (err){
                console.log(err)
            } else {
                console.log("Successfully deleted item.");
            };
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            {name: list},
            {$pull: {items: {_id: checkedItemId}}},
            function(err, result){
                if (err){
                    console.log(err);
                } else {
                    console.log("Successfully deleted custom list item.");
                    res.redirect("/" + list);
                };
            }
        );

    };


});

// Listening

app.listen(3000, function() {
    console.log("Server is running on port 3000 ...");
})
