function setStop(){ PropertiesService.getScriptProperties().setProperty('STOP','1'); }
function clearStop(){ PropertiesService.getScriptProperties().deleteProperty('STOP'); }
function longTask(){
  const p = PropertiesService.getScriptProperties();
  for (let i=0;i<1e7;i++){
    if (p.getProperty('STOP')==='1') throw new Error('Stopped by flag');
    Utilities.sleep(200);
  }
}
