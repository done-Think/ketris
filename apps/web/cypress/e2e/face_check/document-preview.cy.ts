import pt from '../../../src/i18n/messages/pt-BR/face_check.json'
import en from '../../../src/i18n/messages/en-US/face_check.json'
import es from '../../../src/i18n/messages/es-ES/face_check.json'
import { grabVideoFrame } from '../../../src/modules/face_check/utils/image-capture'

const token = 'e'.repeat(64)
const capturePath = `/api/face_check/capture/${token}`
const session = {
  token,
  agencyName: 'Synthetic agency',
  reference: 'Synthetic property',
  acceptedDocument: 'ANY',
  status: 'CREATED',
  captureMode: 'camera',
  allowGalleryUpload: false,
  attemptsLeft: 3,
  maxAttempts: 3,
  expiresAt: '2099-11-08T12:00:00Z',
  redoReason: null,
}

function assertUncroppedPreview(aspectRatio: number) {
  cy.get('video').should(($video) => {
    const video = $video[0]
    const frame = video.parentElement!
    const bounds = frame.getBoundingClientRect()
    expect(bounds.width / bounds.height).to.be.closeTo(aspectRatio, 0.02)
    expect(getComputedStyle(video).objectFit).to.equal('contain')
    const guide = frame.querySelector('[aria-hidden="true"]')!.getBoundingClientRect()
    expect(guide.left).to.be.at.least(bounds.left)
    expect(guide.right).to.be.at.most(bounds.right)
    expect(guide.top).to.be.at.least(bounds.top)
    expect(guide.bottom).to.be.at.most(bounds.bottom)
  })
}

// All pixels and API replies are synthetic; this suite never opens a physical webcam
// or sends a document, consent or signature to the application backend.
describe('document camera framing and front-to-back capture', () => {
  for (const [locale, messages, width, height] of [
    ['pt', pt, 1280, 720],
    ['en', en, 1920, 1080],
    ['es', es, 1280, 720],
  ] as const) {
    it(`preserves ${width} × ${height} pixels and advances to the RG back in ${locale}`, () => {
      let sensor!: HTMLCanvasElement
      cy.viewport(1440, 900)
      cy.intercept('GET', capturePath, { body: session })
      cy.intercept('POST', `${capturePath}/consent`, { body: session })
      cy.intercept('POST', `${capturePath}/document`, {
        body: { ...session, status: 'IN_PROGRESS' },
      }).as('documentUpload')
      cy.visit(`/${locale}/face_check/verify/${token}`, {
        onBeforeLoad(win) {
          sensor = win.document.createElement('canvas')
          sensor.width = width
          sensor.height = height
          const context = sensor.getContext('2d')!
          const paint = () => {
            context.fillStyle = '#375abc'
            context.fillRect(0, 0, sensor.width, sensor.height)
            context.fillStyle = '#fff'
            context.font = '60px sans-serif'
            context.fillText('SYNTHETIC FRAME', 120, 120)
          }
          paint()
          const stream = sensor.captureStream(15)
          win.setInterval(paint, 65)
          Object.defineProperty(win.navigator, 'mediaDevices', {
            configurable: true,
            value: {
              getUserMedia: async (constraints: MediaStreamConstraints) => {
                expect(constraints.audio).to.equal(false)
                return stream.clone()
              },
            },
          })
        },
      })
      cy.contains('button', messages.capture.consent.start).click()
      cy.get('[role="dialog"] input[type="checkbox"]').check()
      cy.contains('button', messages.capture.consent.continue).click()
      cy.contains('button', messages.capture.camera.enable).click()
      cy.contains(messages.capture.document.rgFrontHint).should('be.visible')
      cy.get('video').should('have.prop', 'videoWidth', width)
      assertUncroppedPreview(width / height)
      cy.contains('button', messages.capture.live.portrait).click()
      assertUncroppedPreview(width / height)
      cy.get('video')
        .then(($video) => grabVideoFrame($video[0]))
        .then(async (blob) => {
          const image = await createImageBitmap(blob)
          expect(image.width).to.equal(width)
          expect(image.height).to.equal(height)
          expect(blob.size).to.be.at.most(3 * 1024 * 1024)
          image.close()
        })
      cy.get(`button[aria-label="${messages.capture.document.shutter}"]`).click()
      cy.get('@documentUpload.all').should('have.length', 0)
      cy.contains('h1', messages.capture.document.titleBack.replace('{doc}', 'RG'))
        .scrollIntoView()
        .should('be.visible')
      cy.contains(messages.capture.document.rgBackHint).should('be.visible')
      cy.viewport(390, 844)
      cy.then(() => {
        sensor.width = 720
        sensor.height = 1280
      })
      cy.get('video').should('have.prop', 'videoWidth', 720).and('have.prop', 'videoHeight', 1280)
      assertUncroppedPreview(9 / 16)
    })
  }
})
