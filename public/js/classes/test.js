async function* getFilesRecursively (entry) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (file !== null) {
        file.relativePath = getRelativePath(entry);
        yield file;
      }
    } else if (entry.kind === 'directory') {
      for await (const handle of entry.values()) {
        yield* getFilesRecursively(handle);
      }
    }
  }

(async ()=>{
    const dirName = './public';

    // assuming we have a directory handle: 'currentDirHandle'
    const directoryHandle = await window.showDirectoryPicker()
    for await (const entry of directoryHandle.values()) {
        console.log(entry.kind, entry.name);
      }
    // const directoryHandle = FileSystemDirectoryHandle.getDirectoryHandle(dirName, {create: false});

    // for await (const fileHandle of getFilesRecursively(directoryHandle)) {
    //     console.log(fileHandle);
    // }
})()