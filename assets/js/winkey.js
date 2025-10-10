// Lets see if CW is selected
const ModeSelected = document.getElementById('mode');

$('#winkey_buttons').hide();

if (location.protocol !== 'https:') {
    // Do something if the page is being served over HTTP
    $('#winkey').hide(); // Hide the CW buttons
}

function toggleWinkeyVisibility() {
    const winkeyElement = document.getElementById('winkey');
    if (ModeSelected && winkeyElement) {
        if (ModeSelected.value === 'CW') {
            $('#winkey').show();
        } else {
            $('#winkey').hide();
        }
    }
}

// Check initial mode
toggleWinkeyVisibility();

// Listen for mode changes
if (ModeSelected) {
    ModeSelected.addEventListener('change', toggleWinkeyVisibility);
}



let function1Name, function1Macro, function2Name, function2Macro, function3Name, function3Macro, function4Name, function4Macro, function5Name, function5Macro;

getMacros();

document.addEventListener('keydown', function(event) {

    if (event.key === 'F1') {
        event.preventDefault();
        morsekey_func1();
    }

    if (event.key === 'F2') {
        event.preventDefault();
        morsekey_func2();
    }

    if (event.key === 'F3') {
        event.preventDefault();
        morsekey_func3();
    }

    if (event.key === 'F4') {
        event.preventDefault();
        morsekey_func4();
    }

    if (event.key === 'F5') {
        event.preventDefault();
        morsekey_func5();
    }
  });

let sendText = document.getElementById("sendText");
let sendButton = document.getElementById("sendButton");
let receiveText = document.getElementById("receiveText");
let connectButton = document.getElementById("connectButton");
let statusBar = document.getElementById("statusBar");

//Couple the elements to the Events
connectButton.addEventListener("click", clickConnect)
sendButton.addEventListener("click", clickSend)
// statusButton.addEventListener("click", clickStatus)

//When the connectButton is pressed
async function clickConnect() {
    if (port) {
        //if already connected, disconnect
        disconnect();
        $('#winkey_buttons').hide();
    } else {
        //otherwise connect
        await connect();
        $('#winkey_buttons').show();
    }
}

//Define outputstream, inputstream and port so they can be used throughout the sketch
var outputStream, inputStream, port;

// Auto-reconnect functionality
async function autoReconnect() {
    try {
        // Get previously connected ports
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
            // Try to reconnect to the first available port
            port = ports[0];
            await port.open({ baudRate: 1200 });
            await port.setSignals({ dataTerminalReady: true });

            statusBar.innerText = "Auto-reconnected";
            connectButton.innerText = "Disconnect";

            let decoder = new TextDecoderStream();
            inputDone = port.readable.pipeTo(decoder.writable);
            inputStream = decoder.readable;

            const encoder = new TextEncoderStream();
            outputDone = encoder.readable.pipeTo(port.writable);
            outputStream = encoder.writable;
            
            writeToByte("0x00, 0x02");
            writeToByte("0x02, 0x00");

            $('#winkey_buttons').show();

            reader = inputStream.getReader();
            readLoop();
        }
    } catch (e) {
        console.log("Auto-reconnect failed:", e);
        // If auto-reconnect fails, just continue with normal flow
    }
}

// Call auto-reconnect when page loads
window.addEventListener('load', autoReconnect);
navigator.serial.addEventListener('connect', e => {
    statusBar.innerText = `Connected to ${e.port}`;
    connectButton.innerText = "Disconnect"
});
  
navigator.serial.addEventListener('disconnect', e => {
    statusBar.innerText = `Disconnected`;
    connectButton.innerText = "Connect"
});

let debug              = 0;
let speed              = 24;
let minSpeed           = 20;
let maxSpeed           = 40;

//Connect to the serial
async function connect() {

    //Optional filter to only see relevant boards
    const filter = {
        usbVendorId: 0x2341 // Arduino SA
    };

    //Try to connect to the Serial port
    try {
        port = await navigator.serial.requestPort(/*{ filters: [filter] }*/);
        // Continue connecting to |port|.

        // - Wait for the port to open.
        await port.open({ baudRate: 1200 });
        await port.setSignals({ dataTerminalReady: true });

        statusBar.innerText = "Connected";
        connectButton.innerText = "Disconnect"

        let decoder = new TextDecoderStream();
        inputDone = port.readable.pipeTo(decoder.writable);
        inputStream = decoder.readable;

        const encoder = new TextEncoderStream();
        outputDone = encoder.readable.pipeTo(port.writable);
        outputStream = encoder.writable;
        
        writeToByte("0x00, 0x02");
        writeToByte("0x02, 0x00");

        $('#winkey_buttons').show();

        reader = inputStream.getReader();
        readLoop();
    } catch (e) {
        //If the pipeTo error appears; clarify the problem by giving suggestions.
        if (e == "TypeError: Cannot read property 'pipeTo' of undefined") {
            e += "\n Use Google Chrome and enable-experimental-web-platform-features"
        }
        connectButton.innerText = "Connect"
        statusBar.innerText = e;
    }
}

//Write to the Serial port
async function writeToStream(line) {
    var enc = new TextEncoder(); // always utf-8
    
    const writer = outputStream.getWriter();
    writer.write(line);
    writer.releaseLock();
}

async function writeToByte(line) {
    const writer = outputStream.getWriter();
    const data = new Uint8Array([line]);
    writer.write(data);
    writer.releaseLock();
}

//Disconnect from the Serial port
async function disconnect() {

    if (reader) {
        await reader.cancel();
        await inputDone.catch(() => { });
        reader = null;
        inputDone = null;
    }
    if (outputStream) {
        await outputStream.getWriter().close();
        await outputDone;
        outputStream = null;
        outputDone = null;
    }
    statusBar.innerText = "Disconnected";
    connectButton.innerText = "Connect"
    //Close the port.
    if (port) {
        await port.close();
        port = null;
    }
}

//When the send button is pressed
function clickSend() {
    writeToStream(sendText.value);
    writeToStream("\r");
    
    //and clear the input field, so it's clear it has been sent
    sendText.value = "";

}

function morsekey_func1() {
    console.log("F1: " + UpdateMacros(function1Macro));
    writeToStream(UpdateMacros(function1Macro));
    //and clear the input field, so it's clear it has been sent
    sendText.value = "";
}

function morsekey_func2() {
    console.log("F2: " + UpdateMacros(function2Macro));
    writeToStream(UpdateMacros(function2Macro));
    //and clear the input field, so it's clear it has been sent
    sendText.value = "";
}

function morsekey_func3() {
    console.log("F3: " + UpdateMacros(function3Macro));
    writeToStream(UpdateMacros(function3Macro));
    //and clear the input field, so it's clear it has been sent
    sendText.value = "";
}

function morsekey_func4() {
    console.log("F4: " + UpdateMacros(function4Macro));
    writeToStream(UpdateMacros(function4Macro));
    //and clear the input field, so it's clear it has been sent
    sendText.value = "";
}

function morsekey_func5() {
    console.log("F5: " + UpdateMacros(function5Macro));
    writeToStream(UpdateMacros(function5Macro));
    //and clear the input field, so it's clear it has been sent
    sendText.value = "";
}



//Read the incoming data
async function readLoop() {
    while (true) {
        const { value, done } = await reader.read();
        if (done === true){
            break;
        }

        console.log(value);
        //When recieved something add it to the big textarea
        receiveText.value += value;
        //Scroll to the bottom of the text field
        receiveText.scrollTop = receiveText.scrollHeight;
    }
}

function closeModal() {
	var container = document.getElementById("modals-here")
	var backdrop = document.getElementById("modal-backdrop")
	var modal = document.getElementById("modal")

	modal.classList.remove("show")
	backdrop.classList.remove("show")

    getMacros();

	setTimeout(function() {
		container.removeChild(backdrop)
		container.removeChild(modal)
	}, 200)
}

function UpdateMacros(macrotext) { 

    // Get the values from the form set to uppercase
    let CALL = document.getElementById("callsign").value.toUpperCase();
    let RSTS = document.getElementById("rst_sent").value;

    let newString;
    newString = macrotext.replace(/\[MYCALL\]/g, my_call);
    newString = newString.replace(/\[CALL\]/g, CALL);
    newString = newString.replace(/\[RSTS\]/g, RSTS);
    console.log(newString);
    return newString;
}

// Call url and store the returned json data as variables
function getMacros() {
    fetch(base_url + 'index.php/qso/cwmacros_json')
    .then(response => {
        if (!response.ok) {
            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // Handle case where no macros are saved yet
        if (data.status === 'not found') {
            // Set default values
            function1Name = 'CQ';
            function1Macro = 'CQ CQ CQ DE [MYCALL] [MYCALL] K';
            function2Name = 'REPT';
            function2Macro = '[CALL] DE [MYCALL] [RSTS] [RSTS] K';
            function3Name = 'TU';
            function3Macro = '[CALL] TU 73 DE [MYCALL] K';
            function4Name = 'QRZ';
            function4Macro = 'QRZ DE [MYCALL] K';
            function5Name = 'TEST';
            function5Macro = 'TEST DE [MYCALL] K';
        } else {
            // Use saved values or defaults if empty
            function1Name = data.function1_name || 'F1';
            function1Macro = data.function1_macro || '';
            function2Name = data.function2_name || 'F2';
            function2Macro = data.function2_macro || '';
            function3Name = data.function3_name || 'F3';
            function3Macro = data.function3_macro || '';
            function4Name = data.function4_name || 'F4';
            function4Macro = data.function4_macro || '';
            function5Name = data.function5_name || 'F5';
            function5Macro = data.function5_macro || '';
        }

        // Update button labels
        const morsekey_func1_Button = document.getElementById('morsekey_func1');
        if (morsekey_func1_Button) {
            morsekey_func1_Button.textContent = 'F1 (' + function1Name + ')';
        }

        const morsekey_func2_Button = document.getElementById('morsekey_func2');
        if (morsekey_func2_Button) {
            morsekey_func2_Button.textContent = 'F2 (' + function2Name + ')';
        }

        const morsekey_func3_Button = document.getElementById('morsekey_func3');
        if (morsekey_func3_Button) {
            morsekey_func3_Button.textContent = 'F3 (' + function3Name + ')';
        }
        
        const morsekey_func4_Button = document.getElementById('morsekey_func4');
        if (morsekey_func4_Button) {
            morsekey_func4_Button.textContent = 'F4 (' + function4Name + ')';
        }

        const morsekey_func5_Button = document.getElementById('morsekey_func5');
        if (morsekey_func5_Button) {
            morsekey_func5_Button.textContent = 'F5 (' + function5Name + ')';
        }
    })
    .catch(error => {
        console.error('Error loading CW macros:', error);
    });
}
