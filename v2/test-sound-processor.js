// Audio worklet code
class TestSoundProcessor extends AudioWorkletProcessor {

    audioTestStopRequested=null;
    audioCtxSampleRate=-1;

    samplesProcessed=0;

    Algorithm=null;

    //M1
    M1=null; 
    D1=null;
    //C1
    A1=null;
    C1=null;
    //M2
    M2=null; 
    A2=null;
    //C2
    C2=null;
    D2=null;
    //M3
    M3=null; 
    A3=null;
    //C3
    C3=null;
    D3=null;
    //M4
    M4=null; 
    A4=null;
    //C4 
    //not yet C4=null;
    //not yet D4=null;
    oldM1Amplitude=0;

    // the matchng function of getFMAmplitudeFor in audio.js is getFMAmplitudeFor. When adding new algorithms you need to change both.
    getFMAmplitudeFor(t) {
        if (this.Algorithm=="Algorithm1")  {
        // Modulator M1 modulates C1
        //let t=(i/sampleRate)%1; // t E [0..1]
        return this.A1*Math.sin( (2*Math.PI*this.C1*t) + (this.D1*Math.sin(2*Math.PI*this.M1*t)) );
        }

        if (this.Algorithm=="Algorithm2")  {
          // Modulator M2 modulates modulator M1 that modulates C1    
          let M1Ampl= 1 * Math.sin( (2*Math.PI*this.M1*t) + (this.D2*Math.sin(2*Math.PI*this.M2*t)) );
          return this.A1*Math.sin( (2*Math.PI*this.C1*t) + (this.D1*M1Ampl) );
      }
  
        if (this.Algorithm=="Algorithm3")  {
            // Modulator M3 modulates modulator M2 that modulates modulator M1 that modulates C1    
            let M2Ampl= 1 * Math.sin( (2*Math.PI*this.M2*t) + (this.D3*Math.sin(2*Math.PI*this.M3*t)) );
            let M1Ampl= 1 * Math.sin( (2*Math.PI*this.M1*t) + (this.D2*M2Ampl) );
            return this.A1*Math.sin( (2*Math.PI*this.C1*t) + (this.D1*M1Ampl) );
            
        }
    
        if (this.Algorithm=="Algorithm4")  {
            // Modulator M3,  modulator M2 and Modulator M1 modulate all C1    
            let M1A=this.D1*Math.sin(2*Math.PI*this.M1*t);
            let M2A=this.D2*Math.sin(2*Math.PI*this.M2*t);
            let M3A=this.D3*Math.sin(2*Math.PI*this.M3*t);
            return this.A1*Math.sin( (2*Math.PI*this.C1*t) + (M1A+M2A+M3A) );
        }
    
        if (this.Algorithm=="Algorithm5")  {
            // Modulator M2 modulates modulator M1 that modulates Carrier 1 and Modulator M4 modulates modulator M3 that modulates carrier 2
            let M1Ampl= 1 * Math.sin( (2*Math.PI*this.M1*t) + (this.D2*Math.sin(2*Math.PI*this.M2*t)) );
            let C1Ampl=this.A1*Math.sin( (2*Math.PI*this.C1*t) + (this.D1*M1Ampl) );
            let M3Ampl= 1 * Math.sin( (2*Math.PI*this.M3*t) + (this.D4*Math.sin(2*Math.PI*this.M4*t)) );
            let C2Ampl=this.A2*Math.sin( (2*Math.PI*this.C2*t) + (this.D3*M3Ampl) );
    
            return (C1Ampl+C2Ampl)/2;
        }
    
        if (this.Algorithm=="Algorithm6")  {
            // Modulator M2 modulates modulator M1 that modulates Carrier 1, and Modulator M3 modulates carrier C2, and Modulator M4 modulates carrier C3
            let M1Ampl= 1 * Math.sin( (2*Math.PI*this.M1*t) + (this.D2*Math.sin(2*Math.PI*this.M2*t)) );
            let C1Ampl=this.A1*Math.sin( (2*Math.PI*this.C1*t) + (this.D1*M1Ampl) );
            let C2Ampl=this.A2*Math.sin( (2*Math.PI*this.C2*t) + (this.D3*Math.sin(2*Math.PI*this.M3*t)) );
            let C3Ampl=this.A3*Math.sin( (2*Math.PI*this.C3*t) + (this.D4*Math.sin(2*Math.PI*this.M4*t)) );
    
            return (C1Ampl+C2Ampl+C3Ampl)/3;
        }
    
        if (this.Algorithm=="Algorithm7")  {
            // Modulator M2 modulates modulator M1 and Modulator M4 modulates modulator M3, and M1 and M3 modulates carrier C1
            let M1Ampl= 1 * Math.sin( (2*Math.PI*this.M1*t) + (this.D2*Math.sin(2*Math.PI*this.M2*t)) );
            let M3Ampl= 1 * Math.sin( (2*Math.PI*this.M3*t) + (this.D4*Math.sin(2*Math.PI*this.M4*t)) );
    
            return this.A1*Math.sin( (2*Math.PI*this.C1*t) + (this.D1*M1Ampl)+(this.D3*M3Ampl) );
        }
    
        if (this.Algorithm=="Algorithm8")  {
            // Modulator M1 modulates itself and Carrier C1
            let M1Ampl= this.D1 * Math.sin( (2*Math.PI*this.M1*t) + (this.D1*this.oldM1Amplitude) );
            this.oldM1Amplitude=M1Ampl; // we need the old value of M1 Amplitude to get the next new value
    
            return this.A1*Math.sin( (2*Math.PI*this.C1*t) + (this.D1*M1Ampl) );
        }
  }

    // we need to define an onmessage function to received the audio data from audio.js
    constructor(...args) {
        super(...args);
        this.port.onmessage = (e) => {

          //send deserialized data to variables
          this.audioTestStopRequested=e.data.audioTestStopRequested;
          this.audioCtxSampleRate=e.data.audioCtxSampleRate;
          //
          this.Algorithm=e.data.Algorithm;          
          this.M1=e.data.M1; //M1
          this.D1=e.data.D1;
          this.A1=e.data.A1; //C1
          this.C1=e.data.C1;
          this.M2=e.data.M2;  //M2
          this.D2=e.data.D2;
          this.A2=e.data.A2; //C2
          this.C2=e.data.C2;
          this.M3=e.data.M3; //M3
          this.D3=e.data.D3;
          this.A3=e.data.A3; //C3
          this.C3=e.data.C3;
          this.M4=e.data.M4; //M4 
          this.D4=e.data.D4;
          //
          this.oldM1Amplitude=0;
          //no C4 yet this.A4=e.data.A4;
          // no C4 yet this.C4=e.data.C4;
          //console.log("AudioWorkletProcessor: Algorithm="+e.data.Algorithm);
        };
      }

      // function that processes the audio
    process(inputs, outputs, parameters) {

      if (this.audioTestStopRequested==null) { // it hasn't been configured yet
        return true;
      }

      const output = outputs[0];
      output.forEach((channel) => {
        for (let i = 0; i < channel.length; i++) {

          //
          //
          let t=((i+this.samplesProcessed)/this.audioCtxSampleRate);    // this is why we need the count of samples processed, to get time t

          let minC1=Math.max(this.C1, 1);
          let shiftingRatio=(440/minC1); // adjust the timing to always play a note A  

          channel[i] = this.getFMAmplitudeFor(t*shiftingRatio); // simply write the amplitude values to output buffer
          //channel[i]=1;
          //
          //
        }
      });
      this.samplesProcessed+=output[0].length; // wee need the count of samples processed to obtain time t

      if (this.audioTestStopRequested==true) {
            //console.log("AudioWorkletProcessor: exit requested");
            return false;
      }

      return true;
    }
  }
  
  registerProcessor("test-sound-processor", TestSoundProcessor);
  