// Carica il manifest delle storie disponibili.
async function loadManifest(){
  const res = await fetch('stories/manifest.json');
  if(!res.ok) throw new Error('manifest-not-found');
  const manifest = await res.json();
  if(!manifest.stories || !manifest.stories.length){
    throw new Error('manifest-empty');
  }
  return manifest;
}

// Carica una specifica storia dato il nome del file dentro stories/.
async function loadStoryFile(file){
  const res = await fetch('stories/' + file);
  if(!res.ok) throw new Error('story-not-found: ' + file);
  return await res.json();
}
