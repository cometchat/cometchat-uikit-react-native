const { log } = require('console');
const fs = require('fs');
const path = require('path');

function getFiles(dir, files_) {
    files_ = files_ || [];
    const files = fs.readdirSync(dir);
    for (let i in files) {
        const name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
          const extName = path.extname(files[i]);
           if (extName == ".png" || extName == ".wav" || extName == ".jpg" || extName == "jpeg")
            files_.push({name, dist: name.replace("src/","lib/")});
        }
    }
    return files_;
}

function copyFiles() {
  const files = getFiles('src');

  for (let i in files) {
    fs.copyFile(files[i].name, files[i].dist, (e) => {
      if (e) {
        console.log(e);
      }
    })
}
}
copyFiles()