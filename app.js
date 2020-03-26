const Joi = require('joi');
const express = require('express');
const app = express();  //represents application has GET, POST, PUT, DELETE
const papa = require('papaparse');
const fs = require("fs");
//const file = fs.readFileSync('Oscar_Winner_data_csv.csv',"utf8");
const file = fs.readFileSync('test.csv',"utf8");    //USE THIS ONLY FOR TESTING

/*
Before running this code you must install joi and express
1. If in visual code studio run terminal
2.  npm init 
3. now to install express run: npm install express
4. now to install joi run: npm install joi
5. now to install papa parse run: npm install papaparse
6. Now to test the app run: node app
-Sharon

*/

app.use(express.json());

//port is dynamically asssigned
const port =process.env.PORT || 3000;   //enviromental variable is port otherwise assign 3000
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

//test that they printed correctly
/*for(var i =0; i< csvarray.length; i++)
{
console.log(csvarray[i]);
}*/

function findElementArrayNumber(arr, typecategory, typevalue) {
    var list =[];
    var inner=0;
    for (var i=0; i < arr.length; i++)
     {
    if (arr[i][typecategory] == typevalue)
       { list[inner++] = arr[i];        //copy the element to the list and increament to next spot in list
       }
    }

       return list;
}

//can be used to locate strings within the csv arary/file
function findElementArrayString(arr, typecategory, typevalue) {
    var list2 =[];
    var inner=0;
    for (var i=0; i < arr.length; i++)
     {
           if ((arr[i][typecategory]).localeCompare(typevalue) == 0)
             list2[inner++] = arr[i];
    }
       return list2;
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
        // returns an array of all the movies that fit this year
        //FUTURE IDEA: Check that is has also won an ocscar!
        var movieyear = findElementArrayNumber(csvarray, "year", req.params.year);

        //TEST ONLY DO NOT INCLUDE IN FINAL CODE //////////////////
        console.log("\nThis is what I found!\n");
         //TEST ONLY DO NOT INCLUDE IN FINAL CODE ///////////////////////
    
        if(!movieyear)  //404 not found
           { res.status(404).send('The Movie year was not found'); }  //if year is not in array 404 display msg

            res.send(movieyear);   //if you find the year then send it to the user
        
        });

        app.get('/api/movies/categories/:category',(req,res)=>{
            // returns an array of all the movies that fit this year
            //FUTURE IDEA: Check that is has also won an ocscar!
            var moviecategory = findElementArrayString(csvarray, "category", req.params.category);
    
            //TEST ONLY DO NOT INCLUDE IN FINAL CODE //////////////////
            console.log("\n  api/movies/categories/:category  \n");
             //TEST ONLY DO NOT INCLUDE IN FINAL CODE ///////////////////////
        
            if(moviecategory.length == 0)
                res.status(404).send(`The Movie category ${req.params} was not found`);  
    
                res.send(moviecategory);   //if you find the year then send it to the user
            
            });


            //FUTURE IDEAS: Modify this code to find all entites that start with a certain letter
            //example /api/movies/entities/E shows all entities that start with an E
            app.get('/api/movies/entities/:entity',(req,res)=>{
                // returns an array of all the movies that fit this year
                //FUTURE IDEA: Check that is has also won an ocscar!
                var moviecategory = findElementArrayString(csvarray, "entity", req.params.entity);
        
                //TEST ONLY DO NOT INCLUDE IN FINAL CODE //////////////////
                console.log("\n  api/movies/entities/:entity  \n");
                 //TEST ONLY DO NOT INCLUDE IN FINAL CODE ///////////////////////
            
                if(moviecategory.length == 0)
                    res.status(404).send(`The Movie entity ${req.params} was not found`);  
        
                    res.send(moviecategory);   //if you find the year then send it to the user
                
                });

                //FUTURE IDEAS: Modify this code to find all movies that are true or false regaurdless of how the user capitalizes them
            //example /api/movies/entities/true shows all movies that are True
                app.get('/api/movies/winners/:winner',(req,res)=>{
                    // returns an array of all the movies that fit this year
                    //FUTURE IDEA: Check that is has also won an ocscar!
                    var moviecategory = findElementArrayString(csvarray, "winner", req.params.winner);
            
                    //TEST ONLY DO NOT INCLUDE IN FINAL CODE //////////////////
                    console.log("\n  /api/movies/winners/:winner  \n");
                     //TEST ONLY DO NOT INCLUDE IN FINAL CODE ///////////////////////
                
                    if(moviecategory.length == 0)
                        res.status(404).send(`The Movie oscar winner ${req.params} was not found`);  
            
                        res.send(moviecategory);   //if you find the year then send it to the user
                    
                    });           



                  //delete from the array  not the csv file
                  //1. finding specific object
                  //2. update object 
                  //3. update the array
                  //JOHN Claimed 
                  //-research how to make branches

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

