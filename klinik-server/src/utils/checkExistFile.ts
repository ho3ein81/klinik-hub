import fs from 'fs'

export function checkExistFile(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(path, fs.constants.R_OK, (err) => {
      resolve(!err)
    })
  })
}
