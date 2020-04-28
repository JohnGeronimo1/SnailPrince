
const joi = require('joi');
const express = require('express');                 //Used to make GET, POST, DELETE requests
const app = express();                              //represents application has GET, POST, PUT, DELETE
const mysql = require('mysql');                     //Needed to access mysql database
const axios = require('axios');                     //needed to gather data from the OMDB API

//the following imports grab the functions from the util file
const CreateUrl = require('./util').CreateUrl;      // the ./ means look for util in a different location at the same current level
const Create_IMDB_URL = require('./util').Create_IMDB_URL;

/*
Before running this code you must install joi and express
1. If in visual code studio run terminal
2.  npm init 
3. now to install express run: npm install express
4. now to install express run: npm install joi
5. now to install express run: npm install mysql
6. now to install express run: npm install axios
7. Now to test the app run: node app
8. To stop a live server type ctrl c in terminal
-Sharon
*/

app.use(express.json());

//port is dynamically asssigned
const port =process.env.PORT || 3000;   //enviromental variable is port otherwise assign 3000
const csvrows = {}; //used to hold the JSON objects in the csv


//Sends a message in terminal to verify that a server is up and running
//NOTE: Ensure to use correct port name when connecting on POSTMAN
//Example: http://localhost:3000/api/movies
var server = app.listen(port,()=> console.log(`Listening on port ${port}...`));     


//db is the connection to the mySQL database containing the csv data
const db= mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'moviesdata1' ,
  password: 'sqlDoggo99'
} );

//establish a connection to the database we have created 
db.connect((err)=>
{
    if(err)
    { throw err;}       //if an error occurs when connectiong to database throw an error
    console.log("MYSQL connencted!");
});

/*async function GetRequest()
precondition: none
postconditions: Returns a json object that contains the year,title, and awards info for the movie 
*/
async function GetRequest(url)
{
    const runtimeinfo =  await axios.get(url).then(response => {return response.data.Runtime;}) //should wait unitl data is returned by the get request
    .catch(function(error){
        console.log(error);
    });

    const genreinfo =  await axios.get(url).then(response => {return response.data.Genre;}) //should wait unitl data is returned by the get request
    .catch(function(error){
        console.log(error);
    });

    const imdbratinginfo =  await axios.get(url).then(response => {return response.data.imdbRating;}) //should wait unitl data is returned by the get request
    .catch(function(error){
        console.log(error);
    });
    
    const imdbIDinfo =  await axios.get(url).then(response => {return response.data.imdbID;}) //should wait unitl data is returned by the get request
    .catch(function(error){
        console.log(error);
    });

    //creates an object with date and title and award nominations
    var jsonobject = { runtime : runtimeinfo, genre: genreinfo, imdID : imdbIDinfo, imdbrating:  imdbratinginfo };

    return jsonobject;                        //should get data from the axios response
}//end of GetRequest

//STILL NEED TO TEST WHEN NOT VALID MOVIE TITLE IS SEARCHED!

/*function Check_database_title(title)
purpose: Finds the link to the imdb page based on the movie title given by the user
*/
async function Check_database_title(title) {
// search database for the title, which is going to be the entity column in the database

    async function get_database_imdb_url(){
        let sql = `SELECT imdburl FROM oscar_winner_data_csv WHERE entity = '${title}'`;    //check if the url column contains a url
        let query= db.query(sql,(error, result) =>{
            if(error) throw error;
            if( result.length <=0 ) console.log("ERROR: NOT VALID MOVIE TITLE.");
            else    //if the movie title is valid then do the following
            {
               if(result[0].imdburl == null)                //if there is not url in the column
            {   console.log("\n IMDB_url is null\n\n");
                        //if its null we want to call the omdb api and fill in the null columns
                        //Create a url to make the omdb call
                        var url = CreateUrl(title);         //this is the url used to get the extra data from the OMDB API
                    
                        //1. make the omdb call
                        GetRequest(url).then(result =>  {        
                            console.log( result );

                            //3. Put the result into an UPDATE query for the matching entity update the imdbID,genre,imdbrating, and the runtime
                            let sql = `UPDATE oscar_winner_data_csv SET runtime = '${result.runtime }',  genre = '${result.genre}', imdbID = '${result.imdID}', imdbRating = '${result.imdbrating}' WHERE entity =  '${title}'`; 
                                db.query(sql, (error,result ) => {
                                if(error) throw error;
                                console.log(result);                //print the result in the console to ensure its correcy
                                console.log("\nOkay I updated runtime,genre, and ID!\n")    // just a testing
                                });//end of query
                                return title;
                        }).then( (title) => {

                        //Now the database contains the updated runtime, genre, imdbID, and imdbRating for the specific movie title

                        //Now search the movie's imdbID based on the title provided by the user (WE updated the data in the row so we have to do another query)
                        var sql = `SELECT imdbID FROM oscar_winner_data_csv WHERE entity = '${title}' `;    //check if the url column contains a url
                        let query= db.query(sql,(error, result) =>{
                        if(error) throw error;
                        var imdbID_middle = result[0].imdbID;

                        //Now using the imdbID we are going to create a url to the imdb page for the movie 
                        var imdb_URL= Create_IMDB_URL(imdbID_middle);
                        console.log("\nimdburl : "+  imdb_URL );        //print the url
                        
                        //update the database to include the imdburl
                        let sql = `UPDATE oscar_winner_data_csv SET imdburl = '${imdb_URL}' WHERE imdbID =  '${imdbID_middle}'`; 
                                db.query(sql, (error,result ) => {
                                if(error) throw error;
                                console.log(result);                //print the result in the console to ensure its correcy
                                console.log(`Update the databse with ${imdb_URL}` );
                                });

                        });//end of query for finding the id

                    });// end of the then from updating the runtime, id, 

                
            }// end of if
            else{
                    console.log(`\nIMDB URL is not null. We have a valid URL for ${title}`);
                    //If imdbID is not null it means we have all the extra columns all not null meaning we can create a url to the imdb api for the user
                    // to watch the film
                    //1. get the imdb url and store it into a variable
                    var imdb_URL = result[0].imdburl;
                    console.log("\nimdburl : "+  imdb_URL );
            }
        }//end of check for valid entry
});

}
get_database_imdb_url();

}//end of Check_database_title('A Free Soul');

//this will find the imdb page url
Check_database_title('The Champ');
/*.then(() =>{                      //testing code I am still working on - sharon
    db.end(function(err) {      //close the database connection once you are done.
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
      });
})*/


//Collection endpoint for year
app.get('/api/database/movies/years/:year',(req, res) => {
    /*sql will be a string that holds the command to query the database: SELECT * means choose the entire row
    FROM oscar_winner_data_csv means we will grabing the data from the oscar_winner_data_csv table in the database
    WHERE year = ${req.params.year}` means we are only interested in the rows where the year is equal to what the user entered in "/:year"
    */
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE year = ${req.params.year}`; //` this is the symbol under the ~
    let query= db.query(sql,(error, result) =>{
        if(error) throw error;
        console.log(result);
        res.send(result);
    });//end of query 
    });//end of app.get for years


//singleton endpoint for year
app.get('/api/database/movie/year/:year',(req, res) => {
    /*sql will be a string that holds the command to query the database: SELECT * means choose the entire row
    FROM oscar_winner_data_csv means we will grabing the data from the oscar_winner_data_csv table in the database
    WHERE year = ${req.params.year}` means we are only interested in the rows where the year is equal to what the user entered in "/:year"
    */
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE year = ${req.params.year} LIMIT 0,1 `; //` this is the symbol under the ~
    let query= db.query(sql,(error, result) =>{
        if(error) throw error;
        console.log(result);
        res.send(result);
    });//end of query 
    });//end of app.get for years

    //POST Request
app.post('/api/database/movie/post',(req, res) => {
    let sql = `INSERT INTO oscar_winner_data_csv VALUES( ${ req.body.year}, '${req.body.category}', '${req.body.winner}', '${req.body.entity}')`; 
       db.query(sql, (error,result ) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
       });
    });//end of app.get for years
 

//PUT Request
//searchs for the matching entry in the database based on entity
app.put('/api/database/movie/put',(req, res) => {
    let sql = `UPDATE oscar_winner_data_csv SET year = ${ req.body.year}, category = '${req.body.category}', winner = '${req.body.winner}' WHERE entity = '${req.body.entity}'`; 
       db.query(sql, (error,result ) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
       });
    });//end of app.get for years
 
    //DELETE Request
//searchs for the matching entry in the database based on entity and deletes the rows
app.delete('/api/database/movie/delete',(req, res) => {
    let sql = `DELETE FROM oscar_winner_data_csv  WHERE entity = '${req.body.entity}'`; 
       db.query(sql, (error,result ) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
       });
    });//end of app.delete 

//used to return all the elements in the csv table in the database (Its a collection endpoint)
app.get('/api/database/movies',(req, res) => {
    let sql = `SELECT * FROM oscar_winner_data_csv`; //should print entire database NOTICE: there is no WHERE clause because we want EVERYTHING
    let query= db.query(sql,(error, result) =>{
        if(error) throw error;                      //catchs any errors
        console.log(result);                        //logs the results
        res.send(result);                           //send the result in JSON to the user
    
    });//end of query 
    });

//singleton endpoint for category
   //used to return 1 the row that has matching a category in the csv table in the database 
     app.get('/api/database/movie/category/:category',(req,res)=>{
            let sql = `SELECT * FROM oscar_winner_data_csv WHERE category =  '${req.params.category}' LIMIT 1`; //Grabs 1 matching category
           // NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
            let query= db.query(sql,(error, result) =>{
            if(error) throw error;
             console.log(result);
             res.send(result); 
            });
        });//end of get request for categories

         //used to return all the elements that have matching a category in the csv table in the database (Its a collection endpoint)
app.get('/api/database/movies/categories/:category',(req,res)=>{
        let sql = `SELECT * FROM oscar_winner_data_csv WHERE category =  '${req.params.category}'`; //Grabs all the matching categories 
       // NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
        let query= db.query(sql,(error, result) =>{
        if(error) throw error;
         console.log(result);
         res.send(result); 
        });
});//end of get request for categories

//singleton endpoint for entity
    //used to return all the elements that have matching a entity in the csv table in the database    
    app.get('/api/database/movie/entity/:entity',(req,res)=>{
            let sql = `SELECT * FROM oscar_winner_data_csv WHERE entity =  '${req.params.entity}' LIMIT 1`; //Grabs 1 matching entity
            // NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
             let query= db.query(sql,(error, result) =>{
             if(error) throw error;
              console.log(result);
              res.send(result); 
             });
     });

 //used to return all the elements that have matching a entity in the csv table in the database (Its a collection endpoint)     
 app.get('/api/database/movies/entities/:entity',(req,res)=>{
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE entity =  '${req.params.entity}'`; //Grabs all the matching entities 
    // NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
     let query= db.query(sql,(error, result) =>{
     if(error) throw error;
      console.log(result);
      res.send(result); 
     });
});


 //used to return all the elements that have matching a winner in the csv table in the database (Its a collection endpoint)             
 app.get('/api/database/movies/winners/:winner',(req,res)=>{
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE winner =  '${req.params.winner}'`; //Grabs all the matching winner
    // NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
     let query= db.query(sql,(error, result) =>{
     if(error) throw error;
      console.log(result);
      res.send(result); 
     });                             
 });       
 
 //singleton endpoint for winner
 //used to return all the elements that have matching a winner in the csv table in the database (Its a collection endpoint)             
 app.get('/api/database/movie/winner/:winner',(req,res)=>{
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE winner =  '${req.params.winner}' LIMIT 1`; //Grabs all the matching winner
    // NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
     let query= db.query(sql,(error, result) =>{
     if(error) throw error;
      console.log(result);
      res.send(result); 
     });                             
 });        
