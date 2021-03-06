var debug = require('debug')('TestMngr');
var Q = require("q");

var SnowBot = require('./snow-bot');
var SnowChef = require('./snow-chef');
var SnowClient = require('../../client/index');
var App = require('../../api/ExpressApp');
var app = new App();


console.log("TestMngr mod");


var TestMngr = function(config){
    console.log("TestMngr ctr");
    
    var clientsMap = {};
    var clients = [];
    var clientsConfig = {};
    
    var snowBot = new SnowBot(config);
    var snowChef = new SnowChef(snowBot, config);
    
    config.users.forEach(function(userConfig){
        userConfig.url = config.url; 
        var client = new SnowClient(userConfig);
        clientsMap[userConfig.name] = client;
        clientsConfig[userConfig.name] = userConfig;
        clients.push(client);
    })
    
    this.start = function(){
        //console.log("TestMngr start");
        return Q.all([this.dbConnect(), app.start()])
        .then(function(){
            console.log('started')
        })
    }
    
    this.stop = function(){
        return app.stop();
    }
    this.bot = function(){
        return snowBot;
    }
    
    this.chef = function(){
        return snowChef;
    }
    
    this.client = function(name){
        return clientsMap[name];
    }
    
    this.clients = function(){
        return clients;
    }
    
    this.clientConfig = function(name){
        return clientsConfig[name];
    }
    
    this.dbConnect = function(){
        var deferred = Q.defer();
        snowBot.db.pgClient.connect(function(err) {
            if (err) {
                debug("db connect error: %s, connection: %s", err, config.pg_write_url);
                deferred.reject(err)
                
            } else {
                debug("db connected");
                deferred.resolve();
            }
        });
        return deferred.promise;
    }
    
    this.login = function(){
        debug("login");
        var deferred = Q.defer();
        snowChef.securitySession(clients, function(err){
            if(err) return deferred.reject(err)
            debug("logged in");
            deferred.resolve()
            
        })
        return deferred.promise;
    }
};

module.exports = TestMngr;