const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb"); // Correção aqui
const _ = require("lodash");
require("dotenv").config();

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect(process.env.MONGO_URI);

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
})

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({
  name: "Welcome to your ToDoList!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  items: [itemSchema]
})

const List = mongoose.model("list", listSchema)

app.get('/', (req, res) => {
  Item.find().then(itens => {
    let items = [];
    //Verifica se o array está vazio, se estiver vai preenche-lo com os primeiros itens
    if(itens.length === 0){
      Item.insertMany([item1, item2, item3]).then(docs => {
        console.log("Diversos itens foram adicionados");
      }).catch(err => {
        console.log(err);
      });
    }
    itens.forEach(item => {
      items.push(item.name);
    });
    res.render('list',{listTitle: "Home Page", itensList: items});
    // O render procurará pelo arquivo list.ejs na pasta views, e enviará a variável kindOfDay com o conteúdo da variável day para lá
    console.log(items);
  }).catch(err =>{
    console.log(err);
  });
});

app.get('/about', (req, res) =>{
  res.render('about',{});
})

app.post("/", (req, res) =>{
  const pageName = req.body.button;
  const itemName = req.body.newItem;
  const newItem = new Item ({
  name: itemName
  });
  //Página Principal
  if(pageName === "Home Page"){
    newItem.save();
    res.redirect("/");
  }
  //Se não for a página principal
  else{
    List.findOne({title: pageName}).then(list => {
      //Coloca o novo item dentro da List
      list.items.push(newItem);
      list.save();
      res.redirect("/" + pageName);
    }).catch(err => {
      console.log("Foi retornado o seguinte erro no metodo post vindo da página:" + pageName + " " + err);
      res.redirect("/" + pageName);
    });
  }
})

app.post("/delete", (req, res) => {
  const pageName = req.body.listTitle;
  const itemName = req.body.itemList;
  if(pageName === "Home Page"){
    Item.deleteOne({name: itemName}).then(docs =>{
      console.log("Removido com sucesso");
    }).catch(err => {
      console.log("Não foi possível remover");
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate(
      { title: pageName },
      { $pull: { items: { name: itemName } } }
    ).then(updatedList => {
      if (updatedList) {
        console.log("Item removido com sucesso da lista!");
      } else {
        console.log("Lista não encontrada ou item não removido.");
      }
    }).catch(error => {
      console.error("Erro ao atualizar a lista:", error);
    });
    res.redirect("/" + pageName);
  }
})

app.get("/:customRoute", (req, res) => {
  const customRoute = _.capitalize(req.params.customRoute);
  List.findOne({title: customRoute}).then(list => {
      if(list){
        var listArray = [];
        //Carrega a página
        //Coloca apenas as string name dentro do array listArray
        list.items.forEach(item => {
          listArray.push(item.name);
        });
        res.render('list', {listTitle: list.title, itensList: listArray});
      }
      else{
        //Adiciona a rota no servidor e carrega a página default
        const list = new List({
          title: customRoute,
          items: [item1, item2, item3]
        });
        list.save();
        res.redirect("/" + customRoute);
      }
    }).catch(err => {
    console.log("Foi retornado o seguinte erro na custom route " + customRoute + ": " + err);
  });
  console.log(customRoute);
})

app.listen(3000, () => {
    console.log("Server runnning on port 3000");
});