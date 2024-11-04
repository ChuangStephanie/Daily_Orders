const { contextBridge } = require("electron");
const { exec } = require("child_process");

contextBridge.exposeInMainWorld('api', {
    startServers: () => {
      // Start Node.js server
      exec('node server/main.js', (error) => {
        if (error) {
          console.error(`Error starting Node.js server: ${error.message}`);
          return;
        }
        console.log('Node.js server started successfully');
      });
  
      // Start Flask server
      exec('python server/app.py', (error) => {
        if (error) {
          console.error(`Error starting Flask server: ${error.message}`);
          return;
        }
        console.log('Flask server started successfully');
      });
    }
  });