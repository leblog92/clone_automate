// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");
const dialog = require("dialog");
const modal = require("electron-modal");
const { spawn } = require("child_process");
const os = require("os");
const fs = require("fs");
var path = require("path");
const websocketRfid = require("./realtime-websocket-rfid/app");
var AdmZip = require("adm-zip");
var request = require("request");

let rcrPresent = false;
currentPath = process.cwd();
const computerName = os.hostname();
const ipc = require("electron").ipcMain;
const https = require("https");
let arrayJSON = [];
var moment = require("moment");
var md5 = require("md5");
var toto = "";

const gotTheLock = app.requestSingleInstanceLock()

const VirtualKeyboard = require("electron-virtual-keyboard");
let vkb; // keep virtual keyboard reference around to reuse.
const pathRCR = __dirname + "/resources/config/RCR.txt";

// console.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileExist(filePath) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.F_OK, (err) => {
      if (err) {
        console.log(err);
        return reject(err);
      }

      //file exists
      resolve();
    });
  });
}
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let win;
// dialog.info(msg, title, callback);

// example, setting title
function appendFont(data) {
  //loop list modele ["1.1","1.1","1.2","1.2.1"]
  data.MODELES.forEach(function (element) {
    let mypath = "";
    let accessPath = [];
    let myfontToAppend = "";
    //create access path list 1.2.1 => ["1_","1_2_","1_2_1_"]
    if (element && element.split(".").length > 0) {
      element.split(".").map((item, i) => {
        if (item != "") {
          mypath += item + "_";
          accessPath.push(mypath);
        }
      });
    }
    //concat for absolute path 1.2.1 =>["1_","1_2_","1_2_1_"] =>1_/1_2_/1_2_1_
    let floderPath = accessPath.join("/");
    //font path  somePath/resources/1_/1_2_/1_2_1_/font
    let mydirectoryPath = path.join(
      __dirname,
      "/resources/" + floderPath + "/font"
    );
    //read all files name
    fs.readdir(mydirectoryPath, (err, files) => {
      if (files) {
        files.forEach((file) => {
          if (
            path.parse(file).ext.toLowerCase() == ".otf" ||
            path.parse(file).ext.toLowerCase() == ".ttf" ||
            path.parse(file).ext.toLowerCase() == ".svg" ||
            path.parse(file).ext.toLowerCase() == ".eot" ||
            path.parse(file).ext.toLowerCase() == ".woff" ||
            path.parse(file).ext.toLowerCase() == ".woff2"
          )
            myfontToAppend =
              myfontToAppend +
              "\n @font-face {font-family: '" +
              path.parse(file).name +
              "';src: url('../../" +
              floderPath +
              "/font/" +
              file +
              "') ;}";
        });
        //append to css

        fs.appendFileSync(
          __dirname + "/resources/src/css/" + element + "_style.css",
          myfontToAppend
        );
      }
    });
  });
}

function createWindow() {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    show: false,
    alwaysOnTop: false,
  });

  // Remove FontToAppend -> at the end <-, we will prefer later to edit in CONFIG LIBNET directly, it have to be customisable for each customers. /!\ MANDATORY /!\ //

  // var fontToAppend = "";

  // const directoryPath = path.join(__dirname, "resources/font/");
  // fs.readdir(directoryPath, (err, files) => {
  //   files.forEach((file) => {
  //     if (
  //       path.parse(file).ext.toLowerCase() == ".otf" ||
  //       path.parse(file).ext.toLowerCase() == ".ttf" ||
  //       path.parse(file).ext.toLowerCase() == ".svg" ||
  //       path.parse(file).ext.toLowerCase() == ".eot" ||
  //       path.parse(file).ext.toLowerCase() == ".woff" ||
  //       path.parse(file).ext.toLowerCase() == ".woff2"
  //     )
  //       fontToAppend =
  //         fontToAppend +
  //         "\n @font-face {font-family: '" +
  //         path.parse(file).name +
  //         "';src: url('../../font/" +
  //         file +
  //         "') ;}";
  //   });
  // });
  // while (rcrPresent === false) {

  // }
  // dialog(__dirname)n
  win.loadFile(__dirname + "/resources/src/loding.html");
  win.show();
  let arrayCSS = [];
  let arrayJS = [];

  let promiseRCR = new Promise(function (resolve, reject) {
    fs.readFile(pathRCR, "utf8", (err, data) => {
      if (err) {
        console.log(err);
        reject("noRCR");
      } else {
        data = data.split("\n"); // split the document into lines
        data.length = 1; // set the total number of lines to 2
        // RCR = data[0];
        resolve(data[0]);
      }
    });
  });
  let promise = new Promise(function (resolve, reject) {
    promiseRCR.then(function (e) {
      console.log(e); //Array containing the 2 lines

      const options = {
        host: "api.libnet.online",
        path: "/config/autonome/" + e + "/" + computerName,
        headers: {
          "User-Agent": "request",
        },
      };
      https
        .get(options, function (res) {
          // console.log(options);
          let json = "";
          res.on("data", function (chunk) {
            json += chunk;
            // console.log(json)
          });
          res.on("end", function () {
            if (res.statusCode === 200) {
              try {
                let data = JSON.parse(json);
                // console.log(data['DEVICES'])
                //! Don't delete it. Temporally commented
                const devicesKeys = data["DEVICES"];

                for (const devices in devicesKeys) {
                  if (devicesKeys[devices]["PATH"] != "") {
                    toto = runScript(
                      devicesKeys[devices]["ENVPROG"],
                      devicesKeys[devices]["PATH"] +
                      devicesKeys[devices]["NAME"]
                    );
                    toto.stdout.on("data", (data) => {
                      console.log(`data:${data}`);
                    });
                    toto.stderr.on("data", (data) => {
                      console.log(`error:${data}`);
                    });
                    toto.stderr.on("close", () => {
                      console.log("Closed");
                    });
                  } else {
                    continue;
                  }
                }
                //!
                // console.log(json)
                // let keys = Object.keys(data.MODELES)
                data.MODELES.forEach(function (element) {
                  arrayCSS[element] = [];
                  arrayJSON[element] = [];
                  arrayJS[element] = [];
                });
                // console.log(keys)
                // console.log(arrayCSS)
                // console.log(arrayJSON)
                parseCSS(data.CONFIG.CSS, arrayCSS);
                // parseConfig(data.CONFIG.JSON,arrayJSON)
                parseCSS(data.CONFIG.JS, arrayJS);
                //console.log(arrayCSS);

                fs.writeFileSync(
                  __dirname + "/resources/config/config.json",
                  json
                );
                resolve(arrayCSS);
                appendFont(data);

                // const optionsFileSrc = {
                //   host: "api.libnet.online",
                //   path: "/config/autonome_modele/95611",
                //   headers: {
                //     //  "User-Agent": "request",
                //     //  key: "baacb658c5f2073ffe9a6a1aac9d3b0f",
                //   },
                // };

                var key = md5(
                  e + "MEDIA" + moment(Date.now()).format("YYYYMMDD")
                );
                request.get(
                  {
                    // url:
                    // "https://api.libnet.online/config/autonome_modele/95611?key="+key,
                    url:
                      "https://api.libnet.online/config/autonome_modele/" + e,
                    encoding: null,
                  },
                  (err, res, body) => {
                    var zip = new AdmZip(body);
                    zip.extractAllTo(__dirname + "/resources", true);
                    appendFont(data);
                  }
                );
              } catch (e) {
                console.log("Error getting media file!" + e);
              }
            } else {
              reject(res.statusCode);
            }
          });
        })
        .on("error", function (err) {
          reject(err);
        });
    });
  });
  promise
    .then(function (value) {
      Object.keys(arrayCSS).map(function (key) {
        strTest = "";
        testkey = "";
        Object.keys(arrayCSS[key]).map(function (key1) {
          if (testkey !== key1) {
            if (testkey !== "") {
              strTest = strTest + "\n\r";
            }
            strTest = strTest;
          }
          strTest = strTest + arrayCSS[key][key1];
          testkey = key1;
        });
        // strTest = strTest + fontToAppend;
        fs.writeFileSync(
          __dirname + "/resources/src/css/" + key + "_style.css",
          strTest
        );
      });

      Object.keys(arrayJS).map(function (key) {
        strTest = "";
        testkey = "";
        Object.keys(arrayJS[key]).map(function (key1) {
          if (testkey !== key1) {
            if (testkey !== "") {
              strTest = strTest + "\n\r";
            }
            strTest = strTest;
          }
          strTest = strTest + arrayJS[key][key1];
          testkey = key1;
        });

        // strTest = strTest + fontToAppend;
        fs.writeFileSync(
          __dirname + "/resources/src/js/" + key + "_js.js",
          strTest
        );
      });
      mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        frame: false,
        fullscreen: true,
        icon: __dirname + '/Pret.png',
        show: false,
        webPreferences: {
          nodeIntegration: true,
        },
      });
      mainWindow.loadFile("index.html");
      // mainWindow.webContents.setFrameRate(30);
      win.hide();
      win.close();
      // let contents = mainWindow.webContents
      mainWindow.on("ready-to-show", () => {
        // vkb = new VirtualKeyboard(mainWindow.webContents);
        // win.hide();
        // win.close();
        mainWindow.show();
        mainWindow.maximize();
      });

      // Open the DevTools.
      // mainWindow.webContents.openDevTools()

      // Emitted when the window is closed.
      mainWindow.on("closed", function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
      });

      vkb = new VirtualKeyboard(mainWindow.webContents);
    })
    .catch(
      // Promesse rejetée
      function () {
        mainWindow = new BrowserWindow({
          width: 1920,
          height: 1080,
          frame: false,
          fullscreen: true,
          show: false,
          webPreferences: {
            nodeIntegration: true,
          },
        });
        mainWindow.setMenu(null);
        console.log("ready-to-show avant 1");

        mainWindow.maximize();

        // and load the index.html of the app.
        mainWindow.loadFile("index.html");
        //added recently
        win.hide();
        win.close();
        mainWindow.on("ready-to-show", () => {
          // vkb = new VirtualKeyboard(mainWindow.webContents);
          console.log("ready-to-show 1");

          // win.hide();
          // win.close();
          mainWindow.show();
          mainWindow.maximize();
        });
        // Open the DevTools.
        // mainWindow.webContents.openDevTools();

        // Emitted when the window is closed.
        mainWindow.on("closed", function () {
          // Dereference the window object, usually you would store windows
          // in an array if your app supports multi windows, this is the time
          // when you should delete the corresponding element.
          mainWindow = null;
        });
      }
    );
}

if (!gotTheLock) {
  app.quit()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  removeFiles();
  let existFlag = fileExist(pathRCR);
  existFlag
    .then(() => {
      createWindow();
      modal.setup();
    })
    .catch((e) => {
      let rcrScreen = new BrowserWindow({
        width: 600,
        height: 200,
        frame: false,
        webPreferences: {
          nodeIntegration: true,
        },
      });
      rcrScreen.loadFile(__dirname + "/resources/src/askRCR.html");
      rcrScreen.show();
      console.log(e);
      // app.quit(0)
      // app.relaunch({
      // 	args: process.argv.slice(1).concat(['--relaunch'])
      // })
      // sleep(1000)
    });
});

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (toto != "") {
    toto.kill("SIGTERM");
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipc.on("synchronous-message", (event, arg) => {
  fs.writeFileSync(__dirname + "/resources/config/RCR.txt", arg);
  console.log(arg);
  if (toto != "") {
    toto.kill("SIGTERM");
  }
  app.quit(0);
  app.relaunch({
    args: process.argv.slice(1).concat(["--relaunch"]),
  });
});

ipc.on("relaunch-app", (event, arg) => {
  if (toto != "") {
    toto.kill("SIGTERM");
  }
  app.quit(0);
  app.relaunch({
    args: process.argv.slice(1).concat(["--relaunch"]),
  });
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function runScript(envprog, prog) {
  console.log("Executing of the cmd => " + envprog + " " + prog);
  return spawn(envprog, [path.join(__dirname, prog)]);
}

function parseCSS(obj, array, level = 0) {
  Object.keys(obj).map(function (key) {
    // console.log(level)
    // console.log(key)
    // console.log(obj[key])
    Object.keys(obj[key]).map(function (key2) {
      //  console.log(key2);
      if (key2 !== "CHILDREN") {
        array[key][key2] = obj[key][key2]["VALUE"];
      }
      if (key2 === "CHILDREN") {
        Object.keys(obj[key][key2]).map(function (key3) {
          // console.log(key3)

          Object.keys(obj[key]).map(function (keyChild) {
            if (keyChild !== "CHILDREN") {
              if (key3 === "1.1.1.") {
                console.log(
                  "KEY >>>> " +
                  key +
                  "<<<<< " +
                  keyChild +
                  " >>>>> " +
                  key3 +
                  " :::::: " +
                  array[key][keyChild]
                );
              }
              array[key3][keyChild] = array[key][keyChild];
              // conole.log("KEY >>>> "+key+"<<<<< "+keyChild+" >>>>> "+key3+" :::::: "+obj[key][keyChild]["VALUE"])
            }
          });
          // console.log("Relance l'appel")
          // console.log(obj[key][key2])
          // parseCSS(obj[key][key2],array)
        });
        // console.log(obj[key][key2])
        parseCSS(obj[key][key2], array);
      }
    });
  });
}

// function parseConfig(obj,array,level=0){
// 	Object.keys(obj).map(function (key) {

// 		// console.log(level)
// 		// console.log(key)
// 		// console.log(obj[key])
// 		Object.keys(obj[key]).map(function (key2) {

// 			// console.log(key2)
// 			if(key2 === "CHILDREN"){
// 				level += 1
// 				// console.log("Relance l'appel")
// 				// console.log(obj[key][key2])
// 				parseConfig(obj[key][key2],array,level)
// 			}else{
// 					// console.log(obj[key][key2])
// 					Object.keys(array).map(function (element) {
// 						Object.keys(obj[key][key2]).map(function(element2){
// 							console.log("MODELE : "+element+" >>>>>> "+element2+" = "+obj[key][key2][element2]["VALUE"])
// 							array[element][element2] = obj[key][key2][element2]["VALUE"]

// 						});

// 				}
// 			}
// 		});
// 	});
// }
function removeFiles() {
  let myCSSdirectoryPath = path.join(__dirname, "/resources/src/css");
  fs.readdir(myCSSdirectoryPath, (err, files) => {
    if (files) {
      files.forEach((file) => {
        if (file.includes("_style.css"))
          fs.unlinkSync(path.join(myCSSdirectoryPath, file));
      });
    }
  });
  let myJSdirectoryPath = path.join(__dirname, "/resources/src/js");
  fs.readdir(myJSdirectoryPath, (err, files) => {
    if (files) {
      files.forEach((file) => {
        if (file.includes("_js.js"))
          fs.unlinkSync(path.join(myJSdirectoryPath, file));
      });
    }
  });
}