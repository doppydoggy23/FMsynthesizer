"use strict";

/*
This code belongs to pubic domain (2023)
*/

function initializeUI() {

}


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

    let totalSampleTime=formulaValues.Attack+formulaValues.Sustain+formulaValues.Release;
    if (totalSampleTime<=0) 
        return;


    let wav = new wavefile.WaveFile();

    let myInt16Array = new Int16Array(44100*totalSampleTime);
    for (let i=0; i<myInt16Array.length; i++) {
        let smpl=getFMAmplitudeFor(formulaValues, i, 44100); // gets the amplitude [0..1] for the given time i
        smpl*=getWaveScaleFor(formulaValues, i, myInt16Array.length); // multiplies it for a scale to give the wave the shape according to attack, sustain and release times
        smpl=Math.floor(smpl*32766); // convert it to 16 bit signed integers
        myInt16Array[i]=smpl;
    }

    // Create a mono wave file, 44.1 kHz, 16-bit
    wav.fromScratch(1, 44100, '16', myInt16Array);
    //fs.writeFileSync(path, wav.toBuffer());

    //let myByteArray = new Uint8Array(5);
    //myByteArray= [1, 2, 3, 4, 5];

    var blob = new Blob([wav.toBuffer()], {type: "audio/wav"});
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    var fileName = "sound.wav";
    link.download = fileName;
    link.click();
}

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

    let totalSampleTime=formulaValues.Attack+formulaValues.Sustain+formulaValues.Release;
    if (totalSampleTime<=0) 
        return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Create an empty three-second stereo buffer at the sample rate of the AudioContext
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
            nowBuffering[i]=getFMAmplitudeFor(formulaValues, i, audioCtx.sampleRate); // gets the amplitude [0..1] for the given time i
            nowBuffering[i]*=getWaveScaleFor(formulaValues, i, myArrayBuffer.length); // multiplies it for a scale to give the wave the shape according to attack, sustain and release times
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

function getWaveScaleFor (formulaValues, i, totalSamples) {
        let scale=1;
        
        //calculate wave amplitude accodrding to attack, sustain and release times
        let AttackLimit=totalSamples*(formulaValues.Attack/(formulaValues.Attack+formulaValues.Sustain+formulaValues.Release));
        if (i<AttackLimit) {
            scale=(i/AttackLimit);
        }

        let ReleaseLimit=totalSamples*((formulaValues.Attack+formulaValues.Sustain)/(formulaValues.Attack+formulaValues.Sustain+formulaValues.Release));
        let ReleaseSamples=totalSamples*(formulaValues.Release/(formulaValues.Attack+formulaValues.Sustain+formulaValues.Release));
        if (i>ReleaseLimit) {
            scale=1-((i-ReleaseLimit)/ReleaseSamples);
        }

        return scale;
}

function getFMAmplitudeFor (formulaValues, i, sampleRate) {
    if (formulaValues.Algorithm=="Algorithm1")  {
        // Modulator M1 modulates C1
        //let t=(i/sampleRate)%1; // t E [0..1]
        return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + formulaValues.D1*Math.sin(2*Math.PI*formulaValues.M1*(i/sampleRate)) );
        }

    if (formulaValues.Algorithm=="Algorithm2")  {
        // Modulator M2 modulates modulator M1 that modulates C1    
        /*SAME sound than below: 
         let M1Ampl=Math.sin( 2*Math.PI*formulaValues.M1*(i/sampleRate) + formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*(i/sampleRate)) );
         return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + formulaValues.D1*Math.sin(2*Math.PI*M1Ampl*(i/sampleRate)) );*/
         //let t=(i/sampleRate)%1; // t E [0..1]

        /*ÔRIGINAL
        let M1Freq=formulaValues.M1+(formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*(i/sampleRate)));
        return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + formulaValues.D1*Math.sin(2*Math.PI*M1Freq*(i/sampleRate)) );
        */

        //ToDo: add Amplitude value for modulator 1? (formulaValues.M1A)

        let M1Ampl= 1 * Math.sin( 2*Math.PI*formulaValues.M1*(i/sampleRate) + formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*(i/sampleRate)) );
        return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + (formulaValues.D1*M1Ampl) );
    }

    if (formulaValues.Algorithm=="Algorithm3")  {
        // Modulator M3 modulates modulator M2 that modulates modulator M1 that modulates C1    
/*  ORIGINAL      
        let M2Freq=formulaValues.M2+(formulaValues.D3*Math.sin(2*Math.PI*formulaValues.M3*(i/sampleRate)));
        let M1Freq=formulaValues.M1+(formulaValues.D2*Math.sin(2*Math.PI*M2Freq*(i/sampleRate)));
        return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + formulaValues.D1*Math.sin(2*Math.PI*M1Freq*(i/sampleRate)) );
        */
        let M2Ampl= 1 * Math.sin( 2*Math.PI*formulaValues.M2*(i/sampleRate) + formulaValues.D3*Math.sin(2*Math.PI*formulaValues.M3*(i/sampleRate)) );
        let M1Ampl= 1 * Math.sin( 2*Math.PI*formulaValues.M1*(i/sampleRate) + (formulaValues.D2*M2Ampl) );
        return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + (formulaValues.D1*M1Ampl) );
        
    }

    if (formulaValues.Algorithm=="Algorithm4")  {
        // Modulator M3,  modulator M2 and Modulator M1 modulate all C1    
        let M1A=formulaValues.D1*Math.sin(2*Math.PI*formulaValues.M1*(i/sampleRate));
        let M2A=formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*(i/sampleRate));
        let M3A=formulaValues.D3*Math.sin(2*Math.PI*formulaValues.M3*(i/sampleRate));
        return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + M1A+M2A+M3A );
    }

    if (formulaValues.Algorithm=="Algorithm5")  {
        // Modulator M2 modulates modulator M1 that modulates carrier 1 and Modulator M4 modulates modulator M3 that modulates carrier 2
        /* ORIGINAL
        let M1Freq=formulaValues.M1+(formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*(i/sampleRate)));
        let C1Ampl=formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + formulaValues.D1*Math.sin(2*Math.PI*M1Freq*(i/sampleRate)) );
        let M3Freq=formulaValues.M3+(formulaValues.D4*Math.sin(2*Math.PI*formulaValues.M4*(i/sampleRate)));
        let C2Ampl=formulaValues.A2*Math.sin( 2*Math.PI*formulaValues.C2*(i/sampleRate) + formulaValues.D3*Math.sin(2*Math.PI*M3Freq*(i/sampleRate)) );

        return (C1Ampl+C2Ampl)/2;
        */

        let M1Ampl= 1 * Math.sin( 2*Math.PI*formulaValues.M1*(i/sampleRate) + formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*(i/sampleRate)) );
        let C1Ampl=formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + (formulaValues.D1*M1Ampl) );
        let M3Ampl= 1 * Math.sin( 2*Math.PI*formulaValues.M3*(i/sampleRate) + formulaValues.D4*Math.sin(2*Math.PI*formulaValues.M4*(i/sampleRate)) );
        let C2Ampl=formulaValues.A2*Math.sin( 2*Math.PI*formulaValues.C2*(i/sampleRate) + (formulaValues.D3*M3Ampl) );

        return (C1Ampl+C2Ampl)/2;
    }

    if (formulaValues.Algorithm=="Algorithm6")  {
        // Modulator M2 modulates modulator M1 that modulates Carrier 1, and Modulator M3 modulates carrier C2, and Modulator M4 modulates carrier C3
        let M1Ampl= 1 * Math.sin( 2*Math.PI*formulaValues.M1*(i/sampleRate) + formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*(i/sampleRate)) );
        let C1Ampl=formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + (formulaValues.D1*M1Ampl) );
        let C2Ampl=formulaValues.A2*Math.sin( 2*Math.PI*formulaValues.C2*(i/sampleRate) + formulaValues.D3*Math.sin(2*Math.PI*formulaValues.M3*(i/sampleRate)) );
        let C3Ampl=formulaValues.A3*Math.sin( 2*Math.PI*formulaValues.C3*(i/sampleRate) + formulaValues.D4*Math.sin(2*Math.PI*formulaValues.M4*(i/sampleRate)) );

        return (C1Ampl+C2Ampl+C3Ampl)/3;
    }

    if (formulaValues.Algorithm=="Algorithm7")  {
        // Modulator M2 modulates modulator M1 and Modulator M4 modulates modulator M3, and M1 and M3 modulates carrier C1
        let M1Ampl= 1 * Math.sin( 2*Math.PI*formulaValues.M1*(i/sampleRate) + formulaValues.D2*Math.sin(2*Math.PI*formulaValues.M2*(i/sampleRate)) );
        let M3Ampl= 1 * Math.sin( 2*Math.PI*formulaValues.M3*(i/sampleRate) + formulaValues.D4*Math.sin(2*Math.PI*formulaValues.M4*(i/sampleRate)) );

        return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + (formulaValues.D1*M1Ampl)+(formulaValues.D3*M3Ampl) );
    }

    if (formulaValues.Algorithm=="Algorithm8")  {
        // Modulator M1 modulates itself and Carrier C1
        let M1Ampl= formulaValues.D1 * Math.sin( 2*Math.PI*formulaValues.M1*(i/sampleRate) + (formulaValues.D1*window.oldC1Amplitude) );
        window.oldC1Amplitude=M1Ampl; // we need the old value of M1 Amplitude to get the next new value

        return formulaValues.A1*Math.sin( 2*Math.PI*formulaValues.C1*(i/sampleRate) + (formulaValues.D1*M1Ampl) );
    }
}

/*
Checks that all form values are correct, and if not, corrects them
*/
function checkForValidValues() {
    const M1Min=0;
    const M1Max=5000;
    const M1Default=100;

    const A1Min=0;
    const A1Default=1;
    const A1Max=1;

    const C1Min=0;
    const C1Default=100;
    const C1Max=5000;

    const D1Min=0;
    const D1Default=1;
    const D1Max=1000;

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


    //Attack, sustain and release
    let attackValue=parseFloat(document.getElementById("AttackSlider").value);
    let sustainValue=parseFloat(document.getElementById("SustainSlider").value);
    let releaseValue=parseFloat(document.getElementById("ReleaseSlider").value);

        
    console.log ("A1="+A1Value+" C1="+C1Value+ " M1="+M1Value+" D1="+D1Value+ " Attack="+attackValue+ " Sustain="+sustainValue+" Release="+releaseValue);
    console.log ("M2="+M2Value+" D2="+D2Value);
    console.log ("M3="+M3Value+" D3="+D3Value);
    console.log ("M4="+M4Value+" D4="+D4Value);
    console.log ("C2="+C2Value+" A2="+A2Value);
    console.log ("C3="+C3Value+" A3="+A3Value);

    let selectedAlgorithm=document.getElementById("Algorithm").value;
    if (selectedAlgorithm=="Algorithm1") {
        return {
            Algorithm:"Algorithm1", 
            M1: M1Value, 
            A1: A1Value, 
            C1: C1Value, 
            D1: D1Value,
            Attack:attackValue,
            Sustain: sustainValue,
            Release: releaseValue
        };
    }

    if (selectedAlgorithm=="Algorithm2") {
        return {
            Algorithm:"Algorithm2", 
            M1: M1Value, 
            A1: A1Value, 
            C1: C1Value, 
            D1: D1Value,
            M2: M2Value,
            D2: D2Value,
            Attack:attackValue,
            Sustain: sustainValue,
            Release: releaseValue
        };
    }

    if (selectedAlgorithm=="Algorithm3") {
        return {
            Algorithm:"Algorithm3", 
            M1: M1Value, 
            A1: A1Value, 
            C1: C1Value, 
            D1: D1Value,
            M2: M2Value,
            D2: D2Value,
            M3: M3Value,
            D3: D3Value,
            Attack:attackValue,
            Sustain: sustainValue,
            Release: releaseValue
        };
    }

    if (selectedAlgorithm=="Algorithm4") {
        return {
            Algorithm:"Algorithm4", 
            M1: M1Value, 
            A1: A1Value, 
            C1: C1Value, 
            D1: D1Value,
            M2: M2Value,
            D2: D2Value,
            M3: M3Value,
            D3: D3Value,
            Attack:attackValue,
            Sustain: sustainValue,
            Release: releaseValue
        };
    }

    if (selectedAlgorithm=="Algorithm5") {
        return {
            Algorithm:"Algorithm5", 
            A1: A1Value, 
            C1: C1Value, 
            A2: A2Value, 
            C2: C2Value, 
            M1: M1Value, 
            D1: D1Value,
            M2: M2Value,
            D2: D2Value,
            M3: M3Value,
            D3: D3Value,
            M4: M4Value,
            D4: D4Value,
            Attack:attackValue,
            Sustain: sustainValue,
            Release: releaseValue
        };
    }

    if (selectedAlgorithm=="Algorithm6") {
        return {
            Algorithm:"Algorithm6", 
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
            Sustain: sustainValue,
            Release: releaseValue
        };
    }

    if (selectedAlgorithm=="Algorithm7") {
        return {
            Algorithm:"Algorithm7", 
            A1: A1Value, 
            C1: C1Value, 
            M1: M1Value, 
            D1: D1Value,
            M2: M2Value,
            D2: D2Value,
            M3: M3Value,
            D3: D3Value,
            M4: M4Value,
            D4: D4Value,
            Attack:attackValue,
            Sustain: sustainValue,
            Release: releaseValue
        };
    }

    if (selectedAlgorithm=="Algorithm8") {
        return {
            Algorithm:"Algorithm8", 
            M1: M1Value, 
            A1: A1Value, 
            C1: C1Value, 
            D1: D1Value,
            Attack:attackValue,
            Sustain: sustainValue,
            Release: releaseValue
        };
    }

    throw Error("Algorithm not supported checkForValidValues()");
}

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

}