let library;
function loadLibrary(){
  if(globalThis.ZXing)return Promise.resolve(globalThis.ZXing);
  if(!library)library=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('./barcode-vendor.js',import.meta.url).href;s.onload=()=>resolve(globalThis.ZXing);s.onerror=()=>{library=null;reject(Error('Lettore non caricato. Digita il codice della confezione.'));};document.head.append(s);});
  return library;
}
export function createScanner(){
  let stream=null,reader=null,active=false,generation=0;
  function stop(){active=false;generation++;reader?.reset();reader=null;stream?.getTracks().forEach(t=>t.stop());stream=null;}
  async function start(video,onCode){
    stop();active=true;const ticket=generation;
    if(!navigator.mediaDevices?.getUserMedia){stop();throw Error('Fotocamera non disponibile: usa HTTPS oppure digita il codice.');}
    try{
      const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      if(!active||ticket!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
      stream=acquired;
      const ZXing=await loadLibrary();if(!active||ticket!==generation)return;
      const hints=new Map();hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[ZXing.BarcodeFormat.EAN_13,ZXing.BarcodeFormat.EAN_8,ZXing.BarcodeFormat.UPC_A,ZXing.BarcodeFormat.UPC_E]);
      reader=new ZXing.BrowserMultiFormatReader(hints,350);
      await reader.decodeFromStream(stream,video,result=>{if(result&&active&&ticket===generation){const code=result.getText();stop();onCode(code);}});
    }catch(error){if(ticket!==generation)return;stop();throw Error(error.name==='NotAllowedError'?'Accesso alla fotocamera negato. Puoi digitare il codice.':error.name==='NotFoundError'?'Nessuna fotocamera trovata. Digita il codice.':error.message||'Scansione non disponibile. Digita il codice.');}
  }
  return {start,stop};
}
