//Needed for joi access
const joi = require('joi');
//Used to make GET, POST, DELETE requests
const express = require('express');   
//represents application has GET, POST, PUT, DELETE              
const app = express();
//Needed to access mysql database
const mysql = require('mysql');
//needed to gather data from the OMDB API
const axios = require('axios');
//sql statement variable to enter lines of code to enter into database
let sql = "";
//query statement variaable for using methods 
let query = "";
/* *
 * uses the uses method and returns express.json.
 * @param {express.json} returns json repsonse from express.
 */
app.use(express.json());
//port is dynamically asssigned
//enviromental variable is port otherwise assign 3000
const port =process.env.PORT || 3000;
//used to hold the JSON objects in the csv
const csvrows = {};
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
});
/*
 * purpose: method to connect to mysql server
 * @param{err} passes a mysql error
 * @throws err
 */ 
db.connect((err)=>{
    //if an error occurs when connectiong to database throw an error
    if(err){ 
        throw err;
    }
    //otherwise print in terminal "MYSQL connected!"
    console.log("MYSQL connencted!");
});
/*
 * function CreateURL(name)
 * precondtion: none
 * postconditions: Returns proccessed URL
 * Creates a URL with the name the user passes in
 * @param {var} name given by user
 * @return Created URL
 */ 
function CreateUrl(name){
    //variables to search omdb api
    var api = ' http://www.omdbapi.com/?';
    var searchtitle = 't=';
    //TITLE WILL BE REPLACED BY TITLE GIVEN BY USER 
    var title = `${name}`;
     //this api key is unqiuely assigned and necesssary for the api call
    var apikey= '&apikey=f6eeadf6';
    var url = api + searchtitle + title + apikey;
    return url;
}
/* 
 * async function GetRequest(url)
 * precondition: none
 * postconditions: Returns a json object that contains the year,title, and awards info for the movie 
 * @param{var} url created by function CreateUrl(name)
 * @return {var} jsonobject jsonobject of the movie in question
 */
async function GetRequest(url){
    //should wait unitl data is returned by the get request
    const runtimeinfo =  await axios.get(url).then(response => {return response.data.Runtime;})
    .catch(function(error){
        console.log(error);
    });
    //should wait unitl data is returned by the get request
    const genreinfo =  await axios.get(url).then(response => {return response.data.Genre;}) 
    .catch(function(error){
        console.log(error);
    });
    //should wait unitl data is returned by the get request
    const imdbratinginfo =  await axios.get(url).then(response => {return response.data.imdbRating;}) 
    .catch(function(error){
        console.log(error);
    });   
    //should wait unitl data is returned by the get request
    const imdbIDinfo =  await axios.get(url).then(response => {return response.data.imdbID;}) 
    .catch(function(error){
        console.log(error);
    });
    //creates an object with date and title and award nominations
    var jsonobject = { runtime : runtimeinfo, genre: genreinfo, imdID : imdbIDinfo, imdbrating:  imdbratinginfo };
    //should get data from the axios response
    return jsonobject;
}
/*
 * function Create_IMDB_URL(imdbID_middle)
 * purpose: Creates an imdb url that we can give to user to link the movie's imdb page based on the imdbID in the datbase
 * @param {var} imdbID_middle the ID of the movie needed to make the url
 */
function Create_IMDB_URL(imdbID_middle){
    // build a url to link the imdb page
    // we can turn this into hypertext link the user can see later for the html page
    var imdb_url_start = 'https://www.imdb.com/title/';
    var imdb_end_url = '/';
    var imdb_url = imdb_url_start + imdbID_middle + imdb_end_url;   //this is the full url to get to the imbd page
    console.log("\nimdburl : "+ imdb_url );
    return imdb_url;
}
//STILL NEED TO TEST WHEN NOT VALID MOVIE TITLE IS SEARCHED!
/*
 * function Check_database_title(title)
 * precondition: none
 * postconditions: returns the title of the movie from the mysql database 
 * @param {var} title is the title of the movie
 * @return {var} title
 * @throws error when the query could not find title
 */
async function Check_database_title(title) {
    //search database for the title, which is going to be the entity column in the database
    async function get_database_imdb_url(){
        sql = `SELECT imdburl FROM oscar_winner_data_csv WHERE entity = '${title}'`;    //check if the url column contains a url
        query= db.query(sql,(error, result) =>{
            if(error){
                throw error;
            }
            if(result.length <=0){
                console.log("ERROR: NOT VALID MOVIE TITLE.");
            }
            //if the movie title is valid then do the following
            else{
                //if there is not url in the column
                if(result[0].imdburl == null){   
                    console.log("\n IMDB_url is null\n\n");
                    //if its null we want to call the omdb api and fill in the null columns
                    //Create a url to make the omdb call
                    //this is the url used to get the extra data from the OMDB API
                    var url = CreateUrl(title);
                    //1. make the omdb call
                    GetRequest(url).then(result =>  {        
                        console.log( result );
                        //3. Put the result into an UPDATE query for the matching entity update the imdbID,genre,imdbrating, and the runtime
                        sql = `UPDATE oscar_winner_data_csv SET runtime = '${result.runtime }',  genre = '${result.genre}', imdbID = '${result.imdID}', imdbRating = '${result.imdbrating}' WHERE entity =  '${title}'`; 
                        db.query(sql, (error,result ) => {
                            if(error){
                                throw error;
                            }
                            //print the result in the console to ensure its correctness
                            console.log(result);
                            console.log("\nOkay I updated runtime,genre, and ID!\n")
                        });
                        return title;
                    }).then( (title) =>{
                        //Now the database contains the updated runtime, genre, imdbID, and imdbRating for the specific movie title
                        //Now search the movie's imdbID based on the title provided by the user (WE updated the data in the row so we have to do another query)
                        sql = `SELECT imdbID FROM oscar_winner_data_csv WHERE entity = '${title}' `;    //check if the url column contains a url
                        query= db.query(sql,(error, result) =>{
                            if(error){ 
                                throw error;
                            }
                            var imdbID_middle = result[0].imdbID;
                            //Now using the imdbID we are going to create a url to the imdb page for the movie 
                            var imdb_URL= Create_IMDB_URL(imdbID_middle);
                            //print the url
                            console.log("\nimdburl : "+  imdb_URL );
                            //update the database to include the imdburl
                            sql = `UPDATE oscar_winner_data_csv SET imdburl = '${imdb_URL}' WHERE imdbID =  '${imdbID_middle}'`; 
                            db.query(sql, (error,result ) => {
                                if(error){
                                    throw error;
                                }
                                console.log(result);                //print the result in the console to ensure its correcy
                                console.log(`Update the databse with ${imdb_URL}` );
                            });
                        });//end of query for finding the id
                    });// end of the then from updating the runtime, id,         
                }// end of if
                else{
                    console.log(`\nIMDB URL is not null. We have a valid URL for ${title}`);
                    // If imdbID is not null it means we have all the extra columns all not null meaning we can create a url to the imdb api for the user
                    // to watch the film
                    //1. get the imdb url and store it into a variable
                    var imdb_URL = result[0].imdburl;
                    console.log("\nimdburl : "+  imdb_URL );
                }
            }//end of check for valid entry
        });
    }
    get_database_imdb_url();
}
/*
 * function Check_database_title('A Free Soul')
 * precondition: none
 * postcondtion: checks to see if 'A Free Soul is in the database
 * @param{var} 'A Free Soul' hardcoded
 */ 
Check_database_title('A Free Soul');
/*.then(() =>{
    db.end(function(err) {      //close the database connection once you are done.
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
      });
})*/
/*
 * app.get('/api/database/movies/years/:year',(req, res) => GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for year
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */ 
app.get('/api/database/movies/years/:year',(req, res) => {
    /*
     * sql will be a string that holds the command to query the database: SELECT * means choose the entire row
     * FROM oscar_winner_data_csv means we will grabing the data from the oscar_winner_data_csv table in the database
     * WHERE year = ${req.params.year}` means we are only interested in the rows where the year is equal to what the user entered in "/:year"
     */
    sql = `SELECT * FROM oscar_winner_data_csv WHERE year = ${req.params.year}`; //` this is the symbol under the ~
    query= db.query(sql,(error, result) =>{
        if(error){
            throw error;
        }
        console.log(result);
        res.send(result);
        });//end of query 
});
/*
 * app.get('/api/database/movie/year/:year',(req, res) => GET request
 * preconditions: has to be connected to mysql database
 * postconditions: send the result into postman
 * purpose: singleton endpoint for year
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to request data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */
app.get('/api/database/movie/year/:year',(req, res) => {
    /*
     * sql will be a string that holds the command to query the database: SELECT * means choose the entire row
     * FROM oscar_winner_data_csv means we will grabing the data from the oscar_winner_data_csv table in the database
     * WHERE year = ${req.params.year}` means we are only interested in the rows where the year is equal to what the user entered in "/:year"
     */
    sql = `SELECT * FROM oscar_winner_data_csv WHERE year = ${req.params.year} LIMIT 0,1 `; //` this is the symbol under the ~
    query= db.query(sql,(error, result) =>{
        //catchs any errors
        if(error){
            throw error;
        }
        console.log(result);
        res.send(result);

        setTimeout(() => {
            server.close();
        },3000);
    });//end of query 
});
/*
 * app.get('/api/database/movies',(req,res) => GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for movies
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */ 
app.get('/api/database/movies',(req, res) => {
    sql = `SELECT * FROM oscar_winner_data_csv`; //should print entire database NOTICE: there is no WHERE clause because we want EVERYTHING
    query= db.query(sql,(error, result) =>{
        //catchs any errors
        if(error){
            throw error; 
        }
        //logs the results
        //sends the result in JSON to the user                     
        console.log(result);                        
        res.send(result);                           
        setTimeout(() => {
            server.close();
        },3000);
    });//end of query 
});
/*
 * app.get('/api/database/movie/category/:category',(req,res)=>GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: singleton enpoint for category
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */ 
app.get('/api/database/movie/category/:category',(req,res)=> {
    sql = `SELECT * FROM oscar_winner_data_csv WHERE category =  '${req.params.category}' LIMIT 1`; //Grabs 1 matching category
    //NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
    let query= db.query(sql,(error, result) =>{
        //catchs any errors
        if(error){
            throw error;
        }
        //logs the results
        //sends the result in JSON to the user  
        console.log(result);
        res.send(result); 
    });
});
/*
 * app.get('/api/database/movies/categories/:category',(req,res)=>GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for category
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */ 
app.get('/api/database/movies/categories/:category',(req,res)=> {
    sql = `SELECT * FROM oscar_winner_data_csv WHERE category =  '${req.params.category}'`; //Grabs all the matching categories 
    //NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
    query= db.query(sql,(error, result) =>{
        //catchs any errors
        if(error){ 
            throw error;
        }
        //logs the results
        //sends the result in JSON to the user     
        console.log(result);
        res.send(result); 
    });
});
/*
 * app.get('/api/database/movie/entity/:entity',(req,res)=> GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: singleton enpoint entities
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */ 
app.get('/api/database/movie/entity/:entity',(req,res)=> {
    sql = `SELECT * FROM oscar_winner_data_csv WHERE entity =  '${req.params.entity}' LIMIT 1`; //Grabs 1 matching entity
    // NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
    query= db.query(sql,(error, result) =>{
        if(error){
            throw error;
        }
        //logs the results
        //sends the result in JSON to the user     
        console.log(result);
        res.send(result); 
    });
});
/*
 * app.get('/api/database/movies/entities/:entity',(req,res)=> GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for entities
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */ 
app.get('/api/database/movies/entities/:entity',(req,res)=> {
    sql = `SELECT * FROM oscar_winner_data_csv WHERE entity =  '${req.params.entity}'`; //Grabs all the matching entities 
    // NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
    query= db.query(sql,(error, result) =>{
        //catchs any errors
        if(error){
            throw error;
        }
        //logs the results
        //sends the result in JSON to the user     
        console.log(result);
        res.send(result); 
    });
});
/*
 * app.get('/api/database/movies/winners/:winner' => GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for winners
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */            
app.get('/api/database/movies/winners/:winner',(req,res)=>{
    sql = `SELECT * FROM oscar_winner_data_csv WHERE winner =  '${req.params.winner}'`; //Grabs all the matching winner
    //NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
    query= db.query(sql,(error, result) =>{
        //catchs any errors
        if(error){
            throw error;
        }
        //logs the results
        //sends the result in JSON to the user     
        console.log(result);
        res.send(result); 
    });                             
});  
/*
 * app.get('/api/database/movie/winner/:winner',(req, res) => GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: singleton enpoint for winners
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */            
app.get('/api/database/movie/winner/:winner',(req,res)=>{
    sql = `SELECT * FROM oscar_winner_data_csv WHERE winner =  '${req.params.winner}' LIMIT 1`; //Grabs all the matching winner
    //NOTE: make sure to put ${req.params.category} in quotes otherwise databse wont regonize it is a string 
    query= db.query(sql,(error, result) =>{
        //catchs any errors
        if(error){
            throw error;
        }
        //logs the results
        //sends the result in JSON to the user     
        console.log(result);
        res.send(result); 
    });                             
});
/*
 * app.post('/api/database/movie/post',(req, res) => POST request
 * preconditions: must be connected to database
 * postconditions: posted a movie with all its data into the mysl database
 * purpose: POST Request used to insert a movie created by user
 * @param {root} root of the directory where the movies are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */         
app.post('/api/database/movie/post',(req, res) => {
    sql = `INSERT INTO oscar_winner_data_csv VALUES( ${ req.body.year}, '${req.body.category}', '${req.body.winner}', '${req.body.entity}')`; 
    db.query(sql, (error,result ) => {
        //catchs any errors
        if(error){
            throw error;
        }
        console.log(result);
        res.send(result);
    });
});
/*
 * app.put('/api/database/movie/put',(req, res) => PUT Request
 * preconditions: must be connected to database
 * postconditions: send the new data out to postman
 * purpose: searchs for the matching entry in the database based on entity
 * @param {root} root of the directory where the movies are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */ 
app.put('/api/database/movie/put',(req, res) => {
    sql = `UPDATE oscar_winner_data_csv SET year = ${ req.body.year}, category = '${req.body.category}', winner = '${req.body.winner}' WHERE entity = '${req.body.entity}'`; 
    db.query(sql, (error,result ) => {
        //catchs any errors
        if(error){
            throw error;
        }
        console.log(result);
        res.send(result);
    });
});
/*
 * app.delete('/api/database/movie/delete',(req, res) => DELETE Request
 * preconditions: must be connected to database
 * postconditions: send the deleted movie out to postman
 * purpose: searchs for the matching entry in the database based on entity and deletes the rows Singleton endpoint
 * @param {root} root of the directory where the movies are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */ 
app.delete('/api/database/movie/delete',(req, res) => {
    sql = `DELETE FROM oscar_winner_data_csv  WHERE entity = '${req.body.entity}'`; 
    db.query(sql, (error,result ) => {
        //catchs any errors
        if(error){
            throw error;
        }
        console.log(result);
        res.send(result);
    });
});