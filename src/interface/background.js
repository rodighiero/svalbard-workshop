import { Sprite } from 'pixi.js'

export default (backgroundTexture) => {
    let sprite = new Sprite(backgroundTexture)
    sprite.width = window.innerWidth
    sprite.height = window.innerHeight
    sprite.interactiveChildren = false

    s.viewport.addChild(sprite)
}
