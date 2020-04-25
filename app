const Joi = require('joi');
const express = require('express');
const app = express();  //represents application has GET, POST, PUT, DELETE
const papa = require('papaparse');
const fs = require("fs");
const file = fs.readFileSync('Oscar_Winner_data_csv.csv',"utf8");
const list2 =[];
const o = 0;
var i;
var index = 0;
var inner = 0;
var list = [];
app.use(express.json());
//port is dynamically asssigned
//enviromental variable is port otherwise assign 3000
const port = process.env.PORT || 3000;   //enviromental variable is port otherwise assign 3000
const csvrows = {}; //used to hold the JSON objects in the csv
//parse the csv file using papa parse
papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results){
        csvrows.data = results.data;
        csvrows.errors = results.errors;
        csvrows.meta = results.meta;
    }
})
//create an array from the objects fromt the csv file
const csvarray = csvrows.data.map ( row => {
    const {year,category,winner,entity } = row;
    return {year,category,winner,entity}
})
function findElementArrayNumber(arr, typecategory, typevalue) {
    list =[];
    inner=0;
    for (i=0; i < arr.length; i++)
     {
    if (arr[i][typecategory] == typevalue)
       { list[inner++] = arr[i];        //copy the element to the list and increament to next spot in list
       }
    }

       return list;
}
//can be used to locate strings within the csv arary/file
function findElementArrayString(arr, typecategory, typevalue) {
    list =[];
    inner=0;
    for (i=0; i < arr.length; i++)
     {
           if ((arr[i][typecategory]).localeCompare(typevalue) == 0)
             list[inner++] = arr[i];
    }
       return list;
}
//function to help redundency in both collection and singleton delete
function deleted(entit){
    index = csvarray.indexOf(entit);
    csvarray.splice(index,1); 
    return entit;
}
//used to return all the elements in the csv file (Its a collection endpoint)
app.get('/api/movies',(req, res) => {
    res.send(csvarray);
});
//Sends a message in terminal to verify that a server is up and running
//NOTE: Ensure to use correct port name when connecting on POSTMAN
//Example: http://localhost:3000/api/movies
app.listen(port,()=> console.log(`Listening on port ${port}...`));
app.get('/api/movies/years/:year',(req,res)=>{
    var movieyear = findElementArrayNumber(csvarray, "year", req.params.year);
    if(!movieyear)  //404 not found
    { res.status(404).send('The Movie year was not found'); }  //if year is not in array 404 display msg
        res.send(movieyear);   //if you find the year then send it to the user
    });
app.get('/api/movies/categories/:category',(req,res, next)=>{
    inner=0;
    var category = req.params.categories;
    for (i=0; i < csvarray.length; i++){
        if (csvarray[i]['categories'] == category){
            var prevlength = list2.length;
            next();
            if(prevlength != list2.length){
                list[o--] = csvarray[i]['categories'];
            }
        } 
    }
    if(list2.length == 0){
        return res.status(404).send(`The Movie category ${req.params} was not found`);  
    }
    return res.send(list2);   //if you find the year then send it to the user
});
app.get('/api/movies/winners/:winner',(req, next)=>{
    var Trues = req.params.winner;
    if(csvarray[o]['winners'] == Trues){
        list2[o++];
    }
});
//FUTURE IDEAS: Modify this code to find all entites that start with a certain letter
//example /api/movies/entities/E shows all entities that start with an E
app.get('/api/movies/entities/:entity',(req,res)=>{
    var moviecategory = findElementArrayString(csvarray, "entity", req.params.entity);
    if(moviecategory.length == 0){
        res.status(404).send(`The Movie entity ${req.params} was not found`);  
    }
    res.send(moviecategory);   //if you find the year then send it to the user
});
app.get('/api/movies/winners/:winner',(req,res)=>{
    var moviecategory = findElementArrayString(csvarray, "winner", req.params.winner);
    if(moviecategory.length == 0){
        res.status(404).send(`The Movie oscar winner ${req.params} was not found`);  
    }
    res.send(moviecategory);   //if you find the year then send it to the user
});           
//Singleton delete
app.delete('/api/movie/entity/:entity',(req,res)=>{
    const entit = csvarray.find( c=> c.entity === req.params.entity);
    if(!entit) res.status(404).send('incorrect');
    list = [];
    list = deleted(entit);
    res.send(list);
});
//collection delete
app.delete('/api/movies/entities/:entity',(req,res)=>{
    const entit  = csvarray.find( c=> c.entity === req.params.entity);
    if(!entit) res.status(404).send('incorrect');
    const list = [];
    for(i = 0; i <csvarray.length; i++){
        const entit  = csvarray.find( c=> c.entity === req.params.entity);
        if(entit!=null){
            list[i] = deleted(entit);  
        }
    }
    //collection return
    res.send(list);
});
app.post('/api/movies', (req, res) => {
    const movie = {                    
        year: req.params.year,
        category: req.params.category,
        winner: req.params.winner,
        entity: req.params.entity
    };
    movies.push(movie);
    var length = csvarray.length;
    csvarray[length] = movie;
    //Singleton
    res.send(movie);
});
//put request updating the array 
//1. finding specific object
//2. update object 
//3. update the array
//Leena
//

//POST request : adding something to csv array
//1. add object to array
//2. return the updated array
//Jordan 
// 