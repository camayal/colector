//Main
//API keys removed

(function () {
    "use strict";


    document.addEventListener('deviceready', onDeviceReady.bind(this), false);


    //DECLARATION IMPORTANT GLOBAL VARIABLES
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    var dataBase = null;
    var dataBaseVersion = 1;
    var GPSon = false;
    var watchID = null;
    var DateEachEntry = null;

    var R_routeL, R_routeS, R_routeN, R_lvl2, R_lvl1, R_countryL, R_countryS, R_locality, toLocalityRoute, toLocalityLvl2, toLocalityLocality, distanceBycar, selectedname, cardinal;

    var inMain, inRegistration, inReview, inConfig, inExport, inEdit, inTowns, inPhotos;

    var idToUpdate = null;
    var lockStatus = null;
    var startDelete = false;
    var startPhotoDelete = false;
    var autoBackupFile = null;
    var backupFilename = null;
    var folderNamePhoto = null;
    var previousColnNum = null;
    var inEdition = null;
    var table = document.getElementById('photos_pseudoscreen_table');


    var autoGPS, autoLocation, timeoutGPS, experimentalGallery;


    var R_acceptedName, R_acceptedAuthor, R_family;

    var titles = '"Collector",' +
                    '"Additional collectors",' +
                    '"Number",' +
                    '"Day",' +
                    '"Month",' +
                    '"Year",' +
                    '"Family",' +
                    '"Genus",' +
                    '"Species",' +
                    '"Infracategory",' +
                    '"InfraTaxa",' +
                    '"Author",' +
                    '"Description",' +
                    '"Country",' +
                    '"State",' +
                    '"Locality",' +
                    '"Altitude",' +
                    '"Latitude",' +
                    '"Longitude",' +
                    '"Notes",' +
                    '"ID",' +
                    '"PhotoDB",' +
                    '"Herbarium Acronym",' +
                    '"Complete Herb. Name 1",' +
                    '"Complete Herb. Name 2",' +
                    '"Project",' +
                    '"Additional_notes",' +
                    '"GPS Accuracy",' +
                    '"Altitude accuracy"';



    function onDeviceReady() {
        // Controlar la pausa de Cordova y reanudar eventos
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);

        // Control backbutton on Android
        document.addEventListener("backbutton", onBackKeyDown, false);

        // TODO: Cordova se ha cargado. Haga aquí las inicializaciones que necesiten Cordova.
        var parentElement = document.getElementById('deviceready');
        //var listeningElement = parentElement.querySelector('.listening');
        //var receivedElement = parentElement.querySelector('.received');
        //listeningElement.setAttribute('style', 'display:none;');
        //receivedElement.setAttribute('style', 'display:block;');

        //LAYOUT STARTUP
        setScreen('inMain');

        //START DB FROM DEVICEREADY
        CreateOpenDatabase();

        //CREATE FILE TO BACKUP
        CreateOpenBackupFile();


        //HIDE SPEECHRECOGNITION BUTTONS IF THE SYSTEM DOES NOT DETECT IT
        window.plugins.speechrecognizer.checkSpeechRecognition(function () {
            //nothing
        }, function () {
            var x = document.querySelectorAll(".speechRecBtn");
            var i;
            for (i = 0; i < x.length; i++) {
                x[i].classList.add("hidden");
            }
        });

        //LOOK FOR THE FIRST EXECUTION
        firstExe();

        //LOOK FOR NOTIFICATION MESSAGE
        webnotification();


    };



    function onPause() {
        // TODO: esta aplicación se ha suspendido. Guarde el estado de la aplicación aquí.
    };

    function onResume() {
        // TODO: esta aplicación se ha reactivado. Restaure el estado de la aplicación aquí.
    };

    function onBackKeyDown() {
        if (inRegistration) {
            backFromRegistrationScreen();

        } else if (inEdition && !inPhotos && !inTowns) {

            if (lockStatus) {
                backWithoutSaveFromEdit();
            } else {
                navigator.notification.confirm('Do you want to discard any modification and return to Review Screen?', onConfirm_backFromRegistrationScreen, 'Information');

            }

        }
        else if (inMain) {

        } else if (inReview || inConfig || inExport) {
            setScreen('inMain');
        } else if (inTowns) {
            setScreen('inRegistration');
        } else if (inPhotos) {
            cleanPhotosTable();
            setScreen('inRegistration');
        }

    }

    function onConfirm_backFromEditScreen(buttonIndex) {


        if (buttonIndex == 1) {
            backWithoutSaveFromEdit();
        }
    }


    function backWithoutSaveFromEdit() {
        setScreen('inReview');
        idToUpdate = null;
        //Unlock();
        inEdition = false;
    }



    //GO BACK FROM REGISTRATION SCREEN USING THE BUTTON
    function backFromRegistrationScreen() {

        if (inEdition && !inPhotos && !inTowns) {
            if (lockStatus) {
                backWithoutSaveFromEdit();
            } else {
                navigator.notification.confirm('Do you want to discard any modification and return to Review Screen?', onConfirm_backFromRegistrationScreen, 'Information');

            }
        } else {

            navigator.notification.confirm('Do you want to discard this information (including all photos for this registry) and return to Main Screen?', onConfirm_backFromRegistrationScreen, 'Information');
        }
    }

    function onConfirm_backFromRegistrationScreen(buttonIndex) {
        if (buttonIndex == 1) {

            if (inEdition && !inPhotos && !inTowns) {
                backWithoutSaveFromEdit();
            } else {

                setScreen('inMain');
                cleanRegistrationScreen();
                deleteTemporalPhotoFolder();
                previousColnNum = null;
            }

        }

    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////
    //GENERAL DECLARATION AND LISTENERS
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    //LISTENERS
    document.getElementById("LockUnlock").addEventListener("click", LockUnlock);
    document.getElementById("getPosition").addEventListener("click", getPosition);
    document.getElementById("cameraTakePicture").addEventListener("click", pre_cameraTakePicture);
    document.getElementById("saveEntry").addEventListener("click", saveEntry);
    document.getElementById("newEntry").addEventListener("click", newEntry);
    document.getElementById("toReviewScreen").addEventListener("click", toReviewScreen);
    document.getElementById("toMainScreen").addEventListener("click", function () { setScreen('inMain') });
    document.getElementById("toConfigScreen").addEventListener("click", toConfigScreen);
    document.getElementById("SearchInPreviewScreen").addEventListener("keyup", searchInPreviewScreen);
    document.getElementById("backInRegisgrationScreen").addEventListener("click", backFromRegistrationScreen);
    document.getElementById("deleteDatabase").addEventListener("click", deleteDatabase);
    document.getElementById("deletePhotoFolder").addEventListener("click", deletePhotoFolder);
    document.getElementById("backinConfig_Button").addEventListener("click", function () { setScreen('inMain') });
    document.getElementById("exportSecurityBackup").addEventListener("click", shareSecurityBackup);
    document.getElementById("backinExport_Container").addEventListener("click", function () { setScreen('inMain') });
    document.getElementById("toExportScreen").addEventListener("click", function () { setScreen('inExport') });
    document.getElementById("exportButton").addEventListener("click", exportDB);
    document.getElementById("exportPhotoButton").addEventListener("click", exportPhotos);
    document.getElementById("Species").addEventListener("blur", suggestFamilyOffline);
    document.getElementById("searchSpecies").addEventListener("click", searchSpecies);
    document.getElementById("searchLocation").addEventListener("click", searchLocation);
    document.getElementById("toRegistrationScreen_from_towns_pseudoscreen").addEventListener("click", function () { setScreen('inRegistration') });
    document.getElementById("toRegistrationScreen_from_photos_pseudoscreen").addEventListener("click", function () { cleanPhotosTable(); setScreen('inRegistration'); });
    document.getElementById("toPhotos").addEventListener("click", function () { setScreen('inPhotos') });
    document.getElementById("speechDescription").addEventListener("click", function () { recognizeSpeech('Description') });
    document.getElementById("speechNotes").addEventListener("click", function () { recognizeSpeech('Notes') });
    document.getElementById("speechAdditional_notes").addEventListener("click", function () { recognizeSpeech('Additional_notes') });
    document.getElementById("experimentalGallery").addEventListener("click", function () {
        if (experimentalGallery == 0) {
            navigator.notification.alert('This is an experimental feature, and app fails and crashes may be expected. If your phone have less than 1GB of RAM please disable this feature. \n\nIf you want to review your images you can use a file explorer for Android or export the Photos and review them in your PC.', function () { }, 'Warning!');
        }
        saveCurrentSetting();
    });








    ////////////////////////////////////////////////////////////////////////////////////////////////////
    //SUBROUTINES
    ///////////////////////////////////////////////////////////////////////////////////////////////////



      
    //START DATABASE OR OPEN IT
    function CreateOpenDatabase() {
        dataBase = indexedDB.open("colectorDB", dataBaseVersion);

        dataBase.onsuccess = function (e) {
            //console.log('DB loaded correctly');
        };

        dataBase.onerror = function (e) {
            //console.log("Database error: " + event.target.errorCode);
            //alert("Database error: " + event.target.errorCode);
            navigator.notification.alert('Database error: ' + event.target.errorCode, function () { }, 'Error');

        };

        dataBase.onupgradeneeded = function (e) {
            var active = dataBase.result;
            var object = active.createObjectStore("main", { keyPath: 'id', autoIncrement: true });

            object.createIndex('by_collector_number', 'collector_number', { unique: true });
            object.createIndex('by_collector', 'collector', { unique: false });
            object.createIndex('by_collectorMinuscula', 'collectorMinuscula', { unique: false });
            object.createIndex('by_species', 'species', { unique: false });
            object.createIndex('by_family', 'family', { unique: false });
            object.createIndex('by_country', 'country', { unique: false });
            object.createIndex('by_state', 'state', { unique: false });
            object.createIndex('by_id', 'id', { unique: false });
            object.createIndex('by_speciesGenus', 'speciesGenus', { unique: false })

        };

        dataBase.onblocked = function (e) {
            //database blocked
        }

    }


    //NEW ENTRY
    function newEntry() {
        //clean registration screen
        cleanRegistrationScreen();
        //flag only to indicate that is in an edition and not in an new entry
        Unlock();
        inEdition = false;
        //clean previousColnNum var (used to inspect if is a edit or not for move photos folder
        previousColnNum = null;



        //show registration screen
        setScreen('inRegistration');

        //delet temporary photos folder to avoid problems of unexpected close windows
        deleteTemporalPhotoFolder();


        //if autoGPS is true check position when enter to registration screen
        if (autoGPS == 1) { getPosition() };

        //put date
        var DateEachEntry = new Date();
        //var DateEachEntryFormated = DateEachEntry.toISOString().slice(0, 10);
        //var DateEachEntryFormated = DateEachEntry.toLocaleDateString();
        var correctedMonth = DateEachEntry.getMonth() + 1;
        //revisar lo de correctedmonth***
        if (correctedMonth < 10) {
            correctedMonth = '0' + correctedMonth;
        } else {
            correctedMonth = correctedMonth;
        }


        var correctedDay = null;
        if (DateEachEntry.getDate() < 10) {
            correctedDay = '0' + DateEachEntry.getDate();
        } else {
            correctedDay = DateEachEntry.getDate();
        }
        document.querySelector('#Date').value = DateEachEntry.getFullYear() + '-' + correctedMonth + '-' + correctedDay;

        //load database for the next infraroutines
        var openReq = indexedDB.open('colectorDB', dataBaseVersion);
        openReq.onsuccess = function () {
            var db = openReq.result;
            var transaction = db.transaction(['main'], 'readonly');
            var objectStore = transaction.objectStore('main');

            //create datalist for each input
            createDatalist('collector', objectStore);
            createDatalist('species', objectStore);
            createDatalist('family', objectStore);
            createDatalist('country', objectStore);
            createDatalist('state', objectStore);


            //load previous collector and plus one to previous number if is a int
            var index = objectStore.index('by_id');
            index.openCursor(null, 'prev').onsuccess = function (event) {
                if (event.target.result) {
                    var result = event.target.result.value;

                    //from id object get collector value, number and et_al to suggest them
                    var lastCollector = result.collector;
                    if (lastCollector != '') {
                        document.querySelector('#Collector').value = lastCollector;
                        document.querySelector('#Collector').className += " suggested";
                    }

                    if (isNaN(Number(result.number))) {
                        document.querySelector('#Number').value = '';
                    } else {
                        var lastNumberPlusOne = Number(result.number) + 1;
                        document.querySelector('#Number').value = lastNumberPlusOne;
                        document.querySelector('#Number').className += " suggested";
                    }

                    var lastEt_al = result.et_al;
                    if (lastEt_al != '') {
                        document.querySelector('#Et_al').value = lastEt_al;
                        document.querySelector('#Et_al').className += " suggested";
                    }

                    var lastcountry = result.country;
                    if (lastcountry != '') {
                        document.querySelector('#Country').value = lastcountry;
                        document.querySelector('#Country').className += " suggested";
                    }
                }
            };


            transaction.oncomplete = function (event) {
                //db.close();

            };
        }


    };


    //SAVE ENTRY
    function saveEntry() {
        if (document.querySelector('#saveImgButton').style.display == 'none') {
            //perform back function when it is back button and return to review screen
            setScreen('inReview');
            idToUpdate = null;
            //Unlock();
            inEdition = false;


        } else {

            if (document.querySelector('#Collector').value != '' && document.querySelector('#Number').value != '') {

                var active = dataBase.result;
                var data = active.transaction(['main'], 'readwrite');
                var object = data.objectStore('main');



                if (idToUpdate !== null) {
                    var contenttoDBfromInput = {
                        id: parseInt(idToUpdate), collector_number: document.querySelector('#Collector').value.toLowerCase() + '_' + document.querySelector('#Number').value,
                        collector: document.querySelector('#Collector').value,
                        collectorMinuscula: document.querySelector('#Collector').value.toLowerCase(),
                        number: document.querySelector('#Number').value,
                        et_al: document.querySelector('#Et_al').value,
                        species: document.querySelector('#Species').value,
                        speciesGenus: document.querySelector('#Species').value.split(' ')[0],
                        speciesSpecies: document.querySelector('#Species').value.split(' ')[1],
                        speciesInfraCategory: document.querySelector('#Species').value.split(' ')[2],
                        speciesInfraTaxa: document.querySelector('#Species').value.split(' ')[3],
                        author: document.querySelector('#Author').value,
                        family: document.querySelector('#Family').value,
                        description: document.querySelector('#Description').value,
                        latitude: document.querySelector('#Latitude').value,
                        longitude: document.querySelector('#Longitude').value,
                        altitude: document.querySelector('#Altitude').value,
                        accuracy: document.querySelector('#Accuracy').textContent,
                        altitudeaccuracy: document.querySelector('#AltitudeAccuracy').textContent,
                        country: document.querySelector('#Country').value,
                        state: document.querySelector('#State').value,
                        locality: document.querySelector('#Locality').value,
                        notes: document.querySelector('#Notes').value,
                        additional_notes: document.querySelector('#Additional_notes').value,
                        year: document.querySelector('#Date').value.split('-')[0],
                        month: document.querySelector('#Date').value.split('-')[1],
                        day: document.querySelector('#Date').value.split('-')[2],
                    };
                } else {
                    var contenttoDBfromInput = {
                        collector_number: document.querySelector('#Collector').value.toLowerCase() + '_' + document.querySelector('#Number').value,
                        collector: document.querySelector('#Collector').value,
                        collectorMinuscula: document.querySelector('#Collector').value.toLowerCase(),
                        number: document.querySelector('#Number').value,
                        et_al: document.querySelector('#Et_al').value,
                        species: document.querySelector('#Species').value,
                        speciesGenus: document.querySelector('#Species').value.split(' ')[0],
                        speciesSpecies: document.querySelector('#Species').value.split(' ')[1],
                        speciesInfraCategory: document.querySelector('#Species').value.split(' ')[2],
                        speciesInfraTaxa: document.querySelector('#Species').value.split(' ')[3],
                        author: document.querySelector('#Author').value,
                        family: document.querySelector('#Family').value,
                        description: document.querySelector('#Description').value,
                        latitude: document.querySelector('#Latitude').value,
                        longitude: document.querySelector('#Longitude').value,
                        altitude: document.querySelector('#Altitude').value,
                        accuracy: document.querySelector('#Accuracy').textContent,
                        altitudeaccuracy: document.querySelector('#AltitudeAccuracy').textContent,
                        country: document.querySelector('#Country').value,
                        state: document.querySelector('#State').value,
                        locality: document.querySelector('#Locality').value,
                        notes: document.querySelector('#Notes').value,
                        additional_notes: document.querySelector('#Additional_notes').value,
                        year: document.querySelector('#Date').value.split('-')[0],
                        month: document.querySelector('#Date').value.split('-')[1],
                        day: document.querySelector('#Date').value.split('-')[2],
                    };
                }

                var request = object.put(contenttoDBfromInput);


                request.onerror = function (e) {

                    switch (e.code) {
                        case e.CONSTRAINT_ERR:
                            navigator.notification.alert('The collector and number of collector already exist in the database. These need to be unique', function () { }, 'Error');
                            break;
                        default:
                            navigator.notification.alert('Database error \n' + request.error.name + '\n' + request.error.message, function () { }, 'Error');
                            break;

                    }


                }

                data.oncomplete = function (e) {


                    //Rename folder of photos to the current one based on collector and number
                    movePhotostoRealName();


                    //stop gps just in case
                    if (GPSon) { stopGPS(); };
                    //acá se limpian los inputs o sea se reinicia luego del save
                    cleanRegistrationScreen();
                    //close registration screen
                    setScreen('inMain');

                    var updatedText = null;
                    if (idToUpdate !== null) {
                        navigator.notification.alert('Record updated sucessfully', function () { }, 'Information');
                        updatedText = "Updated"
                        //clean idToUpdate
                        idToUpdate = null;
                    } else {
                        navigator.notification.alert('Record saved sucessfully', function () { }, 'Information');
                        updatedText = "New"

                    }

                    //Add new record or update to Security_backup
                    var DBtoString = dbToString(contenttoDBfromInput);


                    writeFile(backupFilename, '"' + new Date().toDateString() + '","' + updatedText + '",' + DBtoString + '\n', true);
                    var updatedText = null;





                }
            } else {
                //alert('Collector and number are mandatory to save a record');
                navigator.notification.alert('Collector and number are mandatory to save a record', function () { }, 'Information');
            }

        }
    };



    //DEFINE ITEMS FOR EXPORTATION DB TO STRING
    function dbToString(dbIndicator) {
        var DBtoString = '"' + dbIndicator.collector + '",' +
                    '"' + dbIndicator.et_al + '",' +
                    '"' + dbIndicator.number + '",' +
                    '"' + dbIndicator.day + '",' +
                    '"' + dbIndicator.month + '",' +
                    '"' + dbIndicator.year + '",' +
                    '"' + dbIndicator.family + '",' +
                    '"' + (dbIndicator.speciesGenus != null && dbIndicator.speciesGenus || '') + '",' +
                    '"' + (dbIndicator.speciesSpecies != null && dbIndicator.speciesSpecies || '') + '",' +
                    '"' + (dbIndicator.speciesInfraCategory != null && dbIndicator.speciesInfraCategory || '') + '",' +
                    '"' + (dbIndicator.speciesInfraTaxa != null && dbIndicator.speciesInfraTaxa || '') + '",' +
                    '"' + dbIndicator.author + '",' +
                    '"' + dbIndicator.description + '",' +
                    '"' + dbIndicator.country + '",' +
                    '"' + dbIndicator.state + '",' +
                    '"' + dbIndicator.locality + '",' +
                    '"' + dbIndicator.altitude + '",' +
                    '"' + dbIndicator.latitude + '",' +
                    '"' + dbIndicator.longitude + '",' +
                    '"' + dbIndicator.notes + '",' +
                    '"_toID_","_toFoto_","_toherb_","_tonomeherb1_","_tonomeherb2_","_toProyecto_",' +
                    '"' + dbIndicator.additional_notes + '",' +
                    '"' + dbIndicator.accuracy + '",' +
                    '"' + dbIndicator.altitudeaccuracy + '"';

        return DBtoString;

    };


    //GEOLOCATION PART
    function getPosition() {
        //disable button
        document.getElementById('getPosition').disabled = true;
        document.querySelector('#WaitgpsImgButton').style.display = 'inline';
        document.querySelector('#gpsImgButton').style.display = 'none';

        //disable elements to avoid errors
        var inputs = document.getElementsByClassName("gpsInputs");
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].disabled = true;
        }

        var options = {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: timeoutGPS,
        }


        //watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
        watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
        GPSon = true;

        function onSuccess(position) {
            stopGPS();

            document.getElementById('Latitude').value = position.coords.latitude;
            document.getElementById('Longitude').value = position.coords.longitude;
            document.getElementById('Altitude').value = position.coords.altitude;
            if (position.coords.accuracy != null) {
                document.getElementById('Accuracy').textContent = '± ' + position.coords.accuracy.toFixed(2) + ' m';
            };
            if (position.coords.altitudeAccuracy != null) {
                document.getElementById('AltitudeAccuracy').textContent = '± ' + position.coords.altitudeAccuracy.toFixed(2) + ' m';
            };


            //detect if altitude is OK, sometimes saver battery or high precission mode of Location make Altitude unavailable. Device only can return the altitude. show alert to warn the user
            if (position.coords.altitude == null) {
                navigator.notification.alert('Altitude is unavailable. \n\nIf you think that your phone has altimeter, check in your phone settings if your location mode is on "Device only".', function () { }, 'Information');
            };


            //trigger search location, must be based on config ***
            if (autoLocation == 1) {
                searchLocation();
            };

        };

        function onError(error) {
            if (GPSon && inRegistration) {
                //stopGPS();

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        navigator.notification.alert(' User denied the request for Geolocation.\n\nCheck your GPS permissions and try again', function () { }, 'Error');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        navigator.notification.alert('Location information is unavailable. \n\nCheck if your GPS is turned ON and try again', function () { }, 'Error');
                        break;
                    case error.TIMEOUT:
                        navigator.notification.alert('The request to get location timed out.\n\nCheck if your GPS is turned ON and try again, sometimes it needs a minute to receive the signal. In ColectoR configuration you can increase the limit time.', function () { }, 'Error');
                        break;
                    case error.UNKNOWN_ERROR:
                        navigator.notification.alert('An unknown error occurred.  (Error code: ' + error.code + ' - ' + error.message + ')\n\nCheck your GPS is turned ON and try again', function () { }, 'Error');
                        break;
                }

            };
            stopGPS();



        }
    }

    //STOP GPS
    function stopGPS() {

        //stop gps
        navigator.geolocation.clearWatch(watchID);
        GPSon = false;

        //enable button
        document.getElementById('getPosition').disabled = false;
        document.querySelector('#gpsImgButton').style.display = 'inline';
        document.querySelector('#WaitgpsImgButton').style.display = 'none';

        //enable elements again
        var inputs = document.getElementsByClassName("gpsInputs");
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].disabled = false;
        }
    }






    // CONDICIONAL FOR CAMERA
    function pre_cameraTakePicture() {
        if (document.querySelector('#Collector').value != '' && document.querySelector('#Number').value != '') {

            cameraTakePicture();

        } else {
            //alert('Collector and number are mandatory to save a record');
            navigator.notification.alert('Collector and number are mandatory to capture a photo, these are the photo ID.', function () { }, 'Information');
        }
    }



    /*
    //CAMERA PART (old)
    function cameraTakePicture() {
        // Retrieve image file location from specified source
        navigator.camera.getPicture(onSuccess, onFail,
        {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,
            correctOrientation: true,
            //saveToPhotoAlbum: true
        });

        //when the camera is closed after take a photo
        function onSuccess(imageURI) {

            //these are the vars  for the window.requestFileSystem and window.resolveLocalFileSystemURI
            var gotFileEntry = function (fileEntry) {
                console.log("Image file from: " + fileEntry.fullPath);
                var gotFileSystem = function (fileSystem) {

                    //put a folder name
                    var folderNamePhoto = document.querySelector('#Collector').value + "_" + document.querySelector('#Number').value;
                    //Create a new directory for the photos, one folder per collectio
                    //var directoryEntry = fileSystem.root; // to get root path of directory
                    //directoryEntry.getDirectory('ColectoR_Photos/' + folderNamePhoto, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard

                    //call the main Colector Photos folder and create if necessary
                    //fileSystem.root.getDirectory('ColectoR_Photos/' + folderNamePhoto, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard
                    fileSystem.root.getDirectory('ColectoR_Photos', { create: true, exclusive: false }, onMainDirectorySuccess, onDirectoryFail); // creating folder in sdcard

                    function onMainDirectorySuccess(parent) {

                        //create now the folder for each collection
                        fileSystem.root.getDirectory('ColectoR_Photos/' + folderNamePhoto, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard

                        function onDirectorySuccess(parent) {
                            // Directory of photos created successfuly and in parent is saved the current path of ColectoR_Photos
                            // copy the file with the original name (random) but in the folder
                            //fileEntry.moveTo(parent, document.querySelector('#Collector').value + "_" + document.querySelector('#Number').value + "_" + Math.random().toString(36).substr(2, 5) + ".jpg", null, null);
                            fileEntry.moveTo(parent, fileEntry.name, function (currentPhoto) {
                                console.log('Photo saved in:' + currentPhoto.fullPath)
                                console.log(currentPhoto);
                                //a place to put any function after save the image, for example, gui info


                            }, null);
                        }
                    }

                    function onDirectoryFail(error) {
                        //Error while creating directory
                        navigator.notification.alert("Unable to create a photos directory: " + error.code, function () { }, 'Error');
                    }
                };

                // get file system to copy or move image file to 
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFileSystem, fsFail);

            };

            //resolve file system for image  
            window.resolveLocalFileSystemURL(imageURI, gotFileEntry, fsFail);


            //file system fail 
            function fsFail(error) {
                navigator.notification.alert("Photo saving failed with error code: " + error.code, function () { }, 'Error');

            }
        }
        function onFail(message) {
            navigator.notification.alert('Photo capture failed. ' + message + '.', function () { }, 'Error');
        }

    };

    */



    //CAMERA PART (new)
    function cameraTakePicture() {
        console.log("Entering to cameraTakePicture");
        // Retrieve image file location from specified source
        navigator.camera.getPicture(onSuccess, onFail,
        {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,
            correctOrientation: true,
            //saveToPhotoAlbum: true
        });

        //when the camera is closed after take a photo
        function onSuccess(imageURI) {
            console.log("onSuccess: " + imageURI);
            //wait interface
            document.querySelector('#folderPhoto').style.display = 'none';
            document.querySelector('#waitfolderPhotoImg').style.display = 'inline';


            //these are the vars  for the window.requestFileSystem and window.resolveLocalFileSystemURI
            var gotFileEntry = function (fileEntry) {
                console.log("Image file from: " + fileEntry.fullPath);
                var gotFileSystem = function (fileSystem) {

                    //put a folder name
                    // var folderNamePhoto = document.querySelector('#Collector').value + "_" + document.querySelector('#Number').value;
                    //Create a new directory for the photos, one folder per collectio
                    //var directoryEntry = fileSystem.root; // to get root path of directory
                    //directoryEntry.getDirectory('ColectoR_Photos/' + folderNamePhoto, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard

                    //call the main Colector Photos folder and create if necessary
                    //fileSystem.root.getDirectory('ColectoR_Photos/' + folderNamePhoto, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard
                    fileSystem.root.getDirectory('ColectoR_Photos', { create: true, exclusive: false }, onMainDirectorySuccess, onDirectoryFail); // creating folder in sdcard

                    function onMainDirectorySuccess(parent) {
                        console.log("onMainDirectorySuccess: " + parent);


                        if (previousColnNum == null) {
                            var foldertoMove = "TEMP";
                        } else {
                            var foldertoMove = previousColnNum;
                            previousColnNum = null;
                        }

                        console.log("foldertoMove: " + foldertoMove);

                        //create now the folder for each collection
                        //fileSystem.root.getDirectory('ColectoR_Photos/TEMP', { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard

                        fileSystem.root.getDirectory('ColectoR_Photos/' + foldertoMove, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard
                       

                        function onDirectorySuccess(parent) {
                            console.log("onDirectorySuccess: " + parent);
                            // Directory of photos created successfuly and in parent is saved the current path of ColectoR_Photos
                            // copy the file with the original name (random) but in the folder
                            //fileEntry.moveTo(parent, document.querySelector('#Collector').value + "_" + document.querySelector('#Number').value + "_" + Math.random().toString(36).substr(2, 5) + ".jpg", null, null);
                            fileEntry.moveTo(parent, fileEntry.name, function (currentPhoto) {
                                //console.log('Photo saved in:' + currentPhoto.fullPath)
                                //console.log(currentPhoto);
                                //a place to put any function after save the image, for example, gui info

                                setTimeout(function () {
                                    document.querySelector('#waitfolderPhotoImg').style.display = 'none';
                                    document.querySelector('#folderPhoto').style.display = 'inline';
                                }, 1000);





                            }, null);
                        }
                    }

                    function onDirectoryFail(error) {
                        //Error while creating directory
                        navigator.notification.alert("Unable to create a photos directory: " + error.code, function () { }, 'Error');
                    }
                };

                // get file system to copy or move image file to 
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFileSystem, fsFail);

            };
            console.log("imageURI: " + imageURI);

            //resolve file system for image  
            window.resolveLocalFileSystemURL(imageURI, gotFileEntry, fsFail);


            //file system fail 
            function fsFail(error) {
                navigator.notification.alert("Photo saving failed with error code: " + error.code, function () { }, 'Error');

            }
        }
        function onFail(message) {
            navigator.notification.alert('Photo capture failed. ' + message + '.', function () { }, 'Error');
        }

    };



    //MOVE PHOTOS WHEN SAVE TO THE NEW FOLDER
    function movePhotostoRealName() {

        //verify if is a edition or a new and move temp photo folder or previous named photo folder
        if (previousColnNum == null) {
            var foldertoMove = "TEMP";
        } else {
            var foldertoMove = previousColnNum;
            previousColnNum = null;
        }

        folderNamePhoto = document.querySelector('#Collector').value + "_" + document.querySelector('#Number').value;

        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (fs) {
            //get Colector_Photos data
            fs.getDirectory('ColectoR_Photos', { create: false }, function (colectorPhotosDir) {
                //get temp folder
                fs.getDirectory('ColectoR_Photos/' + foldertoMove, { create: false }, function (colectorTEMPPhotosDir) {

                    //console.log(colectorPhotosDir);
                    //console.log(colectorTEMPPhotosDir);

                    colectorTEMPPhotosDir.moveTo(colectorPhotosDir, folderNamePhoto, function (renamePhotoFolder) {
                        //console.log("Sucess remaming folder");


                    }, null);

                });
            });
        });









    };

    //DELETE TEMP FOLDER PHOTOS  
    function deleteTemporalPhotoFolder() {
        //delete entire folder
        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (fs) {
            //get Colector_Photos data
            fs.getDirectory('ColectoR_Photos', { create: true }, function (colectorPhotosDir) {
                //get temp folder
                fs.getDirectory('ColectoR_Photos/TEMP', { create: true }, function (colectorTEMPPhotosDir) {

                    //console.log(colectorPhotosDir);
                    //console.log(colectorTEMPPhotosDir);

                    colectorTEMPPhotosDir.removeRecursively(function () {
                        //console.log("Remove Recursively Succeeded"); 

                    }, null);

                });
            });
        });


    }



    //EXPORT PHOTOS
    function exportPhotos() {

        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (fs) {
            //get Colector_Photos data
            fs.getDirectory('ColectoR_Photos', { create: false }, function (colectorPhotosDir) {


                //create the zip file of the entire folder an put in data

                var source = colectorPhotosDir.nativeURL,
                zip = cordova.file.externalCacheDirectory + 'ColectoR_PhotoDB_exported.zip';


                console.log('source    : ' + source);
                console.log('zip       : ' + zip);


                // waitprocess
                console.log('Zipping Photos database ...');
                document.getElementById('infoExport').innerHTML = 'Please wait - zipping all photos in a ZIP file, this file can be very large...';

                //disable interface
                document.getElementById('exportButton').disabled = true;
                document.getElementById('exportPhotoButton').disabled = true;
                //document.querySelector('#waitexportPhotoImgButton').style.display = 'inline';
                //document.querySelector('#exportPhotoImgButton').style.display = 'none';


                Zeep.zip({
                    from: source,
                    to: zip
                }, function () {

                    console.log('zip success!');

                    // finish waitprocess
                    //enable buttons
                    document.getElementById('exportPhotoButton').disabled = false;
                    document.getElementById('exportButton').disabled = false;
                    //document.querySelector('#exportPhotoImgButton').style.display = 'inline';
                    //document.querySelector('#waitexportPhotoImgButton').style.display = 'none';


                    document.getElementById('infoExport').innerHTML = 'A temporary copy of the exported ZIP file was also saved in the cache';

                    //share function calling zip as the file. 
                    window.plugins.socialsharing.share(
                  null,
                  null,
                  zip,
                  null,
                  function (result) { console.log('result: ' + result); },//show message button
                  function (result) { console.log('error: ' + result) }
              );
                }, function (e) {
                    console.log('zip error: ', e);
                });



            });
        });

    };



    //CLEAN PHOTOS TABLE
    function cleanPhotosTable() {
        while (table.rows[0]) table.deleteRow(0);
        //console.log("tabla limpia");


    }


    //CREATE A INTERFACE TO VIEW PHOTOS
    //ToDO: this could be improved with new options in css (flex boxes for example)
    function loadPhotos() {

        cleanPhotosTable();

        //Check if is a edition of a new entry and change the directory. In edition is the named folder, in new entry is TEMP
        if (inEdition) {
            var folderNamePhototoList = "ColectoR_Photos/" + document.querySelector('#Collector').value + "_" + document.querySelector('#Number').value;
            //console.log("inEdition")

        } else {
            var folderNamePhototoList = "ColectoR_Photos/TEMP";
            //console.log("inTEMP")

        }

        //call the folder in externalRootDirectory
        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory + folderNamePhototoList, success, fail);
        function success(entry) {
            //console.log(entry);

            //Make a list of files in the folder
            window.resolveLocalFileSystemURL(entry.nativeURL,
                  function (fileSystem) {
                      var reader = fileSystem.createReader();
                      reader.readEntries(
                        function (entries) {
                            //wait interface
                            //document.getElementById('toPhotos').disabled = true;
                            //document.querySelector('#folderPhoto').style.display = 'none';
                            //document.querySelector('#waitfolderPhotoImg').style.display = 'inline';


                            //console.log(entries);

                            //make list of img
                            //delete previous result

                            var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                            width = width - ((width*10)/100);


                            document.getElementById('photos_pseudoscreen_Container').scrollTop = 0;
                            document.getElementById('photos_pseudoscreen_Container').classList.remove('closed');
                            document.getElementById('registration_screen_Container').classList.add('closed');
                            document.querySelector('#legendofPhotos').innerHTML = "Photo collection of " + document.querySelector('#Collector').value + " " + document.querySelector('#Number').value + (" Saved in /ColectoR_Photos/");

                          //old gallery 
                            entries.forEach(addRow);

                            function addRow(item, i){

                                var row = table.insertRow(i);
                                var firstColPhotos = row.insertCell(0);

                                firstColPhotos.innerHTML = '<img class="thumbsPhotos" src="' + entries[i].nativeURL + '">';

                            }
                            

                        },
                        function (err) {
                            console.log(err);
                        }
                      );
                  }, function (err) {
                      console.log(err);
                  }
                );



        }
        function fail(error) {
            //console.log("No files in the folder");
            inPhotos = false;
            inRegistration = true;
            navigator.notification.alert('This entry does not have any photos to display', function () { }, 'Information', 'Done');

        }



    };


    //CREATE HTML ELEMENTS  String,  Object,  String
    function createElement(tagName, attribs, text) {
        var elm = document.createElement(tagName), a;
        if (attribs) // if given
            for (a in attribs) // for each property
                if (attribs.hasOwnProperty(a)) // that is not inherited
                    elm.setAttribute(a, attribs[a]); // set attribute
        if (text) // if given
            elm.appendChild(document.createTextNode(text)); // append text
        return elm; // node out
    }



    //DELETE PHOTO FOLDER PRECONFIGRMATION
    function deletePhotoFolder() {
        if (!startPhotoDelete) {
            startPhotoDelete = true;
            navigator.notification.alert('You will delete the ENTIRE photos folder (all files inside Colector_Photos folder). Remember that this action cannot be undone.\n\nTrash icon will change to red, press again to delete the entire folder forever!', function () { }, 'Warning!', 'Done');
            document.querySelector('#deletePhotoFolder').innerHTML = '<img class="imageButton" src="images/deleteRed.png"/>';
        } else {
            navigator.notification.confirm('Do you want to delete the ENTIRE folder of ColectoR_Photos?. This is the last chance!', onConfirm_deletePhotoFolder, 'Last chance', ['Delete Database', 'Cancel']);

        }
    }

    //CONFIRM DELETE PHOTO FOLDER OPTION FROM CONFIRM
    function onConfirm_deletePhotoFolder(buttonIndex) {
        if (buttonIndex == 1) {
            startPhotoDelete = false;

            reallyDeletePhotoFolder();


        } else {
            startPhotoDelete = false;
            document.querySelector('#deleteDatabase').innerHTML = '<img class="imageButton" src="images/delete.png"/>';

        }

    };


    //DELETE photo DATABASE (PUT OUTSIDE BECAUSE STRICT MODE)
    function reallyDeletePhotoFolder() {

        //delete entire folder
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
        function fail(evt) {
            console.log("FILE SYSTEM FAILURE" + evt.target.error.code);
        }
        function onFileSystemSuccess(fileSystem) {
            fileSystem.root.getDirectory(
                 "ColectoR_Photos",
                { create: true, exclusive: false },
                function (entry) {
                    entry.removeRecursively(function () {
                        console.log("Remove Recursively Succeeded");
                        location.reload();
                        navigator.notification.alert('Your Colector_Photos folder has been deleted', function () { }, 'Information');

                    }, fail);
                }, fail);
        }
    };







    //LOCK REGISTRY
    function Lock() {
        lockStatus = true;
        inEdition = true;
        document.querySelector('#Lock').style.display = 'inline';
        document.querySelector('#Unlock').style.display = 'none';

        //Disable inputs in registration_screen_Container
        var inputs = document.getElementById('registration_screen_Container').getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].disabled = true;
        }
        //Disable buttons in registration_screen_Container
        var buttons = document.getElementById('registration_screen_Container').getElementsByTagName("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = true;
        }
        //Disable textarea in registration_screen_Container
        var textareas = document.getElementById('registration_screen_Container').getElementsByTagName("textarea");
        for (var i = 0; i < textareas.length; i++) {
            textareas[i].disabled = true;
        }

        //Enable lock button and back button 
        document.getElementById('LockUnlock').disabled = false;
        document.getElementById('saveEntry').disabled = false;
        document.getElementById('toPhotos').disabled = false;
        document.querySelector('#backInEditImgButton').style.display = 'inline';
        document.querySelector('#saveImgButton').style.display = 'none';
    };



    //UNLOCK REGISTRY
    function Unlock() {
        lockStatus = false;
        inEdition = true;
        document.querySelector('#Unlock').style.display = 'inline';
        document.querySelector('#Lock').style.display = 'none';


        //Enable inputs in registration_screen_Container
        var inputs = document.getElementById('registration_screen_Container').getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].disabled = false;
        }
        //Enable buttons in registration_screen_Container
        var buttons = document.getElementById('registration_screen_Container').getElementsByTagName("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = false;
        }
        //Enable textarea in registration_screen_Container
        var textareas = document.getElementById('registration_screen_Container').getElementsByTagName("textarea");
        for (var i = 0; i < textareas.length; i++) {
            textareas[i].disabled = false;
        }

        document.querySelector('#backInEditImgButton').style.display = 'none';
        document.querySelector('#LockUnlock').style.display = 'none';
        document.querySelector('#backInRegisgrationScreen').style.display = 'inline';
        document.querySelector('#saveImgButton').style.display = 'inline';
        //document.getElementById('LockUnlock').disabled = true;
    };


    //REMOVE SUGGESTED COLOR WHEN CLICK A SUGGESTED INPUT (AKA VALIDATE)
    document.addEventListener('click', function (e) {
        if (event.target.classList.contains('suggested')) {
            event.target.classList.remove('suggested');
        } return
    })

    //EACH SCREEN CONTROL
    function setScreen(inScreen) {

        //save settings if is from inConfig
        if (inConfig) { saveCurrentSetting(); }


        inMain =
        inRegistration =
        inReview =
        inConfig =
        inExport =
        inEdit = false;

        switch (inScreen) {
            case 'inMain':

                inMain = true;
                stopGPS();
                document.getElementById('main_screen_Container').scrollTop = 0;
                document.getElementById('main_screen_Container').classList.remove('closed');
                document.getElementById('registration_screen_Container').classList.add('closed');
                document.getElementById('review_screen_Container').classList.add('closed');
                document.getElementById('config_screen_Container').classList.add('closed');
                document.getElementById('export_screen_Container').classList.add('closed');



                //document.querySelector('#registration_screen_Container').style.display = 'none';
                //document.querySelector('#main_screen').style.display = 'block';
                break;
            case 'inRegistration':
                inRegistration = true;
                //caso especial cuando inTowns esta activo
                if (!inTowns) {
                    //hide lockunlock y retorna el back just in case that edit is before
                    //document.querySelector('#backInRegisgrationScreen').style.display = 'inline';
                    //document.querySelector('#LockUnlock').style.display = 'none';
                    //
                    document.getElementById('registration_screen_Container').scrollTop = 0;
                    document.getElementById('registration_screen_Container').classList.remove('closed');
                    document.getElementById('main_screen_Container').classList.add('closed');

                    removeSuggestedClass();
                } else {
                    inTowns = false;
                    document.getElementById('registration_screen_Container').classList.remove('closed');
                    document.getElementById('towns_pseudoscreen_Container').classList.add('closed');

                };
                //caso especial cuando inPhotos esta activo
                if (!inPhotos) {
                    //hide lockunlock y retorna el back just in case that edit is before
                    //document.querySelector('#backInRegisgrationScreen').style.display = 'inline';
                    //document.querySelector('#LockUnlock').style.display = 'none';
                    //
                    document.getElementById('registration_screen_Container').scrollTop = 0;
                    document.getElementById('registration_screen_Container').classList.remove('closed');
                    document.getElementById('main_screen_Container').classList.add('closed');

                    removeSuggestedClass();
                } else {
                    inPhotos = false;
                    document.getElementById('registration_screen_Container').classList.remove('closed');
                    document.getElementById('photos_pseudoscreen_Container').classList.add('closed');

                };

                //document.getElementById('registration_screen_Container').classList.toggle('closed');
                //document.querySelector('#registration_screen_Container').style.display = 'block';
                //document.querySelector('#main_screen').style.display = 'none';

                break;
            case 'inTowns':
                inTowns = true;
                document.getElementById('towns_pseudoscreen_Container').scrollTop = 0;
                document.getElementById('towns_pseudoscreen_Container').classList.remove('closed');
                document.getElementById('registration_screen_Container').classList.add('closed');
                break;
            case 'inPhotos':
                inPhotos = true;
                loadPhotos();
                //rest of the interface modification occurs in loadPhotos
                break;
            case 'inReview':
                inReview = true;
                document.getElementById('review_screen_Container').scrollTop = 0;
                document.getElementById('review_screen_Container').classList.remove('closed');
                document.getElementById('main_screen_Container').classList.add('closed');
                document.getElementById('registration_screen_Container').classList.add('closed');
                break;
            case 'inConfig':
                inConfig = true;
                document.getElementById('config_screen_Container').scrollTop = 0;
                document.getElementById('config_screen_Container').classList.remove('closed');
                document.getElementById('main_screen_Container').classList.add('closed');
                startDelete = false;
                startPhotoDelete = false;
                document.querySelector('#deleteDatabase').innerHTML = '<img class="imageButton" src="images/delete.png"/>';
                document.querySelector('#deletePhotoFolder').innerHTML = '<img class="imageButton" src="images/delete.png"/>';
                loadSavedSettings();
                break;
            case 'inExport':
                inExport = true;
                document.getElementById('export_screen_Container').scrollTop = 0;
                document.getElementById('export_screen_Container').classList.remove('closed');
                document.getElementById('main_screen_Container').classList.add('closed');
                break;
            case 'inEdit':
                inEdit = true;
                document.querySelector('#LockUnlock').style.display = 'inline';
                document.querySelector('#backInRegisgrationScreen').style.display = 'none';
                document.getElementById('registration_screen_Container').scrollTop = 0;
                document.getElementById('review_screen_Container').classList.add('closed');
                document.getElementById('registration_screen_Container').classList.remove('closed');
                removeSuggestedClass();
                //go to lock 
                Lock();


        }
    }


    //REMOVE SUGESTED CLASS TO EACH TEXT, TURN IT FROM YELLOW TO BLACK FONT
    function removeSuggestedClass() {
        [].forEach.call(document.querySelectorAll('.suggested'), function (e) {
            e.classList.remove('suggested');
        });

    };

    //CLEAN ANY TEXT IN THE INPUTS AND CONTENTS ON THE REGISTRATION SCREEN
    function cleanRegistrationScreen() {
        document.querySelector('#Date').value = "";
        document.querySelector('#Collector').value = "";
        document.querySelector('#Number').value = "";
        document.querySelector('#Et_al').value = "";
        document.querySelector('#Species').value = "";
        document.querySelector('#Author').value = "";
        document.querySelector('#Family').value = "";
        document.querySelector('#Description').value = "";
        document.querySelector('#Latitude').value = "";
        document.querySelector('#Longitude').value = "";
        document.querySelector('#Altitude').value = "";
        document.querySelector('#Accuracy').textContent = "";
        document.querySelector('#AltitudeAccuracy').textContent = "";
        document.querySelector('#Country').value = "";
        document.querySelector('#State').value = "";
        document.querySelector('#Locality').value = "";
        document.querySelector('#Notes').value = "";
        document.querySelector('#Additional_notes').value = "";
    }


    //CREATE OR POPULATE DATALISTS USING A IDENTIFIER
    function createDatalist(idToDatalist, objectStore) {

        try {

            var elementsDatalist = [];
            var index = objectStore.index('by_' + idToDatalist);
            index.openCursor(null, "nextunique").onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    switch (idToDatalist) {
                        case 'collector':
                            elementsDatalist = elementsDatalist.concat(cursor.value.collector);
                            break;
                        case 'species':
                            elementsDatalist = elementsDatalist.concat(cursor.value.species);
                            break;
                        case 'family':
                            elementsDatalist = elementsDatalist.concat(cursor.value.family);
                            break;
                        case 'country':
                            elementsDatalist = elementsDatalist.concat(cursor.value.country);
                            break;
                        case 'state':
                            elementsDatalist = elementsDatalist.concat(cursor.value.state);
                            break;
                    }
                    cursor.continue();
                } else {
                    var elementsDatalistLen = elementsDatalist.length;
                    var options = '';
                    for (var i = 0; i < elementsDatalistLen; i++) {
                        options += '<option value="' + elementsDatalist[i] + '" />';
                        //var x = document.createElement("OPTION");
                        //x.setAttribute("value", elementsDatalist[i]);
                        //document.getElementById('List' + idToDatalist).appendChild(x);

                    }
                    //options += "</datalist>";
                    document.getElementById('List' + idToDatalist).innerHTML = options;
                    elementsDatalist = [];
                    elementsDatalistLen = '';
                    options = '';
                }
            };
        } catch (error) { alert(error) }
    }


    //OPEN REVIEW SCREEN AND SHOW TABLE WITH ENTRIES
    function toReviewScreen() {

        //declare and clear the table 
        var table = document.getElementById('review_table');
        while (table.rows[0]) table.deleteRow(0);


        var openReq = indexedDB.open('colectorDB', dataBaseVersion);
        openReq.onsuccess = function () {
            var db = openReq.result;
            var transaction = db.transaction(['main'], 'readonly');
            var objectStore = transaction.objectStore('main');

            var elementsDatalist = [];
            var elementsDatalistBrute = [];

            objectStore.openCursor(null, "next").onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    var texttoadd = cursor.value.collector + ' ' + cursor.value.number + ' - <em>' + (cursor.value.species != null && cursor.value.species || cursor.value.family != null && cursor.value.family || 'No identified') + '</em>';
                    elementsDatalist = elementsDatalist.concat(texttoadd);

                    elementsDatalistBrute.push(cursor.value);

                    cursor.continue();
                } else {
                    //console.log(elementsDatalist);
                    var elementsDatalistLen = elementsDatalist.length;
                    //var elements = '<thead><tr><th>Record</th><th>Edit</th><th>Delete</th></tr></thead>';
                    var elements = '';

                    //show or hide no entries label
                    if (elementsDatalistLen > 0) {
                        document.getElementById('no_entries_to_show').classList.add('hidden');
                    } else {
                        document.getElementById('no_entries_to_show').classList.remove('hidden');
                    }


                    for (var i = 0; i < elementsDatalistLen; i++) {

                        /*                        
                                                elements += '<tr><td class="oReview firstColReview">' + elementsDatalist[i] + '</td>';
                                                elements += '<td class="oReview secondColReview"><button type="button" class="ButtontoEdit" id="toEdit_' +elementsDatalistBrute[i].id + '"><div><img class="imageButton" src="images/edit.png" /></div></button></td>';
                                                elements += '<td class="oReview thridColReview"> <button class="ButtontoDelete" id="toDelete_' + elementsDatalistBrute[i].id + '"><div><img id="BlackDelete_' + elementsDatalistBrute[i].id + '" class="imageButton" src="images/delete.png" /></div></button></td></tr>';
                                                */

                        //pure javascript to create each row
                        var row = table.insertRow(i);
                        var firstColReview = row.insertCell(0);
                        var secondColReview = row.insertCell(1);
                        var thridColReview = row.insertCell(2);
                        firstColReview.innerHTML = elementsDatalist[i];
                        secondColReview.innerHTML = '<button type="button" class="ButtontoEdit" id="toEdit_' + elementsDatalistBrute[i].id + '"><div><img class="imageButton" src="images/edit.png" /></div></button>';
                        thridColReview.innerHTML = '<button class="ButtontoDelete" id="toDelete_' + elementsDatalistBrute[i].id + '"><div><img id="BlackDelete_' + elementsDatalistBrute[i].id + '" class="imageButton" src="images/delete.png" /></div></button>';
                        firstColReview.className = 'oReview firstColReview';
                        secondColReview.className = 'oReview secondColReview';
                        thridColReview.className = 'oReview thridColReview';

                    }

                    //document.getElementById('review_table').innerHTML = elements;



                    //make a list of buttons that have the class ButtontoEdit, and add a listener to these
                    var buttons = document.getElementsByClassName('ButtontoEdit');
                    var buttonsLength = buttons.length;
                    for (var i = 0; i < buttonsLength; i++) {
                        buttons[i].addEventListener('click', editRecord, false);
                    };

                    //make a list of buttons that have the class ButtontoDelete, and add a listener to these
                    var buttons = document.getElementsByClassName('ButtontoDelete');
                    var buttonsLength = buttons.length;
                    for (var i = 0; i < buttonsLength; i++) {
                        buttons[i].addEventListener('click', deleteRecord, false);
                    };

                    elementsDatalist = [];
                    elementsDatalistLen = '';
                    elements = '';
                }
            };

        }

        setScreen('inReview');
    };


    //OPEN CONFIG SCREEN
    function toConfigScreen() {
        setScreen('inConfig');


    }



    //EDIT ONE RECORD
    function editRecord() {
        var idbruto = this.id;
        var idFinal = idbruto.replace('toEdit_', '');


        var active = dataBase.result;
        var data = active.transaction(['main'], 'readwrite');
        var object = data.objectStore('main');

        var request = object.get(parseInt(idFinal));

        request.onsuccess = function () {
            var result = request.result;

            if (result !== undefined) {

                //set the id to update
                idToUpdate = result.id;




                //put data into the inputs
                document.querySelector('#Collector').value = result.collector;
                document.querySelector('#Number').value = result.number;
                document.querySelector('#Et_al').value = result.et_al;
                document.querySelector('#Species').value = result.species;
                document.querySelector('#Author').value = result.author;
                document.querySelector('#Family').value = result.family;
                document.querySelector('#Description').value = result.description;
                document.querySelector('#Latitude').value = result.latitude;
                document.querySelector('#Longitude').value = result.longitude;
                document.querySelector('#Altitude').value = result.altitude;
                document.querySelector('#Accuracy').textContent = result.accuracy;
                document.querySelector('#AltitudeAccuracy').textContent = result.altitudeaccuracy;
                document.querySelector('#Country').value = result.country;
                document.querySelector('#State').value = result.state;
                document.querySelector('#Locality').value = result.locality;
                document.querySelector('#Notes').value = result.notes;
                document.querySelector('#Additional_notes').value = result.additional_notes;
                document.querySelector('#Date').value = result.year + '-' + result.month + '-' + result.day;

                //save original collector and number in a variable to check if change to rename photo folder for example
                previousColnNum = document.querySelector('#Collector').value + "_" + document.querySelector('#Number').value;

                //change screen
                setScreen('inEdit');
            }
        };
    }






    //DELETE ONE RECORD
    function deleteRecord() {
        var indexrow = this;
        var idbruto = this.id;
        var idFinal = idbruto.replace('toDelete_', '');
        var collector_number = null;

        if (this.classList.contains('redDEAD')) {
            var active = dataBase.result;
            var data = active.transaction(["main"], "readwrite");
            var object = data.objectStore("main");

            //get entry to write into the security db the deleted entry
            var requesttoSecurityDB = object.get(parseInt(idFinal));
            requesttoSecurityDB.onsuccess = function (event) {
                collector_number = requesttoSecurityDB.result.collector_number;
            };

            var request = object.delete(parseInt(idFinal));

            request.onsuccess = function (event) {
                //toReviewScreen();

                document.getElementById("review_table").deleteRow(indexrow.parentNode.parentNode.rowIndex);

                // report the success of our delete operation
                //write into the security the delete entry
                writeFile(backupFilename, '"' + new Date().toDateString() + '","Deleted ' + collector_number + '"\n', true);



            };
        } else {
            navigator.notification.alert('You will delete this record. Remember that this action cannot be undone. Photos will NOT be deleted!.\n\nTrash icon will change to red, press again to delete this record forever!', function () { }, 'Warning!', 'Done');
            this.classList.add('redDEAD');
            this.innerHTML = '<img class="imageButton" src="images/deleteRed.png"/>';


        }


    }

    //SEARCH RECORDS IN THE PREVIEW SCREEN
    function searchInPreviewScreen() {
        // Declare variables 
        var input, filter, table, tr, td, i;
        input = document.getElementById("SearchInPreviewScreen");
        filter = input.value.toUpperCase();
        table = document.getElementById("review_table");
        tr = table.getElementsByTagName("tr");
        // Loop through all table rows, and hide those who don't match the search query
        for (i = 0; i < tr.length; i++) {
            td = tr[i].getElementsByTagName("td")[0];
            if (td) {
                if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                } else {
                    tr[i].style.display = "none";
                }
            }
        }
    }

    //TOGGLE BETWEEN LOCK AND UNLOCK
    function LockUnlock() {

        if (lockStatus) {
            Unlock();
        } else {
            //Lock();
        }
    };


    //IGNORES DIALOG CLOSE CALLBACK
    function ignorarDialogClose() {
        // do NOthing
    }


    //DELETE THE ENTIRE DATABASE
    function deleteDatabase() {
        if (!startDelete) {
            startDelete = true;
            navigator.notification.alert('You will delete the ENTIRE database (datalist, collectors and everything, but NOT photos). Remember that this action cannot be undone.\n\nTrash icon will change to red, press again to delete the entire database forever!', function () { }, 'Warning!', 'Done');
            document.querySelector('#deleteDatabase').innerHTML = '<img class="imageButton" src="images/deleteRed.png"/>';
        } else {
            navigator.notification.confirm('Do you want to delete the ENTIRE database?. This is the last chance!\n\nRemember: security database backup will not be deleted!', onConfirm_deleteDatabase, 'Last chance', ['Delete Database', 'Cancel']);

        }
    }

    //CONFIRM DELETE OPTION FROM CONFIRM (PUT OUTSIDE BECAUSE STRICT MODE)
    function onConfirm_deleteDatabase(buttonIndex) {
        if (buttonIndex == 1) {
            indexedDB.deleteDatabase('colectorDB', dataBaseVersion);
            startDelete = false;
            location.reload();
            navigator.notification.alert('Your database has been cleaned', function () { }, 'Information!');
            //write into the security the delete db
            writeFile(backupFilename, '"' + new Date().toDateString() + '","Deleted entire database"\n', true);
        } else {
            startDelete = false;
            document.querySelector('#deleteDatabase').innerHTML = '<img class="imageButton" src="images/delete.png"/>';

        }

    };


    // CREATE BACKUP FILE
    function CreateOpenBackupFile() {

        //AFUERA EN EL ROOT PERO NO EN LA SD
        //externalRootDirectory
        //EN LA CARPETA DE LA APP VISIBLE
        //externalApplicationStorageDirectory

        try {
            window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (fs) {
                //create ColectoR_Data folder
                fs.getDirectory('ColectoR_Data', { create: true }, function (colectorFolder) {

                    //document.querySelector('#backupPath').innerHTML = fs.fullPath;
                    document.querySelector('#backupPath').innerHTML = colectorFolder.fullPath;
                    //console.log('file path: ' + fs.fullPath);
                    colectorFolder.getFile("ColectoR_backup.txt", { create: true, exclusive: false }, function (fileEntry) {
                        backupFilename = fileEntry;

                        fileEntry.createWriter(function (fileWriter) {
                            if (fileWriter.length === 0) {
                                writeFile(fileEntry, '"Event date","Event",' + titles + '\n', true)
                            }

                        })

                        //console.log(backupFilename);
                        // fileEntry.name == 'someFile.txt'
                        // fileEntry.fullPath == '/someFile.txt'
                        //writeFile(fileEntry, 'Date: ' + new Date() + '\n', true);
                    });

                    colectorFolder.getFile("This folder was created to be a security backup for ColectoR databases", { create: true, exclusive: false });


                }, function (error) {
                    console.log(error);
                });
            }, function (errordirCreation) { });

        } catch (error) { console.log(error) }
    };



    //WRITE ANY FILE IF WE HAVE THE FILENTRY, dataObj can be the text and, isAppend is boolean.
    function writeFile(fileEntry, dataObj, isAppend) {
        // Create a FileWriter object for our FileEntry (log.txt).
        try {
            fileEntry.createWriter(function (fileWriter) {

                fileWriter.onwriteend = function () {
                    //console.log("Added to file, reading...");
                    //readFile(fileEntry);
                };

                fileWriter.onerror = function (e) {
                    console.log("Failed file read: " + e.toString());
                };



                // If we are appending data to file, go to the end of the file.
                if (isAppend) {
                    try {
                        fileWriter.seek(fileWriter.length);
                    }
                    catch (e) {
                        console.log("File doesn't exist!");
                    }
                }
                fileWriter.write(dataObj);
            });
        } catch (error) { console.log(error) }
    }



    //SHARE FUNCTION OF SECURITY BACKUP
    function shareSecurityBackup() {
        window.plugins.socialsharing.share(
      null,
      null,
      backupFilename.nativeURL,
      null,
      function (result) { console.log('result: ' + result) },
      function (result) { alert('error: ' + result) }
  );
    }



    //EXPORT DATABASE INTO A CSV FILE
    function exportDB() {
        var openReq = indexedDB.open('colectorDB', dataBaseVersion);
        openReq.onsuccess = function () {
            var db = openReq.result;
            var transaction = db.transaction(['main'], 'readonly');
            var objectStore = transaction.objectStore('main');

            var elementsDatalist = [];


            objectStore.openCursor(null, "next").onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    //create each row for the csv  

                    var texttoadd = dbToString(cursor.value);

                    //created an array
                    elementsDatalist = elementsDatalist.concat(texttoadd);


                    cursor.continue();
                } else {
                    //console.log(elementsDatalist);
                    var elementsDatalistLen = elementsDatalist.length;

                    var elements = '';

                    for (var i = 0; i < elementsDatalistLen; i++) {

                        //put titles if is the first element
                        if (i === 0) { elements += titles + '\n' }

                        //put each row
                        elements += elementsDatalist[i] + '\n';
                    }

                    //write
                    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (fs) {
                        //create ColectoR_Data folder if not exist
                        fs.getDirectory('ColectoR_Data', { create: true }, function (colectorFolder) {
                            //document.querySelector('#backupPath').innerHTML = colectorFolder.fullPath;
                            colectorFolder.getFile('ColectoR_DB_exported.csv', { create: true, exclusive: false }, function (fileEntry) {
                                writeFile(fileEntry, elements, false);
                                //console.log(elements);

                                document.getElementById('infoExport').innerHTML = 'A copy of the exported CSV file was also saved in: <em><b>' + fileEntry.fullPath + '</b></em>';

                                //share
                                window.plugins.socialsharing.share(
                              null,
                              null,
                              fileEntry.nativeURL,
                              null,
                              function (result) { console.log('result: ' + result); },//show message button
                              function (result) { console.log('error: ' + result) }
                          );


                            });



                        });
                    });



                }
            }
        }
    };





    //SEARCH INTO THE DB IF THE TAXA EXIST SUGGEST FAMILY, AUTHOR AND LAST DESCRIPTION
    function suggestFamilyOffline() {

        //capitalize species input
        var str = document.getElementById('Species').value.trim();
        if (str && str.length >= 1) {
            var firstChar = str.charAt(0);
            var remainingStr = str.slice(1);
            str = firstChar.toUpperCase() + remainingStr;
        }
        document.getElementById('Species').value = str;

        //search in the database for the name
        var openReq = indexedDB.open('colectorDB', dataBaseVersion);
        openReq.onsuccess = function () {
            var db = openReq.result;
            var transaction = db.transaction(['main'], 'readonly');
            var objectStore = transaction.objectStore('main');
            var index = objectStore.index('by_species');



            var requesttospecies = index.openCursor(document.getElementById('Species').value, 'prev');
            //search for the species in the input species
            //var requesttospecies = index.get(document.getElementById('Species').value);


            requesttospecies.onsuccess = function (event) {
                //console.log(requesttospecies.result);

                if (requesttospecies.result !== null) {
                    //if species is different to '' suggest author, fam and description
                    document.getElementById('Author').value = requesttospecies.result.value.author;
                    document.getElementById('Author').className += " suggested";


                    if (document.getElementById('Description').value == false || document.getElementById('Description').classList.contains('suggested')) {
                        document.getElementById('Description').value = requesttospecies.result.value.description;
                        document.getElementById('Description').className += " suggested";
                    }
                } else {
                    //if species is equal to '' clean author always, fam and description only if suggested class is present and remove suggested class
                    document.getElementById('Author').value = '';
                    document.getElementById('Author').classList.remove('suggested');



                    if (document.getElementById('Description').classList.contains('suggested')) {
                        document.getElementById('Description').value = "";
                        document.getElementById('Description').classList.remove('suggested');
                    }
                }


            };



            requesttospecies.onerror = function (event) { console.log('Error to load species') }



            var index = objectStore.index('by_speciesGenus');


            //search for the genus in the input species
            //var requesttogenus = index.get(document.getElementById('Species').value.split(' ')[0]);

            var requesttogenus = index.openCursor(document.getElementById('Species').value.split(' ')[0], 'prev');

            requesttogenus.onsuccess = function (event) {

                //suggest family based on genus only
                if (requesttogenus.result !== null) {
                    document.getElementById('Family').value = requesttogenus.result.value.family;
                    document.getElementById('Family').className += " suggested";

                } else {
                    if (document.getElementById('Family').classList.contains('suggested')) {
                        document.getElementById('Family').value = "";
                        document.getElementById('Family').classList.remove('suggested');
                    }

                }


            }



        }
    };


    //SEARCH SPECIES INTO THE IPLANT SERVER 
    //ToFix
    function searchSpecies() {
        if (document.getElementById('Species').value) {
            var request = new XMLHttpRequest();
            request.open("GET", "http://tnrs.iplantc.org/tnrsm-svc/matchNames?retrieve=best&names=" + encodeURI(document.getElementById('Species').value), true);
            request.onreadystatechange = function () {
                //console.log('readystate: ' + request.readyState);

                //load response file
                if (request.readyState == 4) {
                    //show again the search icon
                    document.getElementById('searchSpecies').disabled = false;
                    document.querySelector('#waitsearchSpeciesImg').style.display = 'none';
                    document.querySelector('#searchSpeciesImg').style.display = 'inline';

                    //console.log('readystate: ' + request.status);
                    if (request.status == 200 || request.status == 0) {

                        var result = JSON.parse(request.responseText);
                        R_acceptedName = result.items["0"].acceptedName;
                        R_acceptedAuthor = result.items["0"].acceptedAuthor;
                        R_family = result.items["0"].family;

                        if (R_acceptedName) {
                            navigator.notification.confirm('Some data was found in the iPlant CollaborativeTM server:\n\n' + R_family + '\n' + R_acceptedName + ' ' + R_acceptedAuthor + '\n\nDo you want to replace the current data?', onConfirm_acceptiplantChanges, 'Confirmation');
                        } else {
                            navigator.notification.alert('Zero coincidences were found in the iPlant CollaborativeTM server, check spelling and try again', function () { }, 'Information');

                        }

                    } else if (request.status == 404) {
                        navigator.notification.alert('iPlant CollaborativeTM server cannot be reach at moment', function () { }, 'Information');
                    }


                }
            }
            //console.log("asking");
            request.send();
            //hide search icon and show wait
            document.getElementById('searchSpecies').disabled = true;
            document.querySelector('#waitsearchSpeciesImg').style.display = 'inline';
            document.querySelector('#searchSpeciesImg').style.display = 'none';
        } else {
            navigator.notification.alert('Enter a species to search into the iPlant CollaborativeTM server', function () { }, 'Information');
        }
    };

    //confirm dialog searchspecies
    function onConfirm_acceptiplantChanges(buttonIndex) {
        if (buttonIndex == 1) {
            document.getElementById('Species').value = R_acceptedName;
            document.getElementById('Author').value = R_acceptedAuthor;
            document.getElementById('Family').value = R_family;
            document.getElementById('Species').classList.remove('suggested');
            document.getElementById('Author').classList.remove('suggested');
            document.getElementById('Family').classList.remove('suggested');
        }
    };




    //SEARCH LOCATION DETAILS
    //ToFix, google map is not working, geonames still is functional
    function searchLocation() {

        if (document.getElementById('Latitude').value && document.getElementById('Longitude').value) {

            var R_routeL =
                R_routeS =
                R_routeN =
                R_lvl2 =
                R_lvl1 =
                R_countryL =
                R_countryS =
                R_locality =
                toLocalityRoute =
                toLocalityLvl2 =
                toLocalityLocality =
                distanceBycar =
                selectedname =
                cardinal = '';



            var requestGM = new XMLHttpRequest();
            requestGM.open("GET", "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + encodeURI(document.getElementById('Latitude').value) + ',' + encodeURI(document.getElementById('Longitude').value) + '&key=APIKEY', true); 
            requestGM.onreadystatechange = function () {
                //load response file
                if (requestGM.readyState == 4) {
                    // console.log(requestGM.readyState);
                    //show again the search icon
                    document.getElementById('searchLocation').disabled = false;
                    document.querySelector('#waitsearchLocationImg').style.display = 'none';
                    document.querySelector('#searchLocationImg').style.display = 'inline';

                    //console.log('readystate: ' + request.status);
                    if (requestGM.status == 200 || requestGM.status == 0) {

                        var result = JSON.parse(requestGM.responseText);
                        //console.log(result);

                        //make a loop to get the types into the result 0 (most specific for google map api) and for the type 0 that is the specific type
                        for (var i = 0; i < result.results[0].address_components.length; i++) {

                            switch (result.results[0].address_components[i].types[0]) {
                                case 'route':
                                    R_routeL = result.results[0].address_components[i].long_name;
                                    R_routeS = result.results[0].address_components[i].short_name;
                                    break;
                                case 'administrative_area_level_2':
                                    R_lvl2 = result.results[0].address_components[i].long_name;
                                    break;
                                case 'administrative_area_level_1':
                                    R_lvl1 = result.results[0].address_components[i].long_name;
                                    break;
                                case 'country':
                                    R_countryL = result.results[0].address_components[i].long_name;
                                    R_countryS = result.results[0].address_components[i].short_name;
                                    break;
                                case 'locality':
                                    R_locality = result.results[0].address_components[i].long_name;
                                    break;

                            }
                        }
                        //organize the information
                        toLocalityLvl2 = toLocalityLocality = toLocalityRoute = '';

                        if (R_countryL !== undefined) {
                            document.getElementById('Country').value = R_countryL;
                            document.querySelector('#Country').className += " suggested";

                        }
                        if (R_lvl1 !== undefined) {
                            document.getElementById('State').value = R_lvl1;
                            document.querySelector('#State').className += " suggested";

                        }
                        if (R_lvl2 !== undefined && R_lvl2 !== '') {
                            toLocalityLvl2 = R_lvl2 + ', ';
                        }
                        if (R_locality !== undefined && R_locality !== R_lvl2 && R_locality !== '') {
                            toLocalityLocality = R_locality + ', ';
                        }
                        if (R_routeL !== undefined && R_routeL !== '') {
                            toLocalityRoute = R_routeL;
                        }
                        if (R_routeS !== undefined && R_routeL !== R_routeS && R_routeS !== '') {
                            toLocalityRoute += ' (' + R_routeS + '), ';
                        } else if (toLocalityRoute !== '') {
                            toLocalityRoute += ', ';
                        };

                        //get the distance to the nearest town

                        console.log("http://api.geonames.org/findNearbyPlaceNameJSON?lat=" + encodeURI(document.getElementById('Latitude').value) + '&lng=' + encodeURI(document.getElementById('Longitude').value) + '&username=USER&radius=10')

                        var requestNT = new XMLHttpRequest();
                        requestNT.open("GET", "http://api.geonames.org/findNearbyPlaceNameJSON?lat=" + encodeURI(document.getElementById('Latitude').value) + '&lng=' + encodeURI(document.getElementById('Longitude').value) + '&username=USER&radius=10', true);
                        requestNT.onreadystatechange = function () {
                            //load response file
                            if (requestNT.readyState == 4) {
                                if (requestNT.status == 200 || requestNT.status == 0) {

                                    var result = JSON.parse(requestNT.responseText);

                                    var hiddenRows;
                                    var table = document.getElementById('towns_pseudoscreen_table');
                                    while (table.rows[0]) table.deleteRow(0);

                                    for (var i = 0; i < result.geonames.length; i++) {

                                        //console.log(result.geonames[i]);
                                        var row = table.insertRow(i);
                                        var firstColTowns = row.insertCell(0);
                                        firstColTowns.className = 'oConfig TownsfirstCol Townsclickable';
                                        firstColTowns.setAttribute("data-lat", result.geonames[i].lat);
                                        firstColTowns.setAttribute("data-lng", result.geonames[i].lng);
                                        firstColTowns.setAttribute("data-distance", parseFloat(result.geonames[i].distance).toFixed(1));
                                        firstColTowns.setAttribute("data-name", result.geonames[i].name);
                                        if (result.geonames[i].population > 500) {
                                            firstColTowns.innerHTML = '<b>' + result.geonames[i].name + '</b> (' + parseFloat(result.geonames[i].distance).toFixed(1) + ' km)';
                                        } else {
                                            firstColTowns.innerHTML = result.geonames[i].name + ' (' + parseFloat(result.geonames[i].distance).toFixed(1) + ' km)';
                                        };

                                    }

                                    var TownRows = document.getElementsByClassName('Townsclickable');
                                    var TownRowsLength = TownRows.length;
                                    for (var i = 0; i < TownRowsLength; i++) {
                                        TownRows[i].addEventListener('click', addTownToLocation, false);
                                    };


                                    //show pseudoscreen and wait for action
                                    if (TownRowsLength > 0) {
                                        setScreen('inTowns');
                                    } else { buildOutputLocation(); }

                                } else { buildOutputLocation(); }
                            }
                        }

                        requestNT.send();
                        //end get nearest town


                    } else if (requestGM.status == 404) {
                        // navigator.notification.alert('Google Maps API does not answer, verify the Internet access and try again', function () { }, 'Information');
                    }


                }
            }
            //console.log("asking");
            requestGM.send();
            //hide search icon and show wait
            document.getElementById('searchLocation').disabled = true;
            document.querySelector('#waitsearchLocationImg').style.display = 'inline';
            document.querySelector('#searchLocationImg').style.display = 'none';
        } else {
            navigator.notification.alert('To search any location, latitude and longitude cannot be empty', function () { }, 'Information');
        }
    };


    //PERFORM THE ACTION WHEN A TOWN IS CLICKED
    function addTownToLocation() {
        //get data embedded from selected row
        var selectedlat = this.getAttribute('data-lat');
        var selectedlng = this.getAttribute('data-lng');
        //var selecteddistance = (this.getAttribute('data-distance') != false && this.getAttribute('data-distance') + ' km ' || '');
        selectedname = (this.getAttribute('data-name') != false && this.getAttribute('data-name') + '.' || '');

        //measure distance by car
        if (selectedlat !== '' && selectedlng !== '') {

            //get cardinal point
            var lat2 = document.getElementById('Latitude').value;
            var lon2 = document.getElementById('Longitude').value;
            var lat1 = selectedlat;
            var lon1 = selectedlng;

            lat1 = lat1 * Math.PI / 180;
            lat2 = lat2 * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var y = Math.sin(dLon) * Math.cos(lat2);
            var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

            var bearing = Math.atan2(y, x) * 180 / Math.PI;
            if (bearing < 0) {
                bearing = bearing + 360;
            }

            bearing = bearing.toFixed(0);
            //console.log(getCardinal(bearing));
            cardinal = getCardinal(bearing) + ' of '

            //end cardinal point

            // console.log("https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + encodeURI(document.getElementById('Latitude').value) + ',' + encodeURI(document.getElementById('Longitude').value) + '&destinations=' + encodeURI(selectedlat) + ',' + encodeURI(selectedlng) + '&mode=driving&language=en&key=KEY')

            var requestDistance = new XMLHttpRequest();
            requestDistance.open("GET", "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + encodeURI(document.getElementById('Latitude').value) + ',' + encodeURI(document.getElementById('Longitude').value) + '&destinations=' + encodeURI(selectedlat) + ',' + encodeURI(selectedlng) + '&mode=driving&language=en&key=KEY', true);
            requestDistance.onreadystatechange = function () {
                //load response file
                if (requestDistance.readyState == 4) {
                    if (requestDistance.status == 200 || requestDistance.status == 0) {

                        var result = JSON.parse(requestDistance.responseText);
                        //console.log(result);
                        //console.log(result.rows[0].elements[0].distance.text);
                        distanceBycar = (result.rows[0].elements[0].distance.text != undefined && result.rows[0].elements[0].distance.text + ' ' || '');
                        
                        // buildOutputLocation();

                    }  // else { buildOutputLocation(); } 
                }  
            }
            requestDistance.send();
        

        // window.alert(toLocalityLvl2 + toLocalityLocality + toLocalityRoute + distanceBycar + cardinal + selectedname)
        // put info in box BUG: this has a problem and it will print the last part of the distance if there is not info check map api
        
        // if (distanceBycar != ""){

        // buildOutputLocation();

        // }

        };


        //end measure distance by car and put all stuff in input

        setScreen('inRegistration');

        

    }

    //WRITE THE LOCATION AS IT
    function buildOutputLocation() {
        //build output
        var toLocality = toLocalityLvl2 + toLocalityLocality + toLocalityRoute + distanceBycar + cardinal + selectedname;

        //confirm or not changes
        if (document.getElementById('Locality').value == '') {
            document.getElementById('Locality').value = toLocality;
            document.querySelector('#Locality').className += " suggested";

        } else {
            navigator.notification.confirm('Do you want to replace the current locality for the next one? \n\n' + toLocality, function (button) {
                if (button == 1) {
                    document.getElementById('Locality').value = toLocality;
                    document.querySelector('#Locality').className += " suggested";

                }
            }, 'Confirmation');
        }
    };


    //DEGREE TO CARDINAL
    function getCardinal(deg) {
        if (deg >= 22.5 && deg < 67.5) {
            return "NE";
        } else if (deg >= 67.5 && deg < 112.5) {
            return "E";
        } else if (deg >= 112.5 && deg < 157.5) {
            return "SE";
        } else if (deg >= 157.5 && deg < 202.5) {
            return "S";
        } else if (deg >= 202.5 && deg < 247.5) {
            return "SW";
        } else if (deg >= 247.5 && deg < 292.5) {
            return "W";
        } else if (deg >= 292.5 && deg < 337.5) {
            return "NW";
        } else {
            return "N";
        }
    };


    //CHECK FOR THE FIRST EXECUTION
    function firstExe() {
        var firstTime = window.localStorage.getItem('firstTime');
        if (firstTime === null) {
            //set initial settings aka default
            window.localStorage.setItem('firstTime', false);
            setDefaultSettings();
        } else {
            //load settings
            loadSavedSettings();
        };
    }




    //PUT DEFAULT SETTINGS
    function setDefaultSettings() {
        localStorage.setItem('autoGPS', 1);
        localStorage.setItem('autoLocation', 1);
        localStorage.setItem('timeoutGPS', 15);
        localStorage.setItem('experimentalGallery', 0);
        loadSavedSettings();
        //console.log('Settings to default');
    };



    //PUT DEFAULT SETTINGS
    function saveCurrentSetting() {
        if (document.getElementById('autoGPS').checked) {
            localStorage.setItem('autoGPS', 1);
        } else {
            localStorage.setItem('autoGPS', 0);
        }

        if (document.getElementById('autoLocation').checked) {
            localStorage.setItem('autoLocation', 1);
        } else {
            localStorage.setItem('autoLocation', 0);
        }

        if (document.getElementById('experimentalGallery').checked) {
            localStorage.setItem('experimentalGallery', 1);
        } else {
            localStorage.setItem('experimentalGallery', 0);
        }

        localStorage.setItem('timeoutGPS', document.getElementById('timeoutGPS').value)

        loadSavedSettings();

    };



    //LOAD SAVED SETTINGS
    //vars to memory and checkboxcontrol
    function loadSavedSettings() {
        autoGPS = localStorage.getItem('autoGPS');
        if (autoGPS == 1) {
            document.getElementById('autoGPS').checked = 1;
        } else {
            document.getElementById('autoGPS').checked = 0;
        }

        autoLocation = localStorage.getItem('autoLocation');
        if (autoLocation == 1) {
            document.getElementById('autoLocation').checked = 1;
        } else {
            document.getElementById('autoLocation').checked = 0;
        }

        experimentalGallery = localStorage.getItem('experimentalGallery');
        if (experimentalGallery == 1) {
            document.getElementById('experimentalGallery').checked = 1;
            document.querySelector('#toPhotos').style.display = 'inline';

        } else {
            document.getElementById('experimentalGallery').checked = 0;
            document.querySelector('#toPhotos').style.display = 'none';
        }

        timeoutGPS = Number(localStorage.getItem('timeoutGPS')) * 1000;
        document.getElementById('timeoutGPS').value = Number(localStorage.getItem('timeoutGPS'));


    };



    //GENERAL FUNCTION TO CALL ANDROID SPEECH RECOGNITION SYSTEM
    function recognizeSpeech(id) {
        var idTextBox = id;
        var maxMatches = 1;
        var promptString = "Speak now";
        //var language = "en-US";                     // optional
        window.plugins.speechrecognizer.startRecognize(function (result) {
            //console.log(result);
            document.getElementById(id).value += result + '. ';
        }, function (errorMessage) {
            console.log("Error message: " + errorMessage);
            //    }, maxMatches, promptString, language);
        }, maxMatches, promptString);
    }


    //VERIFY SOME NOTIFICATION FROM WEB
    function webnotification() {
        var globalVersion = "2.5"
        var request = new XMLHttpRequest();
        request.open("GET", "http://camayal.info/colector_notificator/" + globalVersion, true);
        request.onreadystatechange = function () {
            //load response file
            console.log(request);
            if (request.readyState == 4) {
                if (request.status == 200 || request.status == 0) {
                    if (request.responseText.includes("ColectoR")) {
                        alert(request.responseText);
                    }
                }
            }
        }
        request.send();
    }


})();
