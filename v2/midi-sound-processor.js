// Audio worklet code
class MIDISoundProcessor extends AudioWorkletProcessor {

  audioCtxSampleRate=-1;
  audioTestStopRequested=null;

  notesCurrentlyPlaying = new Array();

  noteOnEventReceived(e) {

    /*
    // check if the note sent is duplicated
    for (let i=0; i<this.notesCurrentlyPlaying.length; i++) {
      if (this.notesCurrentlyPlaying[i].key==e.data.key)
        return; // we don't do anything more. We discard the data.
    }*/

    //console.log("AudioWorkletProcessor: noteOn="+e.data.key); 


    let noteInfo = {
      key: e.data.key,
      samplesProcessed: 0,
      oldM1Value:0,
      timeShiftingRatio: e.data.timeShiftingRatio,
      //
      Algorithm:e.data.Algorithm,
      //M1
      M1:e.data.M1,
      D1:e.data.D1,
      //C1
      A1:e.data.A1,
      C1:e.data.C1,
      //M2
      M2:e.data.M2,
      D2:e.data.D2,
      //C2
      C2:e.data.C2,
      A2:e.data.A2,
      //M3
      M3:e.data.M3,
      D3:e.data.D3,
      //C3
      C3:e.data.C3,
      A3:e.data.A3,
      //M4
      M4:e.data.M4,
      D4:e.data.D4,
      //
      Attack: e.data.Attack,
      Decay: e.data.Decay,
      Sustain: e.data.Sustain+10000,
      SustainVolume: e.data.SustainVolume,
      Release: e.data.Release
    };
    this.notesCurrentlyPlaying.push(noteInfo); // add note to notes currently playing
    //console.log("AudioWorkletProcessor: noteOnEventReceived: M1="+noteInfo.M1);
    //console.log("AudioWorkletProcessor: noteOnEventReceived: Attack="+noteInfo.Attack+" Decay="+noteInfo.Decay+" Sustain="+noteInfo.Sustain+" SustainVolume="+noteInfo.SustainVolume+" Release="+noteInfo.Release);
    //console.log("AudioWorkletProcessor: noteOnEventReceived: Attackrrrr="+e.data.Attack);
  }
  noteOffEventReceived(e) {
    //console.log("AudioWorkletProcessor: noteOff="+e.data.key);
    /*
    what we do here is mark the note as Off and adjust the Sustain time to always play, at least, Attack, Decay, and Release.
    */

    //remove note from array of notes currently playing
    let elementPos;
    for (let i=0; i<this.notesCurrentlyPlaying.length; i++) {
      if (this.notesCurrentlyPlaying[i].key==e.data.key)
        elementPos=i;
    }
    //this.notesCurrentlyPlaying.splice(elementPos, 1);
    let noteInfoS=this.notesCurrentlyPlaying[elementPos];
    noteInfoS.key+=2000; // mark the note as Off
    let noteT=noteInfoS.samplesProcessed/this.audioCtxSampleRate;
    if (noteT<=(noteInfoS.Attack+noteInfoS.Decay)) { // we need to play attack and decay and then directly release
      noteInfoS.Sustain=0;
    } else { // we are in sustain. Trim values.
      noteInfoS.Sustain=noteT-noteInfoS.Attack-noteInfoS.Decay;
    }

    //console.log("AudioWorkletProcessor: noteOffEventReceived: Array Length="+this.notesCurrentlyPlaying.length);
  }

  getFMAmplitudeFor (formulaValues, t) {
    if (formulaValues.Algorithm=="Algorithm1")  {
        // Modulator M1 modulates C1
        //let t=(i/sampleRate)%1; // t E [0..1]
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
        let M1Ampl= formulaValues.D1 * Math.sin( (2*Math.PI*formulaValues.M1*t) + (formulaValues.D1*formulaValues.oldM1Value) );
        formulaValues.oldM1Value=M1Ampl; // we need the old value of M1 Amplitude to get the next new value

        return formulaValues.A1*Math.sin( (2*Math.PI*formulaValues.C1*t) + (formulaValues.D1*M1Ampl) );
    }
}

 getWaveScaleFor (formulaValues, t) {
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

    // we need to define an onmessage function to received the audio data from audio.js
    constructor(...args) {
        super(...args);
        this.port.onmessage = (e) => {

          //
          if (e.data.messageType=="noteOn") {
            //console.log("AudioWorkletProcessor: noteOn="+e.data.key);            
            this.noteOnEventReceived(e);
          }
          if (e.data.messageType=="noteOff") {
            //console.log("AudioWorkletProcessor: noteOff="+e.data.key);            
            this.noteOffEventReceived(e);
          }
          if (e.data.messageType=="config") { // configuration message
            //console.log("AudioWorkletProcessor: config");            
            //this.noteOffEventReceived(e);
            this.audioTestStopRequested=e.data.audioTestStopRequested;
            this.audioCtxSampleRate=e.data.audioCtxSampleRate;

            //console.log("AudioWorkletProcessor: config="+this.audioTestStopRequested+ " "+ this.audioCtxSampleRate);
          }

          //console.log("AudioWorkletProcessor: Algorithm="+e.data.Algorithm);
        };
      }

      // function that processes the audio
    process(inputs, outputs, parameters) {

      if (this.audioTestStopRequested==null) { // it hasn't been configured yet
        return true;
      }

      if (this.notesCurrentlyPlaying.length>0)
      {
        const output = outputs[0];
        output.forEach((channel) => {
          for (let i = 0; i < channel.length; i++) {
            //
            //
            let accumulatedValue=0;       
            for (let notePlaying=0; notePlaying<this.notesCurrentlyPlaying.length; notePlaying++) {
              let noteInfoS=this.notesCurrentlyPlaying[notePlaying];

              let t=((i+noteInfoS.samplesProcessed)/this.audioCtxSampleRate);    // this is why we need the count of samples processed, to get time t
              let tsh=t*noteInfoS.timeShiftingRatio; // adjust the time to play the correct musical note

              accumulatedValue+=this.getFMAmplitudeFor(noteInfoS, tsh)*this.getWaveScaleFor(noteInfoS, t); // simply write the amplitude values to output buffer              
              //accumulatedValue+=this.getFMAmplitudeFor(noteInfoS, tsh);
            }
            channel[i]= accumulatedValue;
            //
            //
            /*
             * Please, note that naively adding all the values of signals together works fantastically in Firefox, 
             * while in Chrome you need to lower the amplitude of Carriers to not get cracks in sound.
            */
          }
        });

        // update the buffer position for every note playing
        for (let notePlaying=0; notePlaying<this.notesCurrentlyPlaying.length; notePlaying++) {
          let noteInfoS=this.notesCurrentlyPlaying[notePlaying];
          noteInfoS.samplesProcessed+=output[0].length; // wee need the count of samples processed to obtain time t
        }
        
      }

      // remove the notes that have ended playing
      let newNotesPlaying=new Array();
      for (let notePlaying=0; notePlaying<this.notesCurrentlyPlaying.length; notePlaying++) {
        let noteInfoS=this.notesCurrentlyPlaying[notePlaying];
        let noteT=noteInfoS.samplesProcessed/this.audioCtxSampleRate;
        if (noteT<=noteInfoS.Attack+noteInfoS.Decay+noteInfoS.Sustain+noteInfoS.Release){
          newNotesPlaying.push(noteInfoS);
        }
      }
      //
      //if ((this.notesCurrentlyPlaying.length>0)&&(newNotesPlaying.length==0))
      //  console.log("no more notes in array");
      //
      this.notesCurrentlyPlaying=newNotesPlaying;

      return true;
    }
  }
  
  //do the reg ppppppppp
  registerProcessor("midi-sound-processor", MIDISoundProcessor);
  