var express = require('express'),
	app = express(),
	fs = require('graceful-fs')
	//fs = require('fs'),
	server  = app.listen("8080",function(){console.log("Listening to post 8080...");});
	io = require('socket.io')(server),
	parseString = require('xml2js').parseString;

app.get("/",function(req,res){
	res.sendFile(__dirname+'/index.html');
});

// app.post("/search",function(req,res){
// 	(function search(currentDirectory){
// 		fs.readdir(currentDirectory,function(err,files){
// 			if(files){
// 				files.forEach(function(fileName){					
// 					var filePath = currentDirectory+'/'+fileName;
// 					fileName=fileName.toLowerCase();

// 					if(fileName === "task.xml"){
// 						ReadXML(filePath,res);
// 					}
// 					else if(fileName!="assets" && fileName!="audio" && fileName!="practice.json")
// 						search(filePath);
// 				});
// 			}
// 		});
// 	})("E:/sim5service/XMLs/TaskXmls2016/go/wd/06");
// });



function ReadXML(filePath,client,taskID,appID){
	//In task Repo spaces are present in some tasks
	filePath = filePath.replace(" ","");

	var rs = fs.createReadStream(filePath),
		xmlContent = '';
	
	rs.on("readable",function(){
		var chunk = rs.read();
		if(chunk)
		xmlContent += chunk; 
	});
	
	rs.on("end",function(){
		client.emit('XMLContent',{xmlContent,taskID,appID});
	});
}

io.on('connection',function(client){
	console.log('Client connected.....');

	// client.on('search',function(InputDirectory){
	// 	var XMLFound=0,totalScannedFiles=0,remainingCalls=0;
	// 	(function search(currentDirectory){
	// 		remainingCalls++;
	// 		fs.readdir(currentDirectory,function(err,files){
	// 			remainingCalls--;
	// 			if(files){
	// 				console.log(++totalScannedFiles);
	// 				files.forEach(function(fileName){					
	// 					var filePath = currentDirectory+'/'+fileName;
	// 					fileName=fileName.toLowerCase();

	// 					if(fileName === "task.xml"){
	// 						XMLFound++;
	// 						ReadXML(filePath,client);
	// 					}
	// 					else if(fileName!="assets" && fileName!="audio" && fileName!="practice.json" && fileName!=".svn")
	// 						search(filePath);
	// 				});
	// 			}

	// 			if(remainingCalls==0){
	// 				client.emit("Finished",XMLFound);
	// 			console.log("\nFinished Searching. Total files scanned = "+totalScannedFiles+"\nTotal XMLs found : "+XMLFound);
	// 			}
	// 		});
	// 	})(InputDirectory);
	// });

	//Via Task XML
	client.on('search',function(InputDirectory){
		var XMLFound=0,taskRepo="",
			rs = fs.createReadStream(InputDirectory),
			absPath = InputDirectory.replace("TaskRepository.xml","");

		rs.on("readable",function(){
			var chunk = rs.read();
			if(chunk)
				taskRepo +=chunk;
		});

		rs.on("end",function(){
			parseString(taskRepo, function (err, result) {
				result.tasks.task.forEach(function(obj){
					if((obj.$.appID=="28" || obj.$.appID=="29" || obj.$.appID=="26" || obj.$.appID=="27") && obj.$.id.substr(0,3)!="AIO" && obj.$.id.substr(0,4)!="PH16"){
						XMLFound++;
						ReadXML(absPath+obj.$.xmlPath,client,obj.$.id,obj.$.appID);
					}
				});

				client.emit("Finished",XMLFound);
	 			console.log("\nFinished Searching.\nTotal XMLs found : "+XMLFound);
	 			
			});
		});

	});
});