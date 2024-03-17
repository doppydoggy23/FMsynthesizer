"use strict";

/*
This code belongs to pubic domain (2023)
*/

function initializeUI() {

    window.myAudioContext=null;
    window.signalProcessor=null;
    window.isSoundTestRunning=false;

    document.addEventListener("keydown", (event) => {
        if (event.repeat) // avoid repeated keystrokes
            return;
        keyPressed(event.keyCode);
        // do something
      });
    document.addEventListener("keyup", (event) => {
        if (event.repeat)
            return;
        keyReleased(event.keyCode);
        // do something
      });

    
}

// called when download wav button is pressed
function downloadWAV() {

    window.oldC1Amplitude=0; // reset the value of M1 selfmodulation
    let formulaValues=checkForValidValues();
    //document.getElementById("docfooter").innerHTML="dfsdf";

    if ((formulaValues.Algorithm!="Algorithm1")&&(formulaValues.Algorithm!="Algorithm2")
        &&(formulaValues.Algorithm!="Algorithm3")&&(formulaValues.Algorithm!="Algorithm4")
        &&(formulaValues.Algorithm!="Algorithm5")&&(formulaValues.Algorithm!="Algorithm6")
        &&(formulaValues.Algorithm!="Algorithm7")&&(formulaValues.Algorithm!="Algorithm8")
        )
        throw "Unsupported Algorithm downloadWAV()";

    let totalSampleTime=formulaValues.Attack+formulaValues.Decay+formulaValues.Sustain+formulaValues.Release;
    if (totalSampleTime<=0) 
        return;


    let wav = new wavefile.WaveFile();

    let myInt16Array = new Int16Array(44100*totalSampleTime);
    for (let i=0; i<myInt16Array.length; i++) {

        let t=i/44100;

        let smpl=getFMAmplitudeFor(formulaValues, t); // gets the amplitude [0..1] for the given time i
        smpl*=getWaveScaleFor(formulaValues, t); // multiplies it for a scale to give the wave the shape according to attack, sustain and release times //ToDo: check this
        smpl=Math.floor(smpl*32766); // convert it to 16 bit signed integers
        myInt16Array[i]=smpl;
    }

    // Create a mono wave file, 44.1 kHz, 16-bit
    wav.fromScratch(1, 44100, '16', myInt16Array);

    // create the file
    var blob = new Blob([wav.toBuffer()], {type: "audio/wav"});
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    var fileName = "sound.wav";
    link.download = fileName;
    link.click();
}

// called when play sound button is pressed
function playSound() {
    window.oldC1Amplitude=0;  // reset the value of M1 selfmodulation
    let formulaValues=checkForValidValues();
    //document.getElementById("docfooter").innerHTML="dfsdf";

    if ((formulaValues.Algorithm!="Algorithm1")&&(formulaValues.Algorithm!="Algorithm2")
        &&(formulaValues.Algorithm!="Algorithm3")&&(formulaValues.Algorithm!="Algorithm4")
        &&(formulaValues.Algorithm!="Algorithm5")&&(formulaValues.Algorithm!="Algorithm6")
        &&(formulaValues.Algorithm!="Algorithm7")&&(formulaValues.Algorithm!="Algorithm8")
        )
        throw "Unsupported Algorithm playSound()";

    let totalSampleTime=formulaValues.Attack+formulaValues.Decay+formulaValues.Sustain+formulaValues.Release;
    if (totalSampleTime<=0) 
        return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // 
    const myArrayBuffer = audioCtx.createBuffer(
    2,
    audioCtx.sampleRate*totalSampleTime,
    audioCtx.sampleRate
    );

    // Fill the buffer with sound;
    // just values between -1.0 and 1.0
    for (let channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
        // This gives us the actual array that contains the data
        const nowBuffering = myArrayBuffer.getChannelData(channel);
        for (let i = 0; i < myArrayBuffer.length; i++) {
            let t=i/audioCtx.sampleRate;
            //let minC1=Math.max(formulaValues.C1, 1);
            //let shiftingRatio=(440/minC1); // adjust the timing to always play a note A
            nowBuffering[i]=getFMAmplitudeFor(formulaValues, t); // gets the amplitude [0..1] for the given time t
            nowBuffering[i]*=getWaveScaleFor(formulaValues, t); // multiplies it for a scale to give the wave the shape according to attack, sustain and release times
        }
    }

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    const source = audioCtx.createBufferSource();

    // set the buffer in the AudioBufferSourceNode
    source.buffer = myArrayBuffer;

    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    source.connect(audioCtx.destination);

    // start the source playing
    source.start();

}

// applies the wave shape functions (volume levels) returns [0..1]
// if you change this function, you must modify the equivalent function in micro-sound-processor.js
function getWaveScaleFor (formulaValues, t) {

    if( (formulaValues.Attack>0)&& ((t>=0)&&(t<=formulaValues.Attack)) ) {
        return (1/formulaValues.Attack)*t;
    }

    if( (formulaValues.Decay>0)&& ((t>=formulaValues.Attack)&&(t<=(formulaValues.Attack+formulaValues.Decay))) ) {
        return ( 1- (((1-formulaValues.SustainVolume)/formulaValues.Decay)*(t-formulaValues.Attack)) );
    }

    if( (formulaValues.Sustain>0)&& ((t>=(formulaValues.Attack+formulaValues.Decay))&&(t<=(formulaValues.Attack+formulaValues.Decay+formulaValues.Sustain))) ) {
        //console.log("sustain");
        return formulaValues.SustainVolume;
    }

    if( (formulaValues.Release>0)&& ((t>=(formulaValues.Attack+formulaValues.Decay+formulaValues.Sustain))&&(t<=(formulaValues.Attack+formulaValues.Decay+formulaValues.Sustain+formulaValues.Release))) ) {
        return ( formulaValues.SustainVolume-((formulaValues.SustainVolume/formulaValues.Release)*(t-formulaValues.Attack-formulaValues.Decay-formulaValues.Sustain)) );
    }

    return 0;
}

/*
this is the function you have to modify to add new algorithms. Unfortunately you also have to modify the matching function in the test-sound-processor.js. and midi-sound-processor.js. That's how JS works :(
*/
function getFMAmplitudeFor (formulaValues, t) {
    if (formulaValues.Algorithm=="Algorithm1")  {
        // Modulator M1 modulates C1
        return formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (formulaValues.D1*Math.sin(2*Math.PI*formulaValues.M1*t)) );
        }

    if (formulaValues.Algorithm=="Algorithm2")  {
        // Modulator M2 modulates modulator M1 that modulates C1    
        let M1Ampl= 1 * Math.sin( (2*Math.PI*formulaValues.M1*t) + (formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*t)) );
        return formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (formulaValues.D1*M1Ampl) );
    }

    if (formulaValues.Algorithm=="Algorithm3")  {
        // Modulator M3 modulates modulator M2 that modulates modulator M1 that modulates C1    
        let M2Ampl= 1 * Math.sin( (2*Math.PI*formulaValues.M2*t) + (formulaValues.D3*Math.sin(2*Math.PI*formulaValues.M3*t)) );
        let M1Ampl= 1 * Math.sin( (2*Math.PI*formulaValues.M1*t) + (formulaValues.D2*M2Ampl) );
        return formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (formulaValues.D1*M1Ampl) );
        
    }

    if (formulaValues.Algorithm=="Algorithm4")  {
        // Modulator M3,  modulator M2 and Modulator M1 modulate all C1    
        let M1A=formulaValues.D1*Math.sin(2*Math.PI*formulaValues.M1*t);
        let M2A=formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*t);
        let M3A=formulaValues.D3*Math.sin(2*Math.PI*formulaValues.M3*t);
        return formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (M1A+M2A+M3A) );
    }

    if (formulaValues.Algorithm=="Algorithm5")  {
        // Modulator M2 modulates modulator M1 that modulates Carrier 1 and Modulator M4 modulates modulator M3 that modulates carrier 2
        let M1Ampl= 1 * Math.sin( (2*Math.PI*formulaValues.M1*t) + (formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*t)) );
        let C1Ampl=formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (formulaValues.D1*M1Ampl) );
        let M3Ampl= 1 * Math.sin( (2*Math.PI*formulaValues.M3*t) + (formulaValues.D4*Math.sin(2*Math.PI*formulaValues.M4*t)) );
        let C2Ampl=formulaValues.A2*Math.sin( (2*Math.PI*formulaValues.C2*t) + (formulaValues.D3*M3Ampl) );

        return (C1Ampl+C2Ampl)/2;
    }

    if (formulaValues.Algorithm=="Algorithm6")  {
        // Modulator M2 modulates modulator M1 that modulates Carrier 1, and Modulator M3 modulates carrier C2, and Modulator M4 modulates carrier C3
        let M1Ampl= 1 * Math.sin( (2*Math.PI*formulaValues.M1*t) + (formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*t)) );
        let C1Ampl=formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (formulaValues.D1*M1Ampl) );
        let C2Ampl=formulaValues.A2*Math.sin( (2*Math.PI*formulaValues.C2*t) + (formulaValues.D3*Math.sin(2*Math.PI*formulaValues.M3*t)) );
        let C3Ampl=formulaValues.A3*Math.sin( (2*Math.PI*formulaValues.C3*t) + (formulaValues.D4*Math.sin(2*Math.PI*formulaValues.M4*t)) );

        return (C1Ampl+C2Ampl+C3Ampl)/3;
    }

    if (formulaValues.Algorithm=="Algorithm7")  {
        // Modulator M2 modulates modulator M1 and Modulator M4 modulates modulator M3, and M1 and M3 modulates carrier C1
        let M1Ampl= 1 * Math.sin( (2*Math.PI*formulaValues.M1*t) + (formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*t)) );
        let M3Ampl= 1 * Math.sin( (2*Math.PI*formulaValues.M3*t) + (formulaValues.D4*Math.sin(2*Math.PI*formulaValues.M4*t)) );

        return formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (formulaValues.D1*M1Ampl)+(formulaValues.D3*M3Ampl) );
    }

    if (formulaValues.Algorithm=="Algorithm8")  {
        // Modulator M1 modulates itself and Carrier C1
        let M1Ampl= formulaValues.D1 * Math.sin( (2*Math.PI*formulaValues.M1*t) + (formulaValues.D1*window.oldC1Amplitude) );
        window.oldC1Amplitude=M1Ampl; // we need the old value of M1 Amplitude to get the next new value

        return formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (formulaValues.D1*M1Ampl) );
    }
}

// min, max and default values for M, A, C y D values
const GlobalConstants = {
    MMin:0,
    MMax:5000,
    MDefault:100,

    AMin:0,
    ADefault:1,
    AMax:1,

    CMin:0,
    CDefault:100,
    CMax:5000,

    DMin:0,
    DDefault:1,
    DMax:1000,
};

/*
Checks that all form values are correct, and if not, corrects them
*/
function checkForValidValues() {
    const M1Min=GlobalConstants.MMin;
    const M1Max=GlobalConstants.MMax;
    const M1Default=GlobalConstants.MDefault;

    const A1Min=GlobalConstants.AMin;
    const A1Default=GlobalConstants.ADefault;
    const A1Max=GlobalConstants.AMax;

    const C1Min=GlobalConstants.CMin;
    const C1Default=GlobalConstants.CDefault;
    const C1Max=GlobalConstants.CMax;

    const D1Min=GlobalConstants.DMin;
    const D1Default=GlobalConstants.DDefault;
    const D1Max=GlobalConstants.DMax;

    //M1 Values
    let M1Value=parseInt(document.getElementById("M1").value);
    if (isNaN(M1Value)) {
        document.getElementById("M1").value=""+M1Default;
        M1Value=M1Default;
    }
    if (M1Value<M1Min) {
        document.getElementById("M1").value=""+M1Min;
        M1Value=M1Min;
    }
    if (M1Value>M1Max) {
        document.getElementById("M1").value=""+M1Max;
        M1Value=M1Max;
    }

    //A1 Values
    let A1Value=parseFloat(document.getElementById("A1").value);

    //A2 Values
    let A2Value=parseFloat(document.getElementById("A2").value);

    //A1 Values
    let A3Value=parseFloat(document.getElementById("A3").value);

    //C1 Values
    let C1Value=parseInt(document.getElementById("C1").value);
    if (isNaN(C1Value)) {
        document.getElementById("C1").value=""+C1Default;
        C1Value=C1Default;
    }
    if (C1Value<C1Min) {
        document.getElementById("C1").value=""+C1Min;
        C1Value=C1Min;
    }
    if (C1Value>C1Max) {
        document.getElementById("C1").value=""+C1Max;
        C1Value=C1Max;
    }

    //C2 Values
    let C2Value=parseInt(document.getElementById("C2").value);
    if (isNaN(C2Value)) {
        document.getElementById("C2").value=""+C1Default;
        C2Value=C1Default;
    }
    if (C2Value<C1Min) {
        document.getElementById("C2").value=""+C1Min;
        C2Value=C1Min;
    }
    if (C2Value>C1Max) {
        document.getElementById("C2").value=""+C1Max;
        C2Value=C1Max;
    }

    //C3 Values
    let C3Value=parseInt(document.getElementById("C3").value);
    if (isNaN(C3Value)) {
        document.getElementById("C3").value=""+C1Default;
        C3Value=C1Default;
    }
    if (C3Value<C1Min) {
        document.getElementById("C3").value=""+C1Min;
        C3Value=C1Min;
    }
    if (C3Value>C1Max) {
        document.getElementById("C3").value=""+C1Max;
        C3Value=C1Max;
    }

    //D1 Values
    let D1Value=parseFloat(document.getElementById("D1").value);
    if (isNaN(D1Value)) {
        document.getElementById("D1").value=""+D1Default;
        D1Value=D1Default;
    }
    if (D1Value<D1Min) {
        document.getElementById("D1").value=""+D1Min;
        D1Value=D1Min;
    }
    if (D1Value>D1Max) {
        document.getElementById("D1").value=""+D1Max;
        D1Value=D1Max;
    }

    //D2 Values
    let D2Value=parseFloat(document.getElementById("D2").value);
    if (isNaN(D2Value)) {
        document.getElementById("D2").value=""+D1Default;
        D2Value=D1Default;
    }
    if (D2Value<D1Min) {
        document.getElementById("D2").value=""+D1Min;
        D2Value=D1Min;
    }
    if (D2Value>D1Max) {
        document.getElementById("D2").value=""+D1Max;
        D2Value=D1Max;
    }

    //M2 Values
    let M2Value=parseInt(document.getElementById("M2").value);
    if (isNaN(M2Value)) {
        document.getElementById("M2").value=""+M1Default;
        M2Value=M1Default;
    }
    if (M2Value<M1Min) {
        document.getElementById("M2").value=""+M1Min;
        M2Value=M1Min;
    }
    if (M2Value>M1Max) {
        document.getElementById("M2").value=""+M1Max;
        M2Value=M1Max;
    }

    //D3 Values
    let D3Value=parseFloat(document.getElementById("D3").value);
    if (isNaN(D3Value)) {
        document.getElementById("D3").value=""+D1Default;
        D3Value=D1Default;
    }
    if (D3Value<D1Min) {
        document.getElementById("D3").value=""+D1Min;
        D3Value=D1Min;
    }
    if (D3Value>D1Max) {
        document.getElementById("D3").value=""+D1Max;
        D3Value=D1Max;
    }

    //M3 Values
    let M3Value=parseInt(document.getElementById("M3").value);
    if (isNaN(M3Value)) {
        document.getElementById("M3").value=""+M1Default;
        M3Value=M1Default;
    }
    if (M3Value<M1Min) {
        document.getElementById("M3").value=""+M1Min;
        M3Value=M1Min;
    }
    if (M3Value>M1Max) {
        document.getElementById("M3").value=""+M1Max;
        M3Value=M1Max;
    }

    //D4 Values
    let D4Value=parseFloat(document.getElementById("D4").value);
    if (isNaN(D4Value)) {
        document.getElementById("D4").value=""+D1Default;
        D4Value=D1Default;
    }
    if (D4Value<D1Min) {
        document.getElementById("D4").value=""+D1Min;
        D4Value=D1Min;
    }
    if (D4Value>D1Max) {
        document.getElementById("D4").value=""+D1Max;
        D4Value=D1Max;
    }

    //M4 Values
    let M4Value=parseInt(document.getElementById("M4").value);
    if (isNaN(M4Value)) {
        document.getElementById("M4").value=""+M1Default;
        M4Value=M1Default;
    }
    if (M4Value<M1Min) {
        document.getElementById("M4").value=""+M1Min;
        M4Value=M1Min;
    }
    if (M4Value>M1Max) {
        document.getElementById("M4").value=""+M1Max;
        M4Value=M1Max;
    }


    //Attack, Decay, sustain and release values
    let attackValue=parseFloat(document.getElementById("AttackSlider").value);
    let decayValue=parseFloat(document.getElementById("DecaySlider").value);
    let sustainValue=parseFloat(document.getElementById("SustainSlider").value);
    let sustainVolumeValue=parseFloat(document.getElementById("SustainVolumeSlider").value);
    let releaseValue=parseFloat(document.getElementById("ReleaseSlider").value);

        
    let selectedAlgorithm=document.getElementById("Algorithm").value;
    if ((selectedAlgorithm!="Algorithm1")&&(selectedAlgorithm!="Algorithm2")
    &&(selectedAlgorithm!="Algorithm3")&&(selectedAlgorithm!="Algorithm4")
    &&(selectedAlgorithm!="Algorithm5")&&(selectedAlgorithm!="Algorithm6")
    &&(selectedAlgorithm!="Algorithm7")&&(selectedAlgorithm!="Algorithm8")
    )
    throw "Unsupported Algorithm checkForValidValues()";

    return {
        Algorithm:selectedAlgorithm, 
        A1: A1Value, 
        C1: C1Value, 
        A2: A2Value, 
        C2: C2Value, 
        A3: A3Value, 
        C3: C3Value, 
        M1: M1Value, 
        D1: D1Value,
        M2: M2Value,
        D2: D2Value,
        M3: M3Value,
        D3: D3Value,
        M4: M4Value,
        D4: D4Value,
        Attack:attackValue,
        Decay: decayValue,
        Sustain: sustainValue,
        SustainVolume: sustainVolumeValue,
        Release: releaseValue
    };
}

/*
Function called when the algorithm list changes
*/
function AlgorithmListChange() {
    let selectedAlgorithm=document.getElementById("Algorithm").value;
    if (selectedAlgorithm=="Algorithm1") { //M1-C1
        document.getElementById("Modulator2Table").style.display = "none";
        document.getElementById("Modulator3Table").style.display = "none";
        document.getElementById("Modulator4Table").style.display = "none";
        document.getElementById("Carrier2Table").style.display = "none";
        document.getElementById("Carrier3Table").style.display = "none";
        document.getElementById("algopicdiv").innerHTML='<img src="algorithm1.png" alt="Algorithm 1" style="width:10%;height:10%;">';
    }
    if (selectedAlgorithm=="Algorithm2") { //M2-M1-C1
        document.getElementById("Modulator2Table").style.display = "initial";
        document.getElementById("Modulator3Table").style.display = "none";
        document.getElementById("Modulator4Table").style.display = "none";
        document.getElementById("Carrier2Table").style.display = "none";
        document.getElementById("Carrier3Table").style.display = "none";
        document.getElementById("algopicdiv").innerHTML='<img src="algorithm2.png" alt="Algorithm 2" style="width:10%;height:10%;">';
    }
    if (selectedAlgorithm=="Algorithm3") { // M3-M2-M1-C1
        document.getElementById("Modulator2Table").style.display = "initial";
        document.getElementById("Modulator3Table").style.display = "initial";
        document.getElementById("Modulator4Table").style.display = "none";
        document.getElementById("Carrier2Table").style.display = "none";
        document.getElementById("Carrier3Table").style.display = "none";
        document.getElementById("algopicdiv").innerHTML='<img src="algorithm3.png" alt="Algorithm 3" style="width:10%;height:10%;">';
    }
    if (selectedAlgorithm=="Algorithm4") { // M3,M2,M1,-C1
        document.getElementById("Modulator2Table").style.display = "initial";
        document.getElementById("Modulator3Table").style.display = "initial";
        document.getElementById("Carrier2Table").style.display = "none";
        document.getElementById("Carrier3Table").style.display = "none";
        document.getElementById("algopicdiv").innerHTML='<img src="algorithm4.png" alt="Algorithm 4" style="width:10%;height:10%;">';
    }
    if (selectedAlgorithm=="Algorithm5") { // M2-M1-C1 and M4-M3-C2
        document.getElementById("Modulator2Table").style.display = "initial";
        document.getElementById("Modulator3Table").style.display = "initial";
        document.getElementById("Modulator4Table").style.display = "initial";
        document.getElementById("Carrier2Table").style.display = "initial";
        document.getElementById("Carrier3Table").style.display = "none";
        document.getElementById("algopicdiv").innerHTML='<img src="algorithm5.png" alt="Algorithm 5" style="width:10%;height:10%;">';
    }
    if (selectedAlgorithm=="Algorithm6") { // M2-M1-C1 and M3-C2 and M4-C3
        document.getElementById("Modulator2Table").style.display = "initial";
        document.getElementById("Modulator3Table").style.display = "initial";
        document.getElementById("Modulator4Table").style.display = "initial";
        document.getElementById("Carrier2Table").style.display = "initial";
        document.getElementById("Carrier3Table").style.display = "initial";
        document.getElementById("algopicdiv").innerHTML='<img src="algorithm6.png" alt="Algorithm 6" style="width:10%;height:10%;">';
    }
    if (selectedAlgorithm=="Algorithm7") { // M4-M3,M2-M1,-C1
        document.getElementById("Modulator2Table").style.display = "initial";
        document.getElementById("Modulator3Table").style.display = "initial";
        document.getElementById("Modulator4Table").style.display = "initial";
        document.getElementById("Carrier2Table").style.display = "none";
        document.getElementById("Carrier3Table").style.display = "none";
        document.getElementById("algopicdiv").innerHTML='<img src="algorithm7.png" alt="Algorithm 7" style="width:10%;height:10%;">';
    }
    if (selectedAlgorithm=="Algorithm8") { //-M1-C1
        document.getElementById("Modulator2Table").style.display = "none";
        document.getElementById("Modulator3Table").style.display = "none";
        document.getElementById("Modulator4Table").style.display = "none";
        document.getElementById("Carrier2Table").style.display = "none";
        document.getElementById("Carrier3Table").style.display = "none";
        document.getElementById("algopicdiv").innerHTML='<img src="algorithm8.png" alt="Algorithm 8" style="width:10%;height:10%;">';
        window.oldC1Amplitude=0;
    }

    collectFormDataAndUpdateSignalProcessorValues();// update params of the signal processor if it is running
}

// constains the info sent via message to an audio signal processor
class AudioProcessorMessage {  
    audioTestStopRequested= false; // request audio signal processing to stop
    audioCtxSampleRate= -1;
    Algorithm=null;
    //M1
    M1=null; 
    D1=null;
    //C1
    A1=null;
    C1=null;
    //M2
    M2=null; 
    D2=null;
    //C2
    C2=null;
    A2=null;
    //M3
    M3=null; 
    D3=null;
    //C3
    C3=null;
    A3=null;
    //M4
    M4=null; 
    D4=null;


    constructor(formulaValues, extirreq, smplerate) { 
        
        if (formulaValues!=null) {
            //M1
            this.M1=formulaValues.M1; 
            this.D1=formulaValues.D1;
            //C1
            this.A1=formulaValues.A1;
            this.C1=formulaValues.C1;
            //M2
            this.M2=formulaValues.M2; 
            this.D2=formulaValues.D2;
            //C2
            this.C2=formulaValues.C2;
            this.A2=formulaValues.A2;
            //M3
            this.M3=formulaValues.M3; 
            this.D3=formulaValues.D3;
            //C3
            this.C3=formulaValues.C3;
            this.A3=formulaValues.A3;
            //M4
            this.M4=formulaValues.M4; 
            this.D4=formulaValues.D4;
            //
            this.Algorithm=formulaValues.Algorithm;
        }
        
        this.audioCtxSampleRate=smplerate;
        this.audioTestStopRequested=extirreq;    
    }  
}

// Stop button called
function stopTestClick() {

    if (window.isSoundTestRunning==false)
        return;

    if ((window.myAudioContext!=null)&&(window.signalProcessor!=null)) {

        let myAudioProcessorMessage =new AudioProcessorMessage(null, true, -1); // create a stop message
        //myAudioProcessorMessage.audioTestStopRequested= true; // request audio signal processing to stop
        //myAudioProcessorMessage.audioCtxSampleRate= -1;

        window.signalProcessor.port.postMessage(myAudioProcessorMessage); //send the stop message

        //clean
        window.myAudioContext.close();
        window.signalProcessor=null;
        window.myAudioContext=null;
        window.isSoundTestRunning=false;

        CheckWebMidiClick(); // we re-install midi sound processor
    }
}

// Test button called
async function testSoundClick() {
    window.oldC1Amplitude=0;  // reset the value of M1 selfmodulation
    let formulaValues=checkForValidValues();
    //document.getElementById("docfooter").innerHTML="dfsdf";

    if ((formulaValues.Algorithm!="Algorithm1")&&(formulaValues.Algorithm!="Algorithm2")
        &&(formulaValues.Algorithm!="Algorithm3")&&(formulaValues.Algorithm!="Algorithm4")
        &&(formulaValues.Algorithm!="Algorithm5")&&(formulaValues.Algorithm!="Algorithm6")
        &&(formulaValues.Algorithm!="Algorithm7")&&(formulaValues.Algorithm!="Algorithm8")
        )
        throw "Unsupported Algorithm playSound()";


    if (window.myAudioContext!=null){
        window.myAudioContext.close();
    }

    // create the audio worklet and configure it via a message
    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule("test-sound-processor.js");
    //
    let testSPNode = new AudioWorkletNode(
    audioContext,
    "test-sound-processor",
    );
    //
    testSPNode.port.onmessage = (e) => console.log("Main app: Received from sound procesor: "+e.data);
    testSPNode.connect(audioContext.destination);

    let myAudioProcessorMessage =new AudioProcessorMessage(formulaValues, false, audioContext.sampleRate);

    testSPNode.port.postMessage(myAudioProcessorMessage);

    //global variables
    window.signalProcessor=testSPNode;
    window.myAudioContext=audioContext; //global var
    window.isSoundTestRunning=true;

}

// series of functions called when the UI changes values. They call the sound processor to update the sound values
function C1FrequencySliderOnInput() {
    let val=parseFloat(document.getElementById("C1FrequencySlider").value);
    document.getElementById("C1").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
function C2FrequencySliderOnInput() {
    let val=parseFloat(document.getElementById("C2FrequencySlider").value);
    document.getElementById("C2").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
function C3FrequencySliderOnInput() {
    let val=parseFloat(document.getElementById("C3FrequencySlider").value);
    document.getElementById("C3").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
//
function M1FrequencySliderOnInput() {
    let val=parseFloat(document.getElementById("M1FrequencySlider").value);
    document.getElementById("M1").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
function M2FrequencySliderOnInput() {
    let val=parseFloat(document.getElementById("M2FrequencySlider").value);
    document.getElementById("M2").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
function M3FrequencySliderOnInput() {
    let val=parseFloat(document.getElementById("M3FrequencySlider").value);
    document.getElementById("M3").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
function M4FrequencySliderOnInput() {
    let val=parseFloat(document.getElementById("M4FrequencySlider").value);
    document.getElementById("M4").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
//
function D1SliderOnInput() {
    let val=parseFloat(document.getElementById("D1Slider").value);
    document.getElementById("D1").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
function D2SliderOnInput() {
    let val=parseFloat(document.getElementById("D2Slider").value);
    document.getElementById("D2").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
function D3SliderOnInput() {
    let val=parseFloat(document.getElementById("D3Slider").value);
    document.getElementById("D3").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
function D4SliderOnInput() {
    let val=parseFloat(document.getElementById("D4Slider").value);
    document.getElementById("D4").value=""+val;   

    collectFormDataAndUpdateSignalProcessorValues();
}
//
function A1SliderOnInput(){
    collectFormDataAndUpdateSignalProcessorValues();
}
function A2SliderOnInput(){
    collectFormDataAndUpdateSignalProcessorValues();
}
function A3SliderOnInput(){
    collectFormDataAndUpdateSignalProcessorValues();
}
//
function C1TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("C1").value);
    document.getElementById("C1FrequencySlider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
function C2TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("C2").value);
    document.getElementById("C2FrequencySlider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
function C3TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("C3").value);
    document.getElementById("C3FrequencySlider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
//
function M1TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("M1").value);
    document.getElementById("M1FrequencySlider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
function M2TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("M2").value);
    document.getElementById("M2FrequencySlider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
function M3TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("M3").value);
    document.getElementById("M3FrequencySlider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
function M4TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("M4").value);
    document.getElementById("M4FrequencySlider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
//
function D1TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("D1").value);
    document.getElementById("D1Slider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
function D2TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("D2").value);
    document.getElementById("D2Slider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
function D3TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("D3").value);
    document.getElementById("D3Slider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}
function D4TextOnChange() {
    //console.log (document.getElementById("C1").value);
    let val=parseFloat(document.getElementById("D4").value);
    document.getElementById("D4Slider").value=val;
    collectFormDataAndUpdateSignalProcessorValues();
}

/*
This function sends the form data to the signal processor
*/
function collectFormDataAndUpdateSignalProcessorValues(){
    
    if (window.isSoundTestRunning==false)
        return;

    if ((window.signalProcessor!=null)&&(window.myAudioContext!=null))
    {   
        let formulaValues=checkForValidValues();

        let myAudioProcessorMessage =new AudioProcessorMessage(formulaValues, false, window.myAudioContext.sampleRate); 
        
        //
        window.signalProcessor.port.postMessage(myAudioProcessorMessage);// send the new form values to audio processor
    }
}

// constains the info sent via message to an audio signal processor
class MIDIAudioProcessorMessage {  
    //audioTestStopRequested= false; // request audio signal processing to stop
    //audioCtxSampleRate= -1;
    messageType="";
    key=-1;

    Algorithm=null;
    //M1
    M1=null; 
    D1=null;
    //C1
    A1=null;
    C1=null;
    //M2
    M2=null; 
    D2=null;
    //C2
    C2=null;
    A2=null;
    //M3
    M3=null; 
    D3=null;
    //C3
    C3=null;
    A3=null;
    //M4
    M4=null; 
    D4=null;
    //
    Attack=null;
    Decay=null;
    Sustain=null;
    SustainVolume=null;
    Release=null;


    timeShiftingRatio=-1;

    constructor(messageTypep, keyp, formulaValues, timeShiftingRatiop) { 
        
        this.messageType=messageTypep;
        this.key=keyp;    

        this.timeShiftingRatio=timeShiftingRatiop;

        if (formulaValues!=null) {
            //M1
            this.M1=formulaValues.M1; 
            this.D1=formulaValues.D1;
            //C1
            this.A1=formulaValues.A1;
            this.C1=formulaValues.C1;
            //M2
            this.M2=formulaValues.M2; 
            this.D2=formulaValues.D2;
            //C2
            this.C2=formulaValues.C2;
            this.A2=formulaValues.A2;
            //M3
            this.M3=formulaValues.M3; 
            this.D3=formulaValues.D3;
            //C3
            this.C3=formulaValues.C3;
            this.A3=formulaValues.A3;
            //M4
            this.M4=formulaValues.M4; 
            this.D4=formulaValues.D4;
            //
            this.Attack=formulaValues.Attack;
            this.Decay=formulaValues.Decay;
            this.Sustain=formulaValues.Sustain;
            this.SustainVolume=formulaValues.SustainVolume;
            this.Release=formulaValues.Release;
            //
            this.Algorithm=formulaValues.Algorithm;
        }
    }  
}

// we can have multiple  keypressed events for the same key (repetition)
/* This function triggers when a keyboard key is pressed, via computer keyboard or midi device
*/
async function keyPressed(keyCode) {
    //console.log("keyPressed :"+keyCode)

    if (window.isSoundTestRunning)
        return;

    if ((window.myAudioContext==null)||(window.signalProcessor==null))
        return;

    //
    let formulaValues=checkForValidValues();

    let myTimeShiftingRatio=1;
    let minC1=Math.max(formulaValues.C1, 1); // we use carrier 1 as referent to know the frequency the sample is at
    let mustIPlayThisKey=false;

    // stretch the time T to play the correct note
    switch (keyCode) {
        case 65: //A
            myTimeShiftingRatio=349/minC1;
            mustIPlayThisKey=true;
            break;
        case 83: //S
            myTimeShiftingRatio=369/minC1;
            mustIPlayThisKey=true;
            break;
        case 68: //D
            myTimeShiftingRatio=392/minC1;
            mustIPlayThisKey=true;
            break;
        case 70: //F
            myTimeShiftingRatio=415/minC1;
            mustIPlayThisKey=true;
            break;
        case 71: //G
            myTimeShiftingRatio=440/minC1;
            mustIPlayThisKey=true;
            break;
        case 72: //H
            myTimeShiftingRatio=466/minC1;
            mustIPlayThisKey=true;
            break;
        case 74: //J
            myTimeShiftingRatio=493/minC1;
            mustIPlayThisKey=true;
            break;
        case 75: //K
            myTimeShiftingRatio=525/minC1;
            mustIPlayThisKey=true;
            break;
        case 76: //L
            myTimeShiftingRatio=554/minC1;
            mustIPlayThisKey=true;
            break;

    }

    if (keyCode>1000){ // received from MIDI dev
        myTimeShiftingRatio=midiNoteToFrequency(keyCode-1000)/minC1; // convert the key received from midi device into frequency
        mustIPlayThisKey=true;
    }

    if (mustIPlayThisKey) {
        let myAudioProcessorMessage =new MIDIAudioProcessorMessage("noteOn", keyCode, formulaValues, myTimeShiftingRatio);
        window.signalProcessor.port.postMessage(myAudioProcessorMessage);
    }
}

async function keyReleased(keyCode) {
    //console.log("keyReleased :"+keyCode)    

    if (window.isSoundTestRunning)
        return;

    if ((window.myAudioContext==null)||(window.signalProcessor==null))
        return;

    //
    let myAudioProcessorMessage =new MIDIAudioProcessorMessage("noteOff", keyCode, null, 0);
    window.signalProcessor.port.postMessage(myAudioProcessorMessage);
}

/*
Checks if webmidi is available and configures it, but first, installs the midi sound processor.
*/
async function CheckWebMidiClick() {

    if (window.isSoundTestRunning)
        return;

    if (window.myAudioContext!=null) {
        window.myAudioContext.close();
    }

    //console.log(""+window.signalProcessor.constructor.name);

    // create the audio worklet and configure it via a message
    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule("midi-sound-processor.js");
        //
    let midiSPNode = new AudioWorkletNode(
        audioContext,
        "midi-sound-processor",
    );
    //
    midiSPNode.port.onmessage = (e) => console.log("Main app: Received from sound procesor: "+e.data);
    midiSPNode.connect(audioContext.destination);
    
    //global variables
    window.signalProcessor=midiSPNode;
    window.myAudioContext=audioContext; //global var

    // send configuration message
    window.signalProcessor.port.postMessage( {messageType:"config", audioTestStopRequested:false, audioCtxSampleRate: audioContext.sampleRate});

    await navigator.requestMIDIAccess()
    .then(
      (midi) => midiReady(midi),
      (err) => console.log('MIDI: Something went wrong', err));
}

function midiReady(midi) {
    // Also react to device changes.
    midi.addEventListener('statechange', (event) => MIDIinitDevices(event.target));
    MIDIinitDevices(midi); // see the next section!
  }

  function MIDIinitDevices(midi) {
    // Reset.
    let midiIn = [];
    let midiOut = [];
    
    // MIDI devices that send you data.
    const inputs = midi.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
      midiIn.push(input.value);
    }
    
    // MIDI devices that you send data to.
    const outputs = midi.outputs.values();
    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
      midiOut.push(output.value);
    }
    
    //displayDevices();
    MIDIstartListening(midiIn);
  }
  
  
  // Start listening to MIDI messages.
  function MIDIstartListening(midiIn) {
    for (const input of midiIn) {
      input.addEventListener('midimessage', midiMessageReceived);
    }
  }

  function midiMessageReceived(event) {
    // MIDI commands we care about. See
    // http://webaudio.github.io/web-midi-api/#a-simple-monophonic-sine-wave-midi-synthesizer.
    const NOTE_ON = 9;
    const NOTE_OFF = 8;
  
    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = (event.data.length > 2) ? event.data[2] : 1;
    
    // You can use the timestamp to figure out the duration of each note.
    //const timestamp = Date.now();
    
    // Note that not all MIDI controllers send a separate NOTE_OFF command for every NOTE_ON.
    if (cmd === NOTE_OFF || (cmd === NOTE_ON && velocity === 0)) {
      //console.log(`from ${event.srcElement.name} note off: pitch:${pitch}, velocity: ${velocity}`);
      /////console.log ("Noteoff: NoteId="+pitch);
      keyReleased(1000+pitch);
    
/*      // Complete the note!
      const note = notesOn.get(pitch);
      if (note) {
        console.log(`🎵 pitch:${pitch}, duration:${timestamp - note} ms.`);
        //notesOn.delete(pitch);
      }*/

    } else if (cmd === NOTE_ON) {
      //console.log(`from ${event.srcElement.name} note on: pitch:${pitch}, velocity: {velocity}`);
      ///////////////console.log ("NoteOn: NoteID= "+pitch+"freq="+midiNoteToFrequency(event.data[1]));
      keyPressed(1000+pitch);
      
      // One note can only be on at once.
      //notesOn.set(pitch, timestamp);
    }
  }

function midiNoteToFrequency (note) {
    return Math.pow(2, ((note - 69) / 12)) * 440;
}
