//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");
const _ =  require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

require('dotenv').config()
mongoose.connect("mongodb+srv://admin:admin@shubhamcluster.wxcvr3e.mongodb.net/todolistDB?retryWrites=true&w=majority");
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`);
//schema
const itemsSchema ={
  name: String
};
//model
const Item = mongoose.model("Item",itemsSchema);

//items
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "hit the + button to add new item"
});

const item3 = new Item({
  name: "Hit this to delete an item."
})

const defaultItems = [item1,item2,item3];

//custom route schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};
//create model
const List = mongoose.model("List",listSchema);


app.get("/", function(req, res) {
  Item.find({}).then((items)=>{
    if (items.length === 0) {
      Item.insertMany(defaultItems)
        .then(function () {
          res.redirect("/");
          console.log("Success");
        })
        .catch(function (err) {
          console.log(err);
        });
    }
    res.render("list", {listTitle: "Today", newListItems: items});
  });
});

app.get("/:customRoute", function(req, res) {
  const customListName = _.capitalize(req.params.customRoute);

  List.findOne({ name: customListName })
    .then(function(existingList) {
      if (existingList) {
        //console.log("List already exists");
        res.render("list", { listTitle: customListName, newListItems: existingList.items });
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save()
          .then(function(savedList) {
            console.log(`New list ${savedList.name} created`);
            res.redirect("/"+customListName);
          })
          .catch(function(err) {
            console.log(err);
            res.status(500).send("Error occurred while creating new list");
          });
      }
    })
    .catch(function(err) {
      console.log(err);
      res.status(500).send("Error occurred while finding list");
    });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newitem = new Item({
    name: itemName
  });
  if(listName === "Today"){
    newitem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
    .then(function(found){
      if(found){
        found.items.push(newitem);
        found.save();
        res.redirect("/"+listName);
      }
    })
    .catch(function(err){
      console.log(err);
    });
  }
});

app.post("/delete", async function(req, res) {
  try {
    const id = req.body.check;
    const listName = req.body.listName;
    console.log(listName);
    if(listName === "Today"){
      const removedItem = await Item.findByIdAndRemove(id);
      console.log(`Successfully deleted ${removedItem}`);
      res.redirect("/");
    } else {
      const foundlist = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: id}}});
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred while deleting item");
  }
});



app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
