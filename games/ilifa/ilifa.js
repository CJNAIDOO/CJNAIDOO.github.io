// ============================================================================
// Ilifa: The Gift of the Ancestors
// A reimagining + expansion of the Syntax Sorcerers' IAT Fusion Hackathon game
// (repo: Mzanzi-Chronicles). Built with Phaser 3. Still in development: the
// main menu, the comic-panel intro and the first playable street are done.
//
// This file is the game itself, adapted to run inside the XMB (js/ilifa.js
// loads it the first time Ilifa is opened, after Phaser). Changes from the
// Vite version:
//   - fixed 1600 x 900 stage scaled to fit, so it works at any size,
//     including on the 3D PSP's screen
//   - input comes from the XMB (keyboard + PSP buttons) instead of Phaser's
//     own keyboard, so the D-pad, ✕ and ○ work everywhere
//   - the menu works with the D-pad as well as the mouse; SETTINGS toggles
//     sound, CREDITS shows the credits, QUIT goes back to the XMB
//   - the intro can be skipped panel by panel with ✕
//   - assets are WebP / smaller MP3s (35 MB -> 5 MB)
//
// window.ILIFA_GAME.create({ parent, input, onQuit }) -> Phaser.Game
//   input: { isDown(name), on(name, fn), off(name, fn) }
//   names: left, right, up, down, jump, confirm
// ============================================================================
(() => {
    const W = 1600, H = 900
    const BASE = 'games/ilifa/assets/'
    const GOLD = '#F5A623', GOLD_HEX = 0xf5a623
    const PURPLE = 0x1a0533, PURPLE_HI = 0x2d0a5e
    const FONT = '"Cinzel", Georgia, serif'

    // subscribe to XMB input for the life of a scene
    const listen = (scene, name, fn) => {
        const input = scene.registry.get('input')
        input.on(name, fn)
        scene.events.once('shutdown', () => input.off(name, fn))
    }

    // ---- main menu ------------------------------------------------------------
    class MainMenuScene extends Phaser.Scene {
        constructor() { super('MainMenuScene') }

        preload() {
            this.load.image('menu_background', BASE + 'menu_background.webp')
            this.load.image('ilifa', BASE + 'ilifa.webp')
            this.load.audio('menu_music', BASE + 'menu_music.mp3')
            this.load.audio('btn_click', BASE + 'click.mp3')
        }

        create() {
            this.music = this.sound.add('menu_music', { volume: 0.5, loop: true })
            this.music.play()
            this.ready = false
            this.busy = false

            this.add.rectangle(0, 0, W, H, 0x0a0118).setOrigin(0)
            const bg = this.add.image(W / 2, H / 2, 'menu_background')
            bg.setScale(Math.max(W / bg.width, H / bg.height)).setAlpha(0.85)

            this.createParticles()

            const logoSize = H * 0.3
            const logo = this.add.image(W / 2, H * 0.22, 'ilifa').setDisplaySize(logoSize, logoSize).setAlpha(0)

            const glow = { offsetX: 0, offsetY: 0, color: GOLD, blur: 30, fill: true }
            const title = this.add.text(W / 2, H * 0.46, 'ILIFA', {
                fontFamily: FONT, fontSize: `${W * 0.09}px`, color: GOLD,
                stroke: '#1a0533', strokeThickness: 8, shadow: glow,
            }).setOrigin(0.5).setAlpha(0)

            const subtitle = this.add.text(W / 2, H * 0.58, 'THE GIFT OF THE ANCESTORS', {
                fontFamily: FONT, fontSize: `${W * 0.014}px`, color: GOLD, letterSpacing: 10,
                stroke: '#0a0118', strokeThickness: 4, shadow: { ...glow, blur: 15 },
            }).setOrigin(0.5).setAlpha(0)

            // buttons: mouse or D-pad + ✕
            const labels = ['PLAY', this.soundLabel(), 'CREDITS', 'QUIT']
            const startY = H * 0.68, gap = H * 0.072, btnW = W * 0.16, btnH = 48
            this.buttons = labels.map((label, i) => {
                const y = startY + i * gap
                const bg = this.add.rectangle(W / 2, y, btnW, btnH, PURPLE, 0.85).setStrokeStyle(1.5, GOLD_HEX, 0.7).setAlpha(0)
                const text = this.add.text(W / 2, y, label, {
                    fontFamily: FONT, fontSize: '18px', color: GOLD, letterSpacing: 5,
                }).setOrigin(0.5).setAlpha(0)
                const zone = this.add.zone(W / 2, y, btnW, btnH).setInteractive({ useHandCursor: true })
                zone.on('pointerover', () => this.focus(i))
                zone.on('pointerdown', () => this.choose(i))
                return { bg, text }
            })
            this.focused = -1

            listen(this, 'up', () => this.ready && this.focus((Math.max(this.focused, 0) + this.buttons.length - 1) % this.buttons.length))
            listen(this, 'down', () => this.ready && this.focus((this.focused + 1) % this.buttons.length))
            listen(this, 'confirm', () => {
                if (this.credits) return this.hideCredits()
                if (this.ready) this.choose(Math.max(this.focused, 0))
            })

            // fade in: black -> logo -> title -> buttons
            const black = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)
            this.tweens.add({ targets: logo, scale: logo.scale * 1.04, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
            this.tweens.chain({
                tweens: [
                    { targets: black, alpha: 0, duration: 1500, ease: 'Power2' },
                    { targets: logo, alpha: 1, duration: 800, ease: 'Power2' },
                    { targets: [title, subtitle], alpha: 1, duration: 800, ease: 'Power2' },
                    ...this.buttons.map((b) => ({ targets: [b.bg, b.text], alpha: 1, duration: 300, ease: 'Power2' })),
                ],
                onComplete: () => { this.ready = true; if (this.focused < 0) this.focus(0) },
            })
            // any input while it's fading in skips straight to the buttons
            const skip = () => {
                if (this.ready) return
                this.tweens.killAll()
                black.setAlpha(0); logo.setAlpha(1); title.setAlpha(1); subtitle.setAlpha(1)
                this.buttons.forEach((b) => { b.bg.setAlpha(1); b.text.setAlpha(1) })
                this.tweens.add({ targets: logo, scale: logo.scale * 1.04, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
                this.ready = true
                this.focus(0)
            }
            listen(this, 'confirm', skip)
            this.input.on('pointerdown', skip)
        }

        soundLabel() { return this.sound.mute ? 'SOUND: OFF' : 'SOUND: ON' }

        focus(i) {
            if (!this.ready || this.credits || i === this.focused) return
            this.buttons.forEach((b, j) => {
                const on = j === i
                b.bg.setFillStyle(on ? PURPLE_HI : PURPLE, on ? 0.95 : 0.85).setStrokeStyle(on ? 2 : 1.5, GOLD_HEX, on ? 1 : 0.6)
                b.text.setColor(on ? '#ffffff' : GOLD)
                this.tweens.add({ targets: [b.bg, b.text], scale: on ? 1.05 : 1, duration: 100 })
            })
            this.focused = i
        }

        click() { this.sound.play('btn_click', { volume: 0.6 }) }

        choose(i) {
            if (!this.ready || this.busy) return
            if (this.credits) return this.hideCredits()
            this.focus(i)
            this.click()
            switch (i) {
                case 0:                                   // PLAY
                    this.busy = true
                    this.tweens.add({ targets: this.music, volume: 0, duration: 700 })
                    this.cameras.main.fadeOut(800, 0, 0, 0)
                    this.cameras.main.once('camerafadeoutcomplete', () => { this.music.stop(); this.scene.start('IntroScene') })
                    break
                case 1:                                   // SOUND: ON / OFF
                    this.sound.mute = !this.sound.mute
                    this.buttons[1].text.setText(this.soundLabel())
                    break
                case 2:                                   // CREDITS
                    this.showCredits()
                    break
                case 3:                                   // QUIT: back to the XMB
                    this.registry.get('onQuit')()
                    break
            }
        }

        showCredits() {
            const box = this.add.container(W / 2, H / 2)
            const panel = this.add.rectangle(0, 0, W * 0.5, H * 0.46, 0x0a0118, 0.94).setStrokeStyle(2, GOLD_HEX, 0.9)
            const head = this.add.text(0, -H * 0.15, 'CREDITS', { fontFamily: FONT, fontSize: '40px', color: GOLD, letterSpacing: 8 }).setOrigin(0.5)
            const body = this.add.text(0, H * 0.01, [
                'Created by the Syntax Sorcerers',
                'IAT Fusion Hackathon, 2026',
                '',
                'Reimagined and expanded as Ilifa',
                'Built with Phaser 3',
            ].join('\n'), { fontFamily: FONT, fontSize: '22px', color: '#f3e6cf', align: 'center', lineSpacing: 10 }).setOrigin(0.5)
            const hint = this.add.text(0, H * 0.18, 'PRESS ✕ OR CLICK TO CLOSE', { fontFamily: FONT, fontSize: '14px', color: '#c8a87a', letterSpacing: 4 }).setOrigin(0.5)
            box.add([panel, head, body, hint]).setAlpha(0)
            this.tweens.add({ targets: box, alpha: 1, duration: 200 })
            const blocker = this.add.zone(0, 0, W, H).setOrigin(0).setInteractive()
            blocker.on('pointerdown', () => this.hideCredits())
            this.credits = { box, blocker }
        }

        hideCredits() {
            if (!this.credits) return
            const { box, blocker } = this.credits
            this.credits = null
            blocker.destroy()
            this.tweens.add({ targets: box, alpha: 0, duration: 150, onComplete: () => box.destroy() })
        }

        // gold sparks and purple ancestral wisps drifting up
        createParticles() {
            const drift = (count, color, size, alpha, yFrom, rise, sway, dur, delay) => {
                for (let i = 0; i < count; i++) {
                    const x = Phaser.Math.Between(0, W), y = Phaser.Math.Between(yFrom, H)
                    const a = Phaser.Math.FloatBetween(...alpha)
                    const dot = this.add.circle(x, y, Phaser.Math.FloatBetween(...size), color, a)
                    this.tweens.add({
                        targets: dot,
                        y: y - Phaser.Math.Between(...rise),
                        x: x + Phaser.Math.Between(-sway, sway),
                        alpha: 0,
                        duration: Phaser.Math.Between(...dur),
                        repeat: -1,
                        delay: Phaser.Math.Between(0, delay),
                        onRepeat: () => { dot.x = Phaser.Math.Between(0, W); dot.y = H + 10; dot.alpha = a },
                    })
                }
            }
            drift(40, GOLD_HEX, [1, 3.5], [0.2, 0.8], 0, [150, 500], 0, [4000, 10000], 6000)
            drift(15, 0x9b59b6, [3, 7], [0.1, 0.35], H * 0.5, [300, 700], 80, [8000, 16000], 8000)
        }
    }

    // ---- intro: five comic panels with narration ----------------------------------
    class IntroScene extends Phaser.Scene {
        constructor() { super('IntroScene') }

        preload() {
            for (let i = 1; i <= 5; i++) this.load.image(`panel${i}`, `${BASE}panel${i}.webp`)
            this.load.audio('narration', BASE + 'narration.mp3')
            this.load.audio('ambience', BASE + 'intro_music.mp3')
        }

        create() {
            this.panels = [
                { key: 'panel1', text: 'He never understood the weight in his hands... or why the world trembled when his blood turned to fire.', duration: 7000 },
                { key: 'panel2', text: 'Then came the night the shadows moved... and Bobby finally spoke.', duration: 7000 },
                { key: 'panel3', text: 'You carry the Ilifa, Sbu. A gift etched in bone and passed through blood.\nAnd now... the hunters have found the scent.', duration: 10000 },
                { key: 'panel4', text: 'They came before the dawn. Cold steel and silent vans... the way they always do.', duration: 5000 },
                { key: 'panel5', text: 'Now, he has no sanctuary and no dog, so somebody is gotta get their ass kicked...', duration: 10000 },
            ]

            this.ambience = this.sound.add('ambience', { loop: true, volume: 0 })
            this.ambience.play()
            this.tweens.add({ targets: this.ambience, volume: 0.1, duration: 2000 })
            this.narration = this.sound.add('narration', { volume: 1 })
            this.narration.play()

            this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0)
            this.panelImage = this.add.image(W / 2, H / 2, 'panel1').setAlpha(0)

            const vignette = this.add.graphics()
            vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.3, 0.3)
            vignette.fillRect(0, 0, W, H)

            this.narrationText = this.add.text(W / 2, H * 0.88, '', {
                fontFamily: FONT, fontSize: `${W * 0.018}px`, color: GOLD, align: 'center',
                wordWrap: { width: W * 0.75 }, stroke: '#000000', strokeThickness: 6,
            }).setOrigin(0.5)

            this.counterText = this.add.text(W * 0.95, H * 0.05, '1 / 5', {
                fontFamily: FONT, fontSize: '16px', color: '#c8a87a',
            }).setOrigin(1, 0.5).setAlpha(0.6)
            this.add.text(W * 0.05, H * 0.05, '✕  NEXT', {
                fontFamily: FONT, fontSize: '14px', color: '#c8a87a', letterSpacing: 4,
            }).setOrigin(0, 0.5).setAlpha(0.5)

            this.cameras.main.fadeIn(600, 0, 0, 0)
            this.index = -1
            this.leaving = false
            this.showPanel(0)

            // ✕ / click: next panel (the narration keeps playing underneath)
            const next = () => this.advance()
            listen(this, 'confirm', next)
            this.input.on('pointerdown', next)
        }

        showPanel(index) {
            const panel = this.panels[index]
            this.index = index
            this.counterText.setText(`${index + 1} / ${this.panels.length}`)
            this.panelImage.setTexture(panel.key).setAlpha(0)
            const base = Math.min((W * 0.9) / this.panelImage.width, (H * 0.85) / this.panelImage.height)
            this.panelImage.setScale(base)
            this.narrationText.setAlpha(1)

            // slow zoom (Ken Burns) while it fades in
            this.zoom = this.tweens.add({ targets: this.panelImage, alpha: 1, scale: base * 1.08, duration: panel.duration, ease: 'Linear' })

            // typewriter text, finishing ~2 s before the panel ends
            const delay = Math.max(20, (panel.duration - 2000) / panel.text.length)
            this.typeTimer?.remove()
            this.narrationText.setText('')
            let i = 0
            this.typeTimer = this.time.addEvent({
                delay, repeat: panel.text.length - 1,
                callback: () => { this.narrationText.text += panel.text[i++] },
            })

            this.panelTimer?.remove()
            this.panelTimer = this.time.delayedCall(panel.duration, () => this.advance())
        }

        advance() {
            if (this.leaving || this.fading) return
            this.panelTimer?.remove()
            this.typeTimer?.remove()
            this.fading = true
            this.tweens.add({
                targets: [this.panelImage, this.narrationText],
                alpha: 0,
                duration: 600,
                onComplete: () => {
                    this.fading = false
                    this.zoom?.remove()
                    if (this.index + 1 < this.panels.length) this.showPanel(this.index + 1)
                    else this.endIntro()
                },
            })
        }

        endIntro() {
            this.leaving = true
            this.tweens.add({ targets: [this.ambience, this.narration], volume: 0, duration: 1500 })
            this.cameras.main.fadeOut(1500, 0, 0, 0)
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.ambience.stop()
                this.narration.stop()
                this.scene.start('GameScene')
            })
        }
    }

    // ---- the first playable street ----------------------------------------------
    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene') }

        preload() {
            this.load.image('background', BASE + 'bg.webp')
            // 6 x 6 run cycle; frames are half the original size (360 x 544 -> 180 x 272)
            this.load.spritesheet('sbu', BASE + 'sprite.webp', { frameWidth: 180, frameHeight: 272 })
        }

        create() {
            this.input_ = this.registry.get('input')
            this.speed = 350

            this.add.image(0, 0, 'background').setOrigin(0).setDisplaySize(W, H)

            this.player = this.physics.add.sprite(120, H - 160, 'sbu').setOrigin(0).setScale(0.5)
            this.player.body.setSize(60, 110).setOffset(60, 150)
            this.player.body.gravity.y = 2000
            this.player.setCollideWorldBounds(true)

            // invisible ground
            const ground = this.add.rectangle(W / 2, H - 10, W, 20, 0x000000, 0)
            this.physics.add.existing(ground, true)
            this.physics.add.collider(this.player, ground)

            if (!this.anims.exists('run')) {
                this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('sbu', { start: 0, end: 35 }), frameRate: 15, repeat: -1 })
                this.anims.create({ key: 'idle', frames: [{ key: 'sbu', frame: 0 }], frameRate: 1, repeat: -1 })
            }

            // a quiet label: this is a demo slice of a game in progress
            this.add.text(24, 20, 'ILIFA  ·  DEMO, WORK IN PROGRESS', {
                fontFamily: FONT, fontSize: '16px', color: '#ffe9c2', letterSpacing: 3,
                stroke: '#1a0533', strokeThickness: 4,
            }).setAlpha(0.8)

            const help = this.add.text(W / 2, H * 0.14, '← →  RUN        ↑ / ✕  JUMP', {
                fontFamily: FONT, fontSize: '26px', color: GOLD, letterSpacing: 4,
                stroke: '#0a0118', strokeThickness: 6,
            }).setOrigin(0.5).setAlpha(0)
            this.tweens.chain({ tweens: [
                { targets: help, alpha: 1, duration: 600, delay: 400 },
                { targets: help, alpha: 0, duration: 800, delay: 4000 },
            ] })

            this.cameras.main.fadeIn(800, 0, 0, 0)
        }

        update() {
            const input = this.input_
            const body = this.player.body
            const onGround = body.blocked.down || body.touching.down

            if (input.isDown('left')) {
                this.player.setVelocityX(-this.speed).setFlipX(true)
                this.player.anims.play('run', true)
            } else if (input.isDown('right')) {
                this.player.setVelocityX(this.speed).setFlipX(false)
                this.player.anims.play('run', true)
            } else {
                this.player.setVelocityX(0)
                this.player.anims.play('idle', true)
            }

            if ((input.isDown('up') || input.isDown('jump')) && onGround) this.player.setVelocityY(-950)
        }
    }

    window.ILIFA_GAME = {
        W, H,
        create({ parent, input, onQuit }) {
            const game = new Phaser.Game({
                type: Phaser.AUTO,
                parent,
                width: W,
                height: H,
                backgroundColor: '#0a0118',
                scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
                physics: { default: 'arcade', arcade: { gravity: { y: 1500 } } },
                input: { keyboard: false },          // keys come from the XMB
                audio: { disableWebAudio: false },
                banner: false,
                scene: [MainMenuScene, IntroScene, GameScene],
                callbacks: {
                    preBoot: (g) => { g.registry.set('input', input); g.registry.set('onQuit', onQuit) },
                },
            })
            return game
        },
    }
})()
