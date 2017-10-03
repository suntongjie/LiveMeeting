

function listButton_Click() {
    if (document.getElementById("connectControls").style.display == 'none') {
        document.getElementById("connectControls").style.display = 'block';
    } else {
        document.getElementById("connectControls").style.display = 'none';
    }
}

var personMap = null;
var markerArray = [];

function initMap() {
    let uluru = {lat: 25.0782782, lng: 121.537494};

    personMap = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: uluru
    });

    if ("geolocation" in navigator) {
        //geolocation is available
        navigator.geolocation.getCurrentPosition(function(position) {
            let center = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            //do_something(position.coords.latitude, position.coords.longitude);
            personMap.setCenter(center)

            let marker = new google.maps.Marker({
                position: center,
                title: "123456",
                label: {text: "123456", color: "#5151A2",  fontSize: "18px", fontWeight: "bold"},
                map: personMap
            });
            markerArray.push(marker);
        });
    } else {
        //geolocation IS NOT available
    }

    window.setInterval(function() {
        console.log("timer...");
        if (personMap != null) {
            while(markerArray.length){
                markerArray.pop().setMap(null);
            }
        }
    }, 10000);
}


var selfEasyrtcid = "";
var searchParams = null;

function connect() {
    searchParams = new URLSearchParams(location.search);
    //window.alert(searchParams.get("user") + ", " + searchParams.get("room"));

    // user name
    if (searchParams.get("user") != null) {
        easyrtc.setUsername(searchParams.get("user"));        
    }

    // room
    if (searchParams.get("room") != null) {
        easyrtc.joinRoom(searchParams.get("room"), null, null, null);
    }

    // hide recordButtons
    if (searchParams.get("hideRecord") == "y") {
        document.getElementById("recordButtons").style.display = 'none';
    } else {
        document.getElementById("recordButtons").style.display = 'block';
    }

    
    if( !easyrtc.supportsRecording()) {
       //window.alert("This browser does not support recording. Try chrome or firefox.");
       document.getElementById("recordButtons").style.display = 'none';
    } else {
        if( easyrtc.isRecordingTypeSupported("h264")) document.getElementById("useH264").disabled = false;
        if( easyrtc.isRecordingTypeSupported("vp9")) document.getElementById("useVP9").disabled = false;
        if( easyrtc.isRecordingTypeSupported("vp8")) document.getElementById("useVP8").disabled = false;
    }

    easyrtc.setVideoDims(640,480);
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.easyApp("easyrtc.audioVideoSimple", "selfVideo", ["callerVideo"], loginSuccess, loginFailure);

 }


function clearConnectList() {
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
}


function convertListToButtons (roomName, data, isPrimary) {
    document.getElementById("roomname").innerHTML = "Room: " + roomName;
    clearConnectList();
    var otherClientDiv = document.getElementById('otherClients');
    for(var easyrtcid in data) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            };
        }(easyrtcid);

        var label = document.createTextNode(easyrtc.idToName(easyrtcid));
        button.appendChild(label);
        otherClientDiv.appendChild(button);

        let br = document.createElement("br");
        otherClientDiv.appendChild(br);
    }
}


function performCall(otherEasyrtcid) {
    easyrtc.hangupAll();
    var successCB = function() { };
    var failureCB = function() {};
    easyrtc.call(otherEasyrtcid, successCB, failureCB);
}


function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    if (easyrtc.username == null) {
        document.getElementById("iam").innerHTML = "I am \"" + easyrtc.cleanId(easyrtcid) + "\".";
    } else {
        document.getElementById("iam").innerHTML = "I am \"" + easyrtc.username + "\". (" + easyrtc.cleanId(easyrtcid) + ")";
    }
    document.getElementById("startRecording").disabled = false;
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}


var selfRecorder = null;
var callerRecorder = null;

function startRecording() {
    var selfLink = document.getElementById("selfDownloadLink");
    selfLink.innerText = "";

    selfRecorder = easyrtc.recordToFile( easyrtc.getLocalStream(), 
               selfLink, "selfVideo");
    if( selfRecorder ) {
       document.getElementById("startRecording").disabled = true;
       document.getElementById("stopRecording").disabled = false;
    }
    else {
       window.alert("failed to start recorder for self");
       return;
    }

    var callerLink = document.getElementById("callerDownloadLink");
    callerLink.innerText = "";

    if( easyrtc.getIthCaller(0)) {
       callerRecorder = easyrtc.recordToFile(
           easyrtc.getRemoteStream(easyrtc.getIthCaller(0), null), 
             callerLink, "callerVideo");
       if( !callerRecorder ) {
          window.alert("failed to start recorder for caller");
       }
    }
    else {
       callerRecorder = null;
    }
}


function endRecording() {
    if( selfRecorder ) {
       selfRecorder.stop();
    }
    if( callerRecorder ) {
       callerRecorder.stop();
    }
    document.getElementById("startRecording").disabled = false;
    document.getElementById("stopRecording").disabled = true;
}