import pt from '../../../src/i18n/messages/pt-BR/face_check.json'
import en from '../../../src/i18n/messages/en-US/face_check.json'
import es from '../../../src/i18n/messages/es-ES/face_check.json'

const token = 'd'.repeat(64)
const path = `/api/face_check/capture/${token}`
const challenges = ['turnLeft', 'turnRight', 'closer'] as const
const planId = '11111111-1111-4111-8111-111111111111'
const session = {
  token,
  agencyName: 'Synthetic agency',
  reference: 'Synthetic property',
  acceptedDocument: 'RG',
  status: 'IN_PROGRESS',
  captureMode: 'camera',
  allowGalleryUpload: false,
  attemptsLeft: 3,
  maxAttempts: 3,
  expiresAt: '2099-11-08T12:00:00Z',
  redoReason: null,
}

// Synthetic camera and API only: no real images, saved consent, evidence or host sound.
describe('click-initiated liveness poses', () => {
  for (const [locale, messages, failRight, failBack] of [
    ['pt', pt, false, false],
    ['en', en, false, false],
    ['es', es, false, false],
    ['pt', pt, true, false],
    ['pt', pt, false, true],
  ] as const) {
    it(`${locale}: Next shows instructions and Capture starts the countdown${failRight ? ' and resumes a failed right without repeating left' : failBack ? ' and retakes only a rejected back' : ''}`, () => {
      const captures: string[] = []
      const tones: number[] = []
      let step = 0
      let failed = false
      let starts = 0
      let uploads = 0
      let submitted = false
      let backRejected = false
      const documentSides: string[] = []
      cy.viewport(failRight ? 390 : 1440, 900)
      cy.intercept('GET', path, { body: session })
      cy.intercept('POST', `${path}/consent`, { body: session })
      cy.intercept('POST', `${path}/document`, (request) => {
        uploads++
        const body =
          typeof request.body === 'string' ? request.body : new TextDecoder().decode(request.body)
        const side = body.match(/name="side"\r\n\r\n([^\r]+)/)?.[1]
        documentSides.push(side!)
        if (failBack && side === 'back' && !backRejected) {
          backRejected = true
          request.reply({
            statusCode: 422,
            body: { error: { code: 'PHOTO_REJECTED', reason: 'documentTextNotFound' } },
          })
          return
        }
        request.reply({ statusCode: 204 })
      })
      cy.intercept('POST', `${path}/framing`, {
        body: { width: 640, height: 360, faceCount: 0, face: null },
      })
      cy.intercept('POST', `${path}/liveness`, (request) => {
        uploads++
        request.reply({ statusCode: 204 })
      })
      cy.intercept('GET', `${path}/status`, (request) =>
        request.reply({
          body: {
            status: submitted ? 'REVIEW' : 'IN_PROGRESS',
            progress: submitted ? 100 : 0,
            attemptsLeft: 3,
            redoReason: null,
          },
        }),
      )
      cy.intercept('POST', `${path}/submit`, (request) => {
        submitted = true
        request.reply({
          body: { status: 'REVIEW', progress: 100, attemptsLeft: 3, redoReason: null },
        })
      }).as('submitted')
      cy.intercept('POST', `${path}/liveness-plan`, {
        body: { planId, expiresAt: '2099-11-08T12:00:00Z', challenges, step: 0 },
      }).as('plan')
      cy.intercept('GET', `${path}/challenges`, { body: { challenges } })
      cy.intercept('POST', `${path}/liveness-start`, (request) => {
        starts++
        expect(request.body).to.deep.equal({ planId })
        request.reply({ body: { challenges, step } })
      })
      cy.intercept('POST', `${path}/liveness-frame`, (request) => {
        const body =
          typeof request.body === 'string' ? request.body : new TextDecoder().decode(request.body)
        const challenge = body.match(/name="challenge"\r\n\r\n([^\r]+)/)?.[1]
        expect(challenge).to.equal(challenges[step])
        captures.push(challenge!)
        if (failRight && challenge === 'turnRight' && !failed) {
          failed = true
          request.reply({
            statusCode: 422,
            body: { error: { code: 'LIVENESS_FAILED', reason: 'livenessNotTurned' } },
          })
          return
        }
        step++
        request.reply({ body: { remaining: challenges.length - step } })
      }).as('movement')
      cy.visit(`/${locale}/face_check/verify/${token}`, {
        onBeforeLoad(win) {
          Object.defineProperty(win, 'AudioContext', {
            configurable: true,
            value: class {
              state = 'running'
              currentTime = 0
              destination = {}
              async resume() {}
              async close() {
                this.state = 'closed'
              }
              createOscillator() {
                return {
                  type: 'sine',
                  frequency: { setValueAtTime: (value: number) => tones.push(value) },
                  connect() {},
                  disconnect() {},
                  start() {},
                  onended: null as (() => void) | null,
                  stop() {
                    this.onended?.()
                  },
                }
              }
              createGain() {
                return {
                  gain: { setValueAtTime() {}, linearRampToValueAtTime() {} },
                  connect() {},
                  disconnect() {},
                }
              }
            },
          })
          const sensor = win.document.createElement('canvas')
          sensor.width = 1280
          sensor.height = 720
          const context = sensor.getContext('2d')!
          const paint = () => {
            context.fillStyle = '#375abc'
            context.fillRect(0, 0, 1280, 720)
          }
          paint()
          const stream = sensor.captureStream(10)
          win.setInterval(paint, 100)
          Object.defineProperty(win.navigator, 'mediaDevices', {
            configurable: true,
            value: { getUserMedia: async () => stream.clone() },
          })
        },
      })
      cy.contains('button', messages.capture.consent.start).click()
      cy.get('[role="dialog"] input[type="checkbox"]').check()
      cy.contains('button', messages.capture.consent.continue).click()
      cy.contains('button', messages.capture.camera.enable).click()
      cy.get('video').should('have.prop', 'videoWidth', 1280)
      cy.get(`button[aria-label="${messages.capture.document.shutter}"]`).click()
      cy.contains('h1', messages.capture.document.titleBack.replace('{doc}', 'RG')).should(
        'be.visible',
      )
      cy.get(`button[aria-label="${messages.capture.document.shutter}"]`).click()
      cy.contains('button', messages.capture.documentReview.confirm).click()
      cy.contains('button', messages.capture.live.takeSelfie).click()
      cy.contains(
        '[role="status"]',
        messages.capture.live.captureIn.replace('{seconds}', '3'),
      ).should('be.visible')
      cy.contains('h1', messages.capture.live.reviewSelfie).should('be.visible')
      // Waiting longer than a countdown must never start another pose.
      cy.wait(3200)
      cy.then(() => expect(tones.filter((value) => value === 880)).to.have.length(1))
      for (let index = 0; index < challenges.length; index++) {
        cy.contains('button', messages.capture.live.nextPose).should('be.enabled').click()
        cy.contains('h1', messages.capture.selfie.titles[challenges[index]]).should('be.visible')
        cy.contains('button', messages.capture.live.startMovements).should('be.enabled')
        if (index === 0) {
          cy.wait(3200)
          cy.then(() => expect(tones.filter((value) => value === 880)).to.have.length(1))
          cy.get('[role="status"]').should('not.exist')
        }
        cy.contains('button', messages.capture.live.startMovements).click()
        cy.contains(
          '[role="status"]',
          messages.capture.live.captureIn.replace('{seconds}', '3'),
        ).should('be.visible')
        cy.contains('h1', messages.capture.live.poseCaptured).should('be.visible')
        cy.then(() => expect(tones.filter((value) => value === 880)).to.have.length(index + 2))
      }
      cy.contains('button', messages.capture.live.reviewCaptures).click()
      cy.then(() => {
        expect(uploads).to.equal(0)
        expect(captures).to.have.length(0)
      })
      cy.get('img').should('have.length.at.least', 6)
      cy.contains('button', messages.capture.review.send).click()
      if (failBack) {
        cy.contains(messages.capture.live.issues.documentTextNotFound).should('be.visible')
        cy.contains('h2', messages.capture.review.photos.back)
          .parent()
          .contains('button', messages.capture.review.retake)
          .click()
        cy.contains('h1', messages.capture.document.titleBack.replace('{doc}', 'RG')).should(
          'be.visible',
        )
        cy.get(`button[aria-label="${messages.capture.document.shutter}"]`)
          .should('be.enabled')
          .click()
        cy.contains('button', messages.capture.review.send).should('be.enabled')
        cy.then(() => expect(tones.filter((value) => value === 880)).to.have.length(4))
        cy.contains('button', messages.capture.review.send).click()
      }
      cy.wait('@movement')
      cy.wait('@movement')
      if (failRight) {
        cy.contains(messages.capture.live.issues.livenessNotTurned).should('be.visible')
        cy.intercept('POST', `${path}/liveness-plan`, {
          body: { planId, expiresAt: '2099-11-08T12:00:00Z', challenges, step: 1 },
        })
        cy.contains('h2', messages.capture.review.photos.turnRight)
          .parent()
          .contains('button', messages.capture.review.retake)
          .click()
        cy.contains('button', messages.capture.live.startMovements).click()
        cy.contains('h1', messages.capture.selfie.titles.turnRight).should('be.visible')
        cy.contains('h1', messages.capture.live.poseCaptured).should('be.visible')
        cy.contains('button', messages.capture.live.nextPose).should('be.enabled').click()
        cy.contains('h1', messages.capture.selfie.titles.closer).should('be.visible')
        cy.contains('button', messages.capture.live.startMovements).click()
        cy.contains('h1', messages.capture.live.poseCaptured).should('be.visible')
        cy.contains('button', messages.capture.live.reviewCaptures).click()
        cy.contains('button', messages.capture.review.send).click()
        cy.wait('@movement')
      }
      cy.wait('@movement')
      cy.wait('@submitted')
      cy.then(() => {
        expect(captures).to.deep.equal(
          failRight ? ['turnLeft', 'turnRight', 'turnRight', 'closer'] : challenges,
        )
        expect(starts).to.equal(failRight ? 2 : 1)
        expect(documentSides).to.deep.equal(
          failBack ? ['front', 'back', 'back'] : ['front', 'back'],
        )
        expect(tones.filter((value) => value === 600)).to.have.length(failRight ? 18 : 12)
        expect(tones.filter((value) => value === 880)).to.have.length(failRight ? 6 : 4)
      })
    })
  }
})
