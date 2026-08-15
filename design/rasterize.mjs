import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const design = (name) => readFileSync(join(__dirname, name))
const assets = (name) => join(__dirname, '..', 'assets', name)

async function run() {
  await sharp(design('icon-full.svg')).resize(1024, 1024).png().toFile(assets('icon.png'))
  await sharp(design('icon-foreground.svg')).resize(1024, 1024).png().toFile(assets('android-icon-foreground.png'))
  await sharp(design('icon-background.svg')).resize(1024, 1024).png().toFile(assets('android-icon-background.png'))
  await sharp(design('icon-monochrome.svg')).resize(1024, 1024).png().toFile(assets('android-icon-monochrome.png'))
  await sharp(design('icon-foreground.svg')).resize(1024, 1024).png().toFile(assets('splash-icon.png'))
  await sharp(design('icon-full.svg')).resize(48, 48).png().toFile(assets('favicon.png'))
  console.log('done')
}

run()
