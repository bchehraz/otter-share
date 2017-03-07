var express = require('express');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

//---> Credentials for connecting to GRAPHENEDB with Heroku!
  var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL;
  var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER;
  var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD;
//
  var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

  const port = process.env.PORT || 3000;
  //----> Local credentials
  //var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "root"));
  var session = driver.session();
  var app = express();
  app.use(bodyParser.json()); //uses bodyParser middleware

  // Tests a fake email hard-coded in source. Can delete this block now
  app.get('/', (req,res) => {
    res.status(200).send("Welcome to OtterShare, nothing to GET, though");
  });
  app.get('/getTest', (req,res,next) => {
    session
      .run("MATCH (a:Person) WHERE a.email <> {email} RETURN a.name AS name, a.email AS email, a.location AS location",
          {email: "Test e-mail90"})
      .then( function( result ) {
        //let jsonMsg = result.records[0].get("title") + " " + result.records[0].get("name");
        //var obj = JSON.parse('{ "name":"' + jsonMsg + '"}');
        if(!result){
          return res.send("No match!");
        }
        let store = '';
        for( x in result.records ){
          store += JSON.stringify(result.records[x]);
        }
        res.send(store);
        console.log(result.records);
      })
      .catch( (e) => {
        console.log('--- error below ---' + (JSON.stringify(e)));
      });
});

// Essentially DROPS database !
app.get('/reset',(req,res,next) => {
  session
  .run("MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r")
  .then(res.send('Succceeeessss!'))
  .catch((e) => {
    res.send('fail: ' + JSON.stringify(e));
  });
});

// adds certain strings POSTING to db.
app.post('/postTest',(req,res,next) => {
  // manipulate body fields, if not null we insert data!
  var name = null;
  var email = null;
  var location = null;

  name = req.body.name;
  email = req.body.email;
  location = req.body.location;
  // console.log(req.body.name);
  if(!!name && !!email && !!location){
    session
      .run("CREATE (a:Person {name: {name}, email: {email}, location: {location} })", {name: name, email: email, location: location})
      .then(() => {
        res.send("Success! ---> " + name + ' ' + email + ' ' + location);
      })
      .catch((e) => {
        console.log(JSON.stringify(e));
      });
  }
  else {
    res.send('Fail, yo!');
  }
});
//searches for user by email, returns email.
app.post('/findByEmail', (req,res,next) => {
  var email = null;
  email = req.body.email;

  if(!!email){
    session
      .run("MATCH (a:Person) WHERE a.email = {email} RETURN a.email AS Email",
               {email: email})
      .then(() =>{
        //console.log(result);
        for(x in result.records){
          console.log(result.records[x]);
        }
        res.send(email);
      })
      .catch((e) => {
        console.log(JSON.stringify(e));
      })
  }
  else {
    res.status(400).send("email must be in correct format!!!");
  }
});
 app.listen(port, () => {
   console.log("Started on port " + port);
 });
