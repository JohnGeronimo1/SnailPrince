const joi = require('joi');                         //Required to prove validation of JS objects.
const express = require('express');                 //Used to make GET, POST, PUT, DELETE requests
const app = express();                              //Represents application has GET, POST, PUT, DELETE
const mysql = require('mysql');                     //Needed to access mysql database
const axios = require('axios');                     //Needed to gather data from the OMDB API

//The following imports grab the functions from the util file
const CreateUrl = require('./util').CreateUrl;      // The ./ means look for util in a different location at the same current level
const Create_IMDB_URL = require('./util').Create_IMDB_URL;

const config ={
    host:        'localhost',
    user:             'root',
    database:  'moviesdata1',
    password:   'sqlDoggo99'
}

  class Database {
    constructor( config ) {
        this.connection = mysql.createConnection( config );
  }
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            this.connection.query( sql, args, ( err, rows ) => {
                if ( err )
                    return reject( err );
                resolve( rows );
            } );
        } );
    }
    close() {
        return new Promise( ( resolve, reject ) => {
            this.connection.end( err => {
                if ( err )
                    return reject( err );
                resolve();
            } );
        } );
    }
}
  
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

//Sends a message in terminal to verify that a server is up and running
//NOTE: Ensure to use correct port name when connecting on POSTMAN
//Example: http://localhost:3000/api/movies
var server = app.listen(port,()=> console.log(`Listening on port ${port}...`));     



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
//Check_database_title('The Champ');
/*.then(() =>{                      //testing code I am still working on - sharon
    db.end(function(err) {      //close the database connection once you are done.
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Closed the database connection.');
      });
})*/

  //singleton endpoint for year
app.get('/api/database/movie/year/:year',(req, res) => {
    /*sql will be a string that holds the command to query the database: SELECT * means choose the entire row
    FROM oscar_winner_data_csv means we will grabing the data from the oscar_winner_data_csv table in the database
    WHERE year = ${req.params.year}` means we are only interested in the rows where the year is equal to what the user entered in "/:year"
    */

   database = new Database (config);
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE year = ? LIMIT 0,1 `; //` this is the symbol under the ~
    database.query(sql, req.params.year ).then(result => {
        console.log(result);
        res.send(result);
        database.close();
        res.end();
    });//end of query 
    });//end of app.get for years

//Collection endpoint for year
app.get('/api/database/movies/years/:year',(req, res) => {
    //sql will be a string that holds the command to query the database: SELECT * means choose the entire row
    //FROM oscar_winner_data_csv means we will grabing the data from the oscar_winner_data_csv table in the database
    //WHERE year = ${req.params.year}` means we are only interested in the rows where the year is equal to what the user entered in "/:year"
    database = new Database (config);
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE year = ?`; //` this is the symbol under the ~
    database.query(sql, req.params.year ).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query 
    });//end of app.get for years

 
    //Collection endpoint for a date range function
    //purpose: returns all the movies that occur within the data range
app.get('/api/database/movies/years/:year1/:year2',(req, res) => {
    //params is an array containg the parameters from the get request
    //sql will be a string that holds the command to query the database: SELECT * means choose the entire row
    //FROM oscar_winner_data_csv means we will grabing the data from the oscar_winner_data_csv table in the database
    //WHERE year BETWEEN ? and ?` means we are only interested in the rows where the year is between what the user entered in "/:year1 and /:year2"
    //ORDER BY  year ASC, entity ASC means we are ordering the results by their entity name and year in ascending order
    database = new Database (config);
    params = [req.params.year1, req.params.year2];
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE year BETWEEN ? AND ? ORDER BY year ASC, entity ASC;`; 
    database.query(sql, params ).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query 
    });//end of app.get for date range function

    //POST Request
    //Purpose: Allows the user to insert a new row into the database. User can only insert the year, category, winner, and entity.
app.post('/api/database/movie/post',(req, res) => {
       database = new Database (config);
       let params = [req.body.year , `${req.body.category}` , `${req.body.winner}` , `${req.body.entity}`]; //user can only provide the year,the category,the name of the entity, whether an award is won, 
     let sql = `INSERT INTO oscar_winner_data_csv (year, category, winner, entity) VALUES(?,?,?,?)`;//inserts specifically into the year,category, winner, entity columns
       database.query(sql,params).then(result => {  //this connects to the database, passes the paramters into the sql command and closes the connection
           console.log(result);
           res.send(result);
           database.close();
       });//end of query 
    });//end of app.get for years
 

//PUT Request
//searchs for the matching entry in the database based on entity. Update the year, category, winner columns.
app.put('/api/database/movie/put',(req, res) => {
       database = new Database (config);
       params=[ req.body.year, `${req.body.category}` , `${req.body.winner}`,`${req.body.entity}`];
       let sql = `UPDATE oscar_winner_data_csv SET year = ?, category = ?, winner = ? WHERE entity = ?`; 
    database.query(sql,params).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query
});

    //DELETE Request
//searchs for the matching entry in the database based on entity. It then deletes the corresponding rows.
app.delete('/api/database/movie/delete',(req, res) => {
    database = new Database (config);
    params=[`${req.body.entity}`];
    let sql = `DELETE FROM oscar_winner_data_csv  WHERE entity = ? LIMIT 1`; 
    database.query(sql,params).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query
    });//end of app.delete 
  
        //DELETE Request
        //Singleton Delete request. Not a collection because that would endanger the database
//searchs for the matching entry in the database based on the year. It then deletes the corresponding rows.
app.delete('/api/database/movie/delete',(req, res) => {
    database = new Database (config);
    let params = [req.body.year , `${req.body.category}` , `${req.body.winner}` , `${req.body.entity}`]; //user can only provide the year,the category,the name of the entity, whether an award is won,
    let sql = `DELETE FROM oscar_winner_data_csv  WHERE year = ? AND category = ? AND winner = ? AND entity = ? LIMIT 1`; 
    database.query(sql,params).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query
    });//end of app.delete 


//DELETE Request
//Collection Delete request. Remeber collection delete request can delete rows of data it can endanger the database. Not for user use.
//Use: Strictly for developers
//searchs for the matching entry in the database based on the year. It then deletes the corresponding rows.
app.delete('/api/database/movies/delete',(req, res) => {
    database = new Database (config);
    let params = [req.body.year , `${req.body.category}` , `${req.body.winner}` , `${req.body.entity}`]; //user can only provide the year,the category,the name of the entity, whether an award is won,
    let sql = `DELETE FROM oscar_winner_data_csv  WHERE year = ? AND category = ? AND winner = ? AND entity = ? `; 
    database.query(sql,params).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query
    });//end of app.delete 

//used to return all the elements in the csv table in the database (Its a collection endpoint)
app.get('/api/database/movies',(req, res) => {
    database = new Database (config);
    let sql = `SELECT * FROM oscar_winner_data_csv`;
    database.query(sql ).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query 
    });

//singleton endpoint for category
   //used to return 1 the row that has matching a category in the csv table in the database 
     app.get('/api/database/movie/category/:category',(req,res)=>{
            let param = [`${req.params.category}`];
            database = new Database (config);
            let sql = `SELECT * FROM oscar_winner_data_csv WHERE category =  ? LIMIT 1`; //Grabs 1 matching category
            database.query(sql,param ).then(result => {
                console.log(result);
                res.send(result);
                database.close();
                res.end();
            });//end of query 
            
        });//end of get request for categories

         //used to return all the elements that have matching a category in the csv table in the database (Its a collection endpoint)
app.get('/api/database/movies/categories/:category',(req,res)=>{
    let param = [`${req.params.entity}`];
     database = new Database (config);
  let sql = `SELECT * FROM oscar_winner_data_csv WHERE category = ?`; //Grabs all the matching categories 
       database.query(sql,param ).then(result => {
         console.log(result);
                res.send(result);
                database.close();
                res.end();
   });//end of query
});//end of get request for categories

//singleton endpoint for entity
    //used to return all the elements that have matching a entity in the csv table in the database    
    app.get('/api/database/movie/entity/:entity',(req,res)=>{
         let param = [`${req.params.entity}`];
             database = new Database (config);
            let sql = `SELECT * FROM oscar_winner_data_csv WHERE entity =  ? LIMIT 1`; //Grabs 1 matching entity
            database.query(sql,param ).then(result => {
                console.log(result);
                res.send(result);
                database.close();
                res.end();
             });
     });

 //used to return all the elements that have matching a entity in the csv table in the database (Its a collection endpoint)     
 app.get('/api/database/movies/entities/:entity',(req,res)=>{
     database = new Database (config);
    let params = [`${req.params.entity}`]; //user can only provide the year,the category,the name of the entity, whether an award is won,
    let sql = `SELECT * FROM oscar_winner_data_csv WHERE entity = ?`; //Grabs all the matching entities 
    database.query(sql,params).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query
});


 //used to return all the elements that have matching a winner in the csv table in the database (Its a collection endpoint)             
 app.get('/api/database/movies/winners/:winner',(req,res)=>{                 
     database = new Database (config);
    let params = [`${req.params.winner}`]; //user can only provide the year,the category,the name of the entity, whether an award is won,
  let sql = `SELECT * FROM oscar_winner_data_csv WHERE winner = ?`; //Grabs all the matching winner 
    database.query(sql,params).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query
 });       
 
 //singleton endpoint for winner
 //used to return all the elements that have matching a winner in the csv table in the database (Its a collection endpoint)             
 app.get('/api/database/movie/winner/:winner',(req,res)=>{       
    database = new Database (config);
    let params = [`${req.params.winner}`]; //user can only provide the year,the category,the name of the entity, whether an award is won,
 let sql = `SELECT * FROM oscar_winner_data_csv WHERE winner = ?  LIMIT 1`; //Grabs 1 matching winner
    database.query(sql,params).then(result => {
        console.log(result);
        res.send(result);
        database.close();
    });//end of query
 });        
