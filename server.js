var http = require('http');
var fs = require('fs');
var amqp = require('amqp');

var connection = amqp.createConnection(
  {url: "amqp://a556ed26-bd69-48f7-b97e-2744796b258a_apphb.com:IRebEvT0LoS4KAVwLq9iny7nJ-AltUDl@bunny.cloudamqp.com/a556ed26-bd69-48f7-b97e-2744796b258a_apphb.com"});

var clients = [];
  
http.createServer(function (request, response) {
  if(request.headers.accept && request.headers.accept == 'text/event-stream') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Accept' : '*/*',
      'Access-Control-Allow-Origin' : '*'
    });  
  
  clients.push(response);
  console.log('new connection');
  }
  else {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(fs.readFileSync(__dirname + '/index.html'));
    response.end();
  }
  
  request.on('close', function(){
		console.log('connection closing');
    if(clients.indexOf(response) >= 0) {
      clients.pop(response);
    }
	});  
}).listen(1337);

console.log('Server running on port 1337');

connection.on('ready', function () {
  connection.exchange("Visits Exchange", options={passive: 'true'}, function(exchange) {

    console.log('connected to exchange: ' + exchange.name);

    // Recieve messages
    connection.queue("Node Visits Queue", function(queue){
      console.log('Created queue: ' + queue.name);
      queue.bind(exchange, '#'); 
      queue.subscribe(function (message, headers, deliveryInfo) {
        
        var encoded_payload = unescape(message.data);
        var payload = JSON.parse(encoded_payload);
        console.log('Recieved a message:');
        
        for(var i=0; i<clients.length; i++){
          clients[i].write('data: ' + JSON.stringify(payload) + '\n\n');
          
          console.log('pushed notification');
        }

        Statistics(payload);
      })
    });
  });
});

function Statistics(payload){
  
  var rawUrl = payload.QUERY_STRING;
  var parsedUrl = rawUrl.split('&')[1];
  var page = parsedUrl.substr(4, parsedUrl.length);

  console.log(page);
}