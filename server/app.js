
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

var sockjs = require('sockjs');

var matches = [
    {
        match: 'EnglandFrance',
        votesLeft: 10,
        votesRight: 11
    },
    {
        match: 'WalesIreland',
        votesLeft: 23,
        votesRight: 1
    },
];

function matchSearch(match) {
    for (var i = 0; i < matches.length; i++) {
        if (matches[i].match === match) {
            return matches[i]
        }
    }
    matches[] = 
    {
        match: match,
        votesLeft: 0,
        votesRight: 0
    }
    return matchSerach(match);
}

var clients = [];

var echo = sockjs.createServer();

echo.on('connection', function(conn) {
    clients.push(conn);

    console.log(conn, 'connected');

    conn.on('data', function(message) {
        console.log('got data', message);
        message = JSON.parse(message);

        if (message.type === 'start') {
            var match = matchSearch(message.match);

            if (message.side === 'left') {
                retvotes = match.votesLeft;
            }

            if (message.side === 'right') {
                retvotes = match.votesRight;
            }

            conn.write(JSON.stringify({
                votes: retvotes,
                type: 'vote',
                side: message.side,
                match: message.match,
            }));
        }

        if (message.type === 'vote') {
            var match = matchSearch(message.match);
            var retvotes = 0;
            if (message.side === 'left') {
                match.votesLeft = match.votesLeft + 1;
                retvotes = match.votesLeft;
            }

            if (message.side === 'right') {
                match.votesRight = match.votesRight + 1;
                retvotes = match.votesRight;
            }

            clients.forEach(function(client) {
                client.write(JSON.stringify({
                    test: 'what',
                    votes: retvotes,
                    type: 'vote',
                    side: message.side,
                    match: message.match,
                }));
            });
        }
    });
    conn.on('close', function() {
        console.log(conn, 'disconnected');
        clients.splice(clients.indexOf(conn), 1);
    });
});

echo.installHandlers(app, {prefix:'/votes'});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
